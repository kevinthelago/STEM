//! Tutor protocol: operating-prompt injection, typed request formatters, and the
//! streaming tagged-block parser that extracts `<problem>`, `<grade>`, `<mastery>`,
//! and `<viz>` blocks from chunked PTY output.
//!
//! The parser buffers partial tags across chunk boundaries, strips ANSI escape
//! codes from the accumulation buffer (leaving raw bytes intact for xterm.js),
//! and times out unclosed blocks after 5 seconds.

use serde::Serialize;
use tauri::State;

use crate::pty::{is_prompt_injected, mark_prompt_injected, write_to_session, PtyState};

// ── Operating prompt ──────────────────────────────────────────────────────────

const OPERATING_PROMPT_TEMPLATE: &str = include_str!("../templates/operating-prompt.md");

pub(crate) fn build_operating_prompt(
    topic_title: &str,
    topic_description: &str,
    objectives: &str,
) -> String {
    OPERATING_PROMPT_TEMPLATE
        .replace("{topic_title}", topic_title)
        .replace("{topic_description}", topic_description)
        .replace("{objectives}", objectives)
}

// ── Typed block events emitted to the frontend ────────────────────────────────

#[derive(Debug, Serialize, Clone)]
#[serde(tag = "kind", rename_all = "camelCase")]
pub enum TutorBlock {
    Problem { content: String },
    Grade { score: u8, correct: bool, feedback: String },
    Mastery { level: f64, confidence: f64, notes: String },
    Viz { viz_type: String, config: serde_json::Value },
    ParseError { tag: String, reason: String },
}

/// A parsed block ready to emit as a Tauri event.
pub struct PtyEvent {
    block: TutorBlock,
}

impl PtyEvent {
    pub fn event_name(&self) -> &'static str {
        match &self.block {
            TutorBlock::Problem { .. } => "stem://tutor/problem",
            TutorBlock::Grade { .. } => "stem://tutor/grade",
            TutorBlock::Mastery { .. } => "stem://tutor/mastery",
            TutorBlock::Viz { .. } => "stem://tutor/viz",
            TutorBlock::ParseError { .. } => "stem://tutor/parse-error",
        }
    }

    pub fn payload(&self, topic_id: &str) -> serde_json::Value {
        let mut v = serde_json::to_value(&self.block).unwrap_or_default();
        if let Some(obj) = v.as_object_mut() {
            obj.insert("topicId".to_string(), serde_json::Value::String(topic_id.to_string()));
        }
        v
    }
}

// ── Streaming block parser ────────────────────────────────────────────────────

#[derive(Debug, Clone, Copy, PartialEq)]
enum KnownTag {
    Problem,
    Grade,
    Mastery,
    Viz,
}

impl KnownTag {
    const ALL: &'static [(KnownTag, &'static [u8], &'static [u8])] = &[
        (KnownTag::Problem, b"<problem>", b"</problem>"),
        (KnownTag::Grade, b"<grade>", b"</grade>"),
        (KnownTag::Mastery, b"<mastery>", b"</mastery>"),
        (KnownTag::Viz, b"<viz>", b"</viz>"),
    ];

    fn close_tag(self) -> &'static [u8] {
        Self::ALL.iter().find(|(t, ..)| *t == self).unwrap().2
    }

    fn tag_name(self) -> &'static str {
        match self {
            KnownTag::Problem => "problem",
            KnownTag::Grade => "grade",
            KnownTag::Mastery => "mastery",
            KnownTag::Viz => "viz",
        }
    }
}

/// Streaming parser that accumulates ANSI-stripped output and extracts typed blocks.
///
/// Call `feed(chunk)` for each PTY read; it returns a `Vec<PtyEvent>` for any
/// blocks that completed in this chunk. Unclosed blocks older than `TIMEOUT` are
/// discarded with a `ParseError` event.
pub struct BlockParser {
    /// Accumulates ANSI-stripped bytes for tag scanning.
    stripped_buf: Vec<u8>,
    /// Current open block, if any: (tag, byte-offset of content start in stripped_buf).
    open_block: Option<(KnownTag, usize, std::time::Instant)>,
    /// Byte offset in stripped_buf through which we have already scanned for open tags.
    scan_from: usize,
}

const BLOCK_TIMEOUT: std::time::Duration = std::time::Duration::from_secs(5);
/// Maximum bytes to retain in stripped_buf after processing to bound memory.
const MAX_BUF: usize = 256 * 1024;

impl BlockParser {
    pub fn new() -> Self {
        BlockParser {
            stripped_buf: Vec::new(),
            open_block: None,
            scan_from: 0,
        }
    }

    pub fn feed(&mut self, chunk: &[u8]) -> Vec<PtyEvent> {
        let mut events = Vec::new();

        // Strip ANSI codes and append to accumulation buffer.
        let stripped = strip_ansi(chunk);
        self.stripped_buf.extend_from_slice(&stripped);

        loop {
            // Check timeout on any open block.
            if let Some((tag, _, opened_at)) = self.open_block {
                if opened_at.elapsed() > BLOCK_TIMEOUT {
                    log::warn!("tutor: block <{}> timed out without closing tag", tag.tag_name());
                    events.push(PtyEvent {
                        block: TutorBlock::ParseError {
                            tag: tag.tag_name().to_string(),
                            reason: "unclosed tag timed out after 5 seconds".to_string(),
                        },
                    });
                    self.open_block = None;
                    self.compact_buf();
                }
            }

            if let Some((tag, content_start, _)) = self.open_block {
                // We're inside a block — look for the close tag.
                let search_from = if content_start > 2 { content_start - 2 } else { 0 };
                if let Some(close_pos) = memmem(&self.stripped_buf[search_from..], tag.close_tag()) {
                    let content_end = search_from + close_pos;
                    let content =
                        String::from_utf8_lossy(&self.stripped_buf[content_start..content_end])
                            .trim()
                            .to_string();
                    match parse_block(tag, content) {
                        Ok(block) => events.push(PtyEvent { block }),
                        Err(reason) => events.push(PtyEvent {
                            block: TutorBlock::ParseError {
                                tag: tag.tag_name().to_string(),
                                reason,
                            },
                        }),
                    }
                    // Advance past the close tag.
                    let after_close =
                        search_from + close_pos + tag.close_tag().len();
                    self.scan_from = after_close.min(self.stripped_buf.len());
                    self.open_block = None;
                    self.compact_buf();
                    // Continue scanning from the new position.
                    continue;
                }
                // Close tag not yet seen — wait for more bytes.
                break;
            } else {
                // Not in a block — scan for the next open tag.
                let buf = &self.stripped_buf[self.scan_from..];
                let mut found = false;
                for &(tag, open, _) in KnownTag::ALL {
                    if let Some(pos) = memmem(buf, open) {
                        let abs_start = self.scan_from + pos + open.len();
                        self.open_block = Some((tag, abs_start, std::time::Instant::now()));
                        self.scan_from = abs_start;
                        found = true;
                        break;
                    }
                }
                if !found {
                    // Advance scan_from to just before the last few bytes (a tag could
                    // start at the very end of the buffer and we'd miss it if we discard).
                    let longest_open = KnownTag::ALL
                        .iter()
                        .map(|(_, o, _)| o.len())
                        .max()
                        .unwrap_or(0);
                    let safe = self.stripped_buf.len().saturating_sub(longest_open);
                    self.scan_from = self.scan_from.max(safe);
                    break;
                }
            }
        }

        // Bound memory usage.
        if self.stripped_buf.len() > MAX_BUF {
            self.compact_buf();
        }

        events
    }

    fn compact_buf(&mut self) {
        let keep_from = self
            .open_block
            .map(|(_, content_start, _)| {
                // Keep from just before content_start so we don't lose partial close tags.
                content_start.saturating_sub(32)
            })
            .unwrap_or(self.scan_from);
        if keep_from > 0 {
            let old_len = self.stripped_buf.len();
            self.stripped_buf.drain(..keep_from);
            let removed = keep_from.min(old_len);
            if let Some((_, cs, _)) = &mut self.open_block {
                *cs = cs.saturating_sub(removed);
            }
            self.scan_from = self.scan_from.saturating_sub(removed);
        }
    }
}

fn parse_block(tag: KnownTag, content: String) -> Result<TutorBlock, String> {
    match tag {
        KnownTag::Problem => Ok(TutorBlock::Problem { content }),
        KnownTag::Grade => {
            #[derive(serde::Deserialize)]
            struct GradePayload {
                score: u8,
                correct: bool,
                feedback: String,
            }
            let p: GradePayload = serde_json::from_str(&content)
                .map_err(|e| format!("invalid grade JSON: {e}"))?;
            Ok(TutorBlock::Grade { score: p.score, correct: p.correct, feedback: p.feedback })
        }
        KnownTag::Mastery => {
            #[derive(serde::Deserialize)]
            struct MasteryPayload {
                level: f64,
                confidence: f64,
                notes: String,
            }
            let p: MasteryPayload = serde_json::from_str(&content)
                .map_err(|e| format!("invalid mastery JSON: {e}"))?;
            Ok(TutorBlock::Mastery {
                level: p.level.clamp(0.0, 1.0),
                confidence: p.confidence.clamp(0.0, 1.0),
                notes: p.notes,
            })
        }
        KnownTag::Viz => {
            #[derive(serde::Deserialize)]
            struct VizPayload {
                #[serde(rename = "type")]
                viz_type: String,
                #[serde(flatten)]
                config: serde_json::Map<String, serde_json::Value>,
            }
            let p: VizPayload = serde_json::from_str(&content)
                .map_err(|e| format!("invalid viz JSON: {e}"))?;
            let allowed = ["2d-plot", "3d-surface", "3d-vector", "matrix", "graph"];
            if !allowed.contains(&p.viz_type.as_str()) {
                return Err(format!("unknown viz type: {}", p.viz_type));
            }
            Ok(TutorBlock::Viz {
                viz_type: p.viz_type,
                config: serde_json::Value::Object(p.config),
            })
        }
    }
}

// ── ANSI escape code stripper ─────────────────────────────────────────────────

fn strip_ansi(input: &[u8]) -> Vec<u8> {
    let mut out = Vec::with_capacity(input.len());
    let mut i = 0;
    while i < input.len() {
        if input[i] == 0x1b {
            i += 1;
            if i >= input.len() {
                break;
            }
            match input[i] {
                b'[' => {
                    // CSI sequence: ESC [ <params> <final byte 0x40–0x7e>
                    i += 1;
                    while i < input.len() {
                        let b = input[i];
                        i += 1;
                        if (0x40..=0x7e).contains(&b) {
                            break;
                        }
                    }
                }
                b']' => {
                    // OSC sequence: ESC ] <data> BEL or ST (ESC \)
                    i += 1;
                    while i < input.len() {
                        if input[i] == 0x07 {
                            i += 1;
                            break;
                        }
                        if input[i] == 0x1b && i + 1 < input.len() && input[i + 1] == b'\\' {
                            i += 2;
                            break;
                        }
                        i += 1;
                    }
                }
                _ => {
                    // Two-byte escape — skip the second byte.
                    i += 1;
                }
            }
        } else if input[i] == b'\r' {
            // Strip CR (carriage return confuses tag scanning).
            i += 1;
        } else {
            out.push(input[i]);
            i += 1;
        }
    }
    out
}

/// Naive byte-string search (avoids pulling in memchr as a dep).
fn memmem(haystack: &[u8], needle: &[u8]) -> Option<usize> {
    if needle.is_empty() {
        return Some(0);
    }
    haystack
        .windows(needle.len())
        .position(|window| window == needle)
}

// ── Tutor commands ────────────────────────────────────────────────────────────

/// Inject the operating prompt (if needed) then write a formatted message to the PTY.
fn send_tutor_message(
    topic_id: &str,
    topic_title: &str,
    topic_description: &str,
    objectives: &str,
    message: &str,
    state: &PtyState,
) -> Result<(), String> {
    if !is_prompt_injected(state, topic_id) {
        let prompt = build_operating_prompt(topic_title, topic_description, objectives);
        // Send the prompt as the first claude input followed by Enter.
        let mut payload = prompt;
        payload.push('\n');
        write_to_session(state, topic_id, payload.as_bytes())?;
        mark_prompt_injected(state, topic_id);
        // Brief pause to let claude process the context before the actual request.
        std::thread::sleep(std::time::Duration::from_millis(500));
    }
    let mut msg = message.to_string();
    msg.push('\n');
    write_to_session(state, topic_id, msg.as_bytes())
}

/// Ask the tutor to explain a concept.
#[tauri::command]
pub fn tutor_learn(
    topic_id: String,
    topic_title: String,
    topic_description: String,
    objectives: String,
    concept: String,
    state: State<'_, PtyState>,
) -> Result<(), String> {
    let msg = format!("Please teach me about: {concept}");
    send_tutor_message(&topic_id, &topic_title, &topic_description, &objectives, &msg, &state)
}

/// Ask the tutor to generate a practice problem.
#[tauri::command]
pub fn tutor_problem(
    topic_id: String,
    topic_title: String,
    topic_description: String,
    objectives: String,
    difficulty: Option<String>,
    state: State<'_, PtyState>,
) -> Result<(), String> {
    let diff = difficulty.unwrap_or_else(|| "appropriate for my level".to_string());
    let msg = format!("Generate a practice problem at difficulty: {diff}");
    send_tutor_message(&topic_id, &topic_title, &topic_description, &objectives, &msg, &state)
}

/// Submit a student answer for grading.
#[tauri::command]
pub fn tutor_answer(
    topic_id: String,
    topic_title: String,
    topic_description: String,
    objectives: String,
    problem: String,
    answer: String,
    state: State<'_, PtyState>,
) -> Result<(), String> {
    let msg = format!(
        "Problem: {problem}\n\nMy answer: {answer}\n\nPlease grade my answer."
    );
    send_tutor_message(&topic_id, &topic_title, &topic_description, &objectives, &msg, &state)
}

/// Ask the tutor to explain why an answer is right or wrong.
#[tauri::command]
pub fn tutor_explain(
    topic_id: String,
    topic_title: String,
    topic_description: String,
    objectives: String,
    state: State<'_, PtyState>,
) -> Result<(), String> {
    let msg = "Please explain why that answer is correct or incorrect in more detail.";
    send_tutor_message(&topic_id, &topic_title, &topic_description, &objectives, msg, &state)
}

/// Ask the tutor for a visualization of a concept.
#[tauri::command]
pub fn tutor_viz(
    topic_id: String,
    topic_title: String,
    topic_description: String,
    objectives: String,
    concept: String,
    state: State<'_, PtyState>,
) -> Result<(), String> {
    let msg =
        format!("Please provide a visualization that would help me understand: {concept}");
    send_tutor_message(&topic_id, &topic_title, &topic_description, &objectives, &msg, &state)
}

// ── Tests ─────────────────────────────────────────────────────────────────────

#[cfg(test)]
mod tests {
    use super::*;

    fn feed_str(parser: &mut BlockParser, s: &str) -> Vec<PtyEvent> {
        parser.feed(s.as_bytes())
    }

    #[test]
    fn strip_ansi_removes_csi_sequences() {
        let input = b"\x1b[32mhello\x1b[0m world";
        let stripped = strip_ansi(input);
        assert_eq!(stripped, b"hello world");
    }

    #[test]
    fn strip_ansi_removes_osc_sequence() {
        let input = b"\x1b]0;title\x07text";
        let stripped = strip_ansi(input);
        assert_eq!(stripped, b"text");
    }

    #[test]
    fn memmem_finds_needle() {
        assert_eq!(memmem(b"hello world", b"world"), Some(6));
        assert_eq!(memmem(b"hello", b"xyz"), None);
    }

    #[test]
    fn parser_extracts_problem_in_single_chunk() {
        let mut p = BlockParser::new();
        let events = feed_str(
            &mut p,
            "Sure, here is a problem:\n<problem>\nFind the roots of $x^2 - 5x + 6 = 0$.\n</problem>\nLet me know when you are done.",
        );
        assert_eq!(events.len(), 1);
        match &events[0].block {
            TutorBlock::Problem { content } => {
                assert!(content.contains("x^2 - 5x + 6"));
            }
            other => panic!("expected Problem, got {other:?}"),
        }
    }

    #[test]
    fn parser_extracts_grade_with_valid_json() {
        let mut p = BlockParser::new();
        let events = feed_str(
            &mut p,
            r#"<grade>
{"score": 90, "correct": true, "feedback": "Great work!"}
</grade>"#,
        );
        assert_eq!(events.len(), 1);
        match &events[0].block {
            TutorBlock::Grade { score, correct, feedback } => {
                assert_eq!(*score, 90);
                assert!(*correct);
                assert_eq!(feedback, "Great work!");
            }
            other => panic!("expected Grade, got {other:?}"),
        }
    }

    #[test]
    fn parser_extracts_mastery_block() {
        let mut p = BlockParser::new();
        let events = feed_str(
            &mut p,
            r#"<mastery>
{"level": 0.7, "confidence": 0.85, "notes": "Good progress."}
</mastery>"#,
        );
        assert_eq!(events.len(), 1);
        match &events[0].block {
            TutorBlock::Mastery { level, confidence, notes } => {
                assert!((*level - 0.7).abs() < 1e-9);
                assert!((*confidence - 0.85).abs() < 1e-9);
                assert_eq!(notes, "Good progress.");
            }
            other => panic!("expected Mastery, got {other:?}"),
        }
    }

    #[test]
    fn parser_extracts_viz_block() {
        let mut p = BlockParser::new();
        let events = feed_str(
            &mut p,
            r#"<viz>
{"type": "2d-plot", "fn": "x^2", "xRange": [-3, 3]}
</viz>"#,
        );
        assert_eq!(events.len(), 1);
        match &events[0].block {
            TutorBlock::Viz { viz_type, .. } => assert_eq!(viz_type, "2d-plot"),
            other => panic!("expected Viz, got {other:?}"),
        }
    }

    #[test]
    fn parser_handles_chunked_tag() {
        let mut p = BlockParser::new();
        // Split exactly at a tag boundary
        let chunk1 = "<probl";
        let chunk2 = "em>\nFind $x$.\n</prob";
        let chunk3 = "lem>";
        let mut events = feed_str(&mut p, chunk1);
        assert!(events.is_empty());
        events.extend(feed_str(&mut p, chunk2));
        assert!(events.is_empty());
        events.extend(feed_str(&mut p, chunk3));
        assert_eq!(events.len(), 1);
        assert!(matches!(events[0].block, TutorBlock::Problem { .. }));
    }

    #[test]
    fn parser_emits_parse_error_for_bad_grade_json() {
        let mut p = BlockParser::new();
        let events = feed_str(&mut p, "<grade>not json</grade>");
        assert_eq!(events.len(), 1);
        assert!(matches!(events[0].block, TutorBlock::ParseError { .. }));
    }

    #[test]
    fn parser_handles_ansi_in_stream() {
        let mut p = BlockParser::new();
        // ANSI codes wrapping a problem tag
        let events = p.feed(
            b"\x1b[32m<problem>\x1b[0m\nFind $x$.\n</problem>",
        );
        assert_eq!(events.len(), 1);
        assert!(matches!(events[0].block, TutorBlock::Problem { .. }));
    }

    #[test]
    fn parser_extracts_multiple_blocks_sequentially() {
        let mut p = BlockParser::new();
        let input = concat!(
            "<problem>\nFind $x$.\n</problem>\n",
            "<grade>\n{\"score\": 80, \"correct\": true, \"feedback\": \"ok\"}\n</grade>\n",
            "<mastery>\n{\"level\": 0.5, \"confidence\": 0.6, \"notes\": \"mid\"}\n</mastery>"
        );
        let events = feed_str(&mut p, input);
        assert_eq!(events.len(), 3);
        assert!(matches!(events[0].block, TutorBlock::Problem { .. }));
        assert!(matches!(events[1].block, TutorBlock::Grade { .. }));
        assert!(matches!(events[2].block, TutorBlock::Mastery { .. }));
    }

    #[test]
    fn operating_prompt_substitutes_topic() {
        let prompt = build_operating_prompt("Calculus", "Derivatives and integrals", "Understand limits");
        assert!(prompt.contains("Calculus"));
        assert!(!prompt.contains("{topic_title}"));
        assert!(!prompt.contains("{topic_description}"));
        assert!(!prompt.contains("{objectives}"));
    }
}
