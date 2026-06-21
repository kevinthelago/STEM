//! PTY session manager: one persistent session per topic, keyed by topic_id.
//!
//! Each session spawns bash → runs `claude` inside it. A background reader thread
//! pumps output through the tutor block parser and emits Tauri events. The whole
//! process tree (shell + claude + grandchildren) is killed on session close via a
//! Windows Job Object or Unix process-group signal.

use crate::shell::resolve_shell;
use crate::tutor::BlockParser;
use portable_pty::{native_pty_system, CommandBuilder, PtySize};
use std::collections::HashMap;
use std::io::{Read, Write};
use std::sync::Mutex;
use tauri::{AppHandle, Emitter, State};

// ── Process-tree kill — Windows Job Object ────────────────────────────────────

#[cfg(windows)]
struct PtyJob {
    job: windows_sys::Win32::Foundation::HANDLE,
}

#[cfg(windows)]
unsafe impl Send for PtyJob {}

#[cfg(windows)]
impl Drop for PtyJob {
    fn drop(&mut self) {
        unsafe { windows_sys::Win32::Foundation::CloseHandle(self.job); }
    }
}

#[cfg(windows)]
fn create_job_for_pid(pid: u32) -> Option<PtyJob> {
    use windows_sys::Win32::{
        Foundation::INVALID_HANDLE_VALUE,
        System::{
            JobObjects::{
                AssignProcessToJobObject, CreateJobObjectW, JobObjectExtendedLimitInformation,
                SetInformationJobObject, JOBOBJECT_EXTENDED_LIMIT_INFORMATION,
                JOB_OBJECT_LIMIT_KILL_ON_JOB_CLOSE,
            },
            Threading::{OpenProcess, PROCESS_ALL_ACCESS},
        },
    };
    unsafe {
        let job = CreateJobObjectW(std::ptr::null(), std::ptr::null());
        if job.is_null() || job == INVALID_HANDLE_VALUE {
            log::warn!("pty: CreateJobObjectW failed");
            return None;
        }
        let mut info: JOBOBJECT_EXTENDED_LIMIT_INFORMATION = std::mem::zeroed();
        info.BasicLimitInformation.LimitFlags = JOB_OBJECT_LIMIT_KILL_ON_JOB_CLOSE;
        if SetInformationJobObject(
            job,
            JobObjectExtendedLimitInformation,
            &info as *const _ as *const _,
            std::mem::size_of::<JOBOBJECT_EXTENDED_LIMIT_INFORMATION>() as u32,
        ) == 0
        {
            windows_sys::Win32::Foundation::CloseHandle(job);
            log::warn!("pty: SetInformationJobObject failed");
            return None;
        }
        let proc = OpenProcess(PROCESS_ALL_ACCESS, 0, pid);
        if proc.is_null() || proc == INVALID_HANDLE_VALUE {
            windows_sys::Win32::Foundation::CloseHandle(job);
            log::warn!("pty: OpenProcess failed for pid {pid}");
            return None;
        }
        let ok = AssignProcessToJobObject(job, proc);
        windows_sys::Win32::Foundation::CloseHandle(proc);
        if ok == 0 {
            windows_sys::Win32::Foundation::CloseHandle(job);
            log::warn!("pty: AssignProcessToJobObject failed");
            return None;
        }
        Some(PtyJob { job })
    }
}

// ── Process-tree kill — Unix process group ────────────────────────────────────

#[cfg(unix)]
struct PtyJob {
    pgid: libc::pid_t,
}

#[cfg(unix)]
impl Drop for PtyJob {
    fn drop(&mut self) {
        // Safety: SIGKILL to a process group we spawned.
        unsafe { libc::killpg(self.pgid, libc::SIGKILL); }
    }
}

// On neither Unix nor Windows (unlikely but compiles cleanly):
#[cfg(not(any(unix, windows)))]
struct PtyJob;

// ── Session ───────────────────────────────────────────────────────────────────

struct PtySession {
    writer: Box<dyn Write + Send>,
    master: Box<dyn portable_pty::MasterPty + Send>,
    child: Box<dyn portable_pty::Child + Send + Sync>,
    /// Owns the process tree so the whole tree dies when this drops.
    _job: Option<PtyJob>,
    /// True once the STEM operating prompt has been sent to this session.
    pub prompt_injected: bool,
}

// ── Registry ──────────────────────────────────────────────────────────────────

pub struct PtyState(Mutex<HashMap<String, PtySession>>);

impl PtyState {
    pub fn new() -> Self {
        PtyState(Mutex::new(HashMap::new()))
    }

    /// Kill every active session — called on app exit.
    pub fn kill_all(&self) {
        let mut map = self.0.lock().unwrap();
        for (id, mut sess) in map.drain() {
            log::info!("pty: killing session {id} on app exit");
            let _ = sess.child.kill();
            drop(sess._job);
        }
    }
}

// ── Reader thread ─────────────────────────────────────────────────────────────

fn spawn_reader(
    mut reader: Box<dyn Read + Send>,
    topic_id: String,
    app: AppHandle,
) {
    std::thread::spawn(move || {
        let mut parser = BlockParser::new();
        let mut buf = [0u8; 4096];
        loop {
            match reader.read(&mut buf) {
                Ok(0) | Err(_) => {
                    log::debug!("pty: reader EOF for topic {topic_id}");
                    let _ = app.emit("pty-exit", serde_json::json!({ "topicId": topic_id }));
                    break;
                }
                Ok(n) => {
                    let chunk = &buf[..n];
                    // Emit raw bytes for xterm.js immediately.
                    let raw_b64 = base64_encode(chunk);
                    let _ = app.emit(
                        "pty-data",
                        serde_json::json!({ "topicId": &topic_id, "data": raw_b64 }),
                    );
                    // Feed through block parser; emit typed events for completed blocks.
                    for event in parser.feed(chunk) {
                        let _ = app.emit(event.event_name(), event.payload(&topic_id));
                    }
                }
            }
        }
    });
}

/// Minimal base64 encoder for PTY bytes (avoids a heavy dep).
fn base64_encode(input: &[u8]) -> String {
    const CHARS: &[u8] = b"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
    let mut out = Vec::with_capacity((input.len() + 2) / 3 * 4);
    for chunk in input.chunks(3) {
        let b0 = chunk[0] as usize;
        let b1 = chunk.get(1).copied().unwrap_or(0) as usize;
        let b2 = chunk.get(2).copied().unwrap_or(0) as usize;
        out.push(CHARS[(b0 >> 2) & 0x3f]);
        out.push(CHARS[((b0 << 4) | (b1 >> 4)) & 0x3f]);
        out.push(if chunk.len() > 1 { CHARS[((b1 << 2) | (b2 >> 6)) & 0x3f] } else { b'=' });
        out.push(if chunk.len() > 2 { CHARS[b2 & 0x3f] } else { b'=' });
    }
    String::from_utf8(out).unwrap()
}

// ── Commands ──────────────────────────────────────────────────────────────────

/// Create or reuse a PTY session for `topic_id`. If the session already exists
/// this is a no-op (the existing session keeps running).
///
/// Returns an error if `claude` is not found on PATH.
#[tauri::command]
pub fn pty_create(
    topic_id: String,
    cols: u16,
    rows: u16,
    app: AppHandle,
    state: State<'_, PtyState>,
) -> Result<(), String> {
    let mut map = state.0.lock().unwrap();
    if map.contains_key(&topic_id) {
        return Ok(()); // session already alive
    }

    let claude_path = crate::shell::find_claude()?;
    let shell = resolve_shell();

    let pty_sys = native_pty_system();
    let pair = pty_sys
        .openpty(PtySize { rows, cols, pixel_width: 0, pixel_height: 0 })
        .map_err(|e| format!("openpty failed: {e}"))?;

    let reader = pair
        .master
        .try_clone_reader()
        .map_err(|e| format!("PTY reader clone failed: {e}"))?;
    let writer = pair
        .master
        .take_writer()
        .map_err(|e| format!("PTY writer take failed: {e}"))?;

    // Spawn the shell; it will execute `claude` on startup via the startup script.
    let mut cmd = CommandBuilder::new(&shell);
    // Pass claude path via env so the startup line can reference it
    cmd.env("STEM_CLAUDE_PATH", &claude_path);
    // Disable shell greeting noise
    cmd.env("BASH_SILENCE_DEPRECATION_WARNING", "1");

    let child = pair
        .slave
        .spawn_command(cmd)
        .map_err(|e| format!("spawn failed: {e}"))?;

    let pid = child.process_id().unwrap_or(0);

    // Acquire process-tree kill object.
    #[cfg(windows)]
    let job = create_job_for_pid(pid);
    #[cfg(unix)]
    let job = {
        // The shell calls setsid() on startup, making its pid the pgid.
        let pgid = pid as libc::pid_t;
        Some(PtyJob { pgid })
    };
    #[cfg(not(any(unix, windows)))]
    let job: Option<PtyJob> = None;

    // Start the shell, then immediately run claude.
    let mut sess = PtySession {
        writer,
        master: pair.master,
        child,
        _job: job,
        prompt_injected: false,
    };

    // Write the startup line: launch claude inside bash.
    // Small delay not needed — bash reads it from the PTY line-by-line.
    let launch_line = format!(
        "exec \"${{STEM_CLAUDE_PATH:-claude}}\" --model claude-sonnet-4-6\n"
    );
    sess.writer
        .write_all(launch_line.as_bytes())
        .map_err(|e| format!("PTY write failed: {e}"))?;

    map.insert(topic_id.clone(), sess);
    drop(map); // release lock before spawning thread

    spawn_reader(reader, topic_id, app);
    Ok(())
}

/// Write raw bytes to the PTY (e.g. user keystrokes forwarded from xterm.js).
#[tauri::command]
pub fn pty_write(
    topic_id: String,
    data: Vec<u8>,
    state: State<'_, PtyState>,
) -> Result<(), String> {
    let mut map = state.0.lock().unwrap();
    let sess = map.get_mut(&topic_id).ok_or_else(|| format!("no session for topic {topic_id}"))?;
    sess.writer.write_all(&data).map_err(|e| e.to_string())
}

/// Resize the PTY.
#[tauri::command]
pub fn pty_resize(
    topic_id: String,
    cols: u16,
    rows: u16,
    state: State<'_, PtyState>,
) -> Result<(), String> {
    let map = state.0.lock().unwrap();
    let sess = map.get(&topic_id).ok_or_else(|| format!("no session for topic {topic_id}"))?;
    sess.master
        .resize(PtySize { rows, cols, pixel_width: 0, pixel_height: 0 })
        .map_err(|e| e.to_string())
}

/// Kill and remove a PTY session.
#[tauri::command]
pub fn pty_kill(topic_id: String, state: State<'_, PtyState>) -> Result<(), String> {
    let mut map = state.0.lock().unwrap();
    if let Some(mut sess) = map.remove(&topic_id) {
        let _ = sess.child.kill();
        // _job drops here, killing the process tree.
    }
    Ok(())
}

/// List active topic session IDs.
#[tauri::command]
pub fn pty_list(state: State<'_, PtyState>) -> Vec<String> {
    state.0.lock().unwrap().keys().cloned().collect()
}

/// Mark a session's operating prompt as injected (called by tutor module after injection).
pub(crate) fn mark_prompt_injected(state: &PtyState, topic_id: &str) {
    if let Ok(mut map) = state.0.lock() {
        if let Some(sess) = map.get_mut(topic_id) {
            sess.prompt_injected = true;
        }
    }
}

/// True if the session exists and the operating prompt has already been sent.
pub(crate) fn is_prompt_injected(state: &PtyState, topic_id: &str) -> bool {
    state
        .0
        .lock()
        .map(|m| m.get(topic_id).map(|s| s.prompt_injected).unwrap_or(false))
        .unwrap_or(false)
}

/// Write bytes to a session's PTY writer (used by tutor module).
pub(crate) fn write_to_session(
    state: &PtyState,
    topic_id: &str,
    data: &[u8],
) -> Result<(), String> {
    let mut map = state.0.lock().unwrap();
    let sess =
        map.get_mut(topic_id).ok_or_else(|| format!("no session for topic {topic_id}"))?;
    sess.writer.write_all(data).map_err(|e| e.to_string())
}

#[cfg(test)]
mod tests {
    use super::base64_encode;

    #[test]
    fn base64_encode_empty() {
        assert_eq!(base64_encode(b""), "");
    }

    #[test]
    fn base64_encode_hello() {
        // "hello" → "aGVsbG8="
        assert_eq!(base64_encode(b"hello"), "aGVsbG8=");
    }

    #[test]
    fn base64_encode_man() {
        // "Man" → "TWFu"
        assert_eq!(base64_encode(b"Man"), "TWFu");
    }
}
