//! Tauri command bridge for the `stem-data` crate: generic typed queries and
//! mutations for every entity, plus `claude_probe` for the Settings screen.
//!
//! Each command opens a `Db` connection, does its work, and drops the connection.
//! This is intentionally simple — no connection pooling — which is fine for a
//! single-user desktop app with low query concurrency.

use serde::Serialize;
use std::path::PathBuf;
use std::sync::Mutex;
use tauri::{Manager, State};

use stem_data::{
    Db, Mastery, NewMastery, NewNote, NewPracticeAttempt, NewReviewSchedule, NewTopic,
    Note, PracticeAttempt, ReviewSchedule, Topic,
};

// ── DB state (lazy path resolution) ──────────────────────────────────────────

pub struct DbState(Mutex<Option<PathBuf>>);

impl DbState {
    pub fn new() -> Self {
        DbState(Mutex::new(None))
    }
}

fn db_path(app: &tauri::AppHandle, state: &DbState) -> Result<PathBuf, String> {
    let mut guard = state.0.lock().unwrap();
    if let Some(p) = &*guard {
        return Ok(p.clone());
    }
    let base = app.path().app_data_dir().map_err(|e| e.to_string())?;
    std::fs::create_dir_all(&base).map_err(|e| e.to_string())?;
    let path = base.join("stem.db");
    *guard = Some(path.clone());
    Ok(path)
}

fn open_db(app: &tauri::AppHandle, state: &DbState) -> Result<Db, String> {
    let path = db_path(app, state)?;
    Db::open(&path).map_err(|e| e.to_string())
}

// ── Topics ────────────────────────────────────────────────────────────────────

/// List topics, optionally filtered by subject.
/// When no subject is given an empty list is returned — the frontend always
/// specifies a subject in the current design.
#[tauri::command]
pub fn db_topics_list(
    subject: Option<String>,
    app: tauri::AppHandle,
    state: State<'_, DbState>,
) -> Result<Vec<Topic>, String> {
    let db = open_db(&app, &state)?;
    match subject {
        Some(s) => db.topics().list_by_subject(&s).map_err(|e| e.to_string()),
        None => Ok(vec![]),
    }
}

#[tauri::command]
pub fn db_topics_get(
    id: String,
    app: tauri::AppHandle,
    state: State<'_, DbState>,
) -> Result<Topic, String> {
    let db = open_db(&app, &state)?;
    db.topics().get_by_id(&id).map_err(|e| e.to_string())
}

/// Insert a topic, silently ignoring duplicate IDs (idempotent seed/import).
#[tauri::command]
pub fn db_topics_upsert(
    topic: NewTopic,
    app: tauri::AppHandle,
    state: State<'_, DbState>,
) -> Result<(), String> {
    let db = open_db(&app, &state)?;
    db.topics().insert_or_ignore(&topic).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn db_topics_delete(
    id: String,
    app: tauri::AppHandle,
    state: State<'_, DbState>,
) -> Result<(), String> {
    let db = open_db(&app, &state)?;
    db.topics().delete(&id).map_err(|e| e.to_string())
}

// ── Mastery ───────────────────────────────────────────────────────────────────

#[tauri::command]
pub fn db_mastery_get(
    topic_id: String,
    app: tauri::AppHandle,
    state: State<'_, DbState>,
) -> Result<Option<Mastery>, String> {
    let db = open_db(&app, &state)?;
    match db.mastery().get_by_topic(&topic_id) {
        Ok(m) => Ok(Some(m)),
        Err(stem_data::Error::NotFound) => Ok(None),
        Err(e) => Err(e.to_string()),
    }
}

#[tauri::command]
pub fn db_mastery_upsert(
    mastery: NewMastery,
    app: tauri::AppHandle,
    state: State<'_, DbState>,
) -> Result<(), String> {
    let db = open_db(&app, &state)?;
    db.mastery().upsert(&mastery).map_err(|e| e.to_string())
}

// ── Practice attempts ─────────────────────────────────────────────────────────

#[tauri::command]
pub fn db_practice_insert(
    attempt: NewPracticeAttempt,
    app: tauri::AppHandle,
    state: State<'_, DbState>,
) -> Result<i64, String> {
    let db = open_db(&app, &state)?;
    db.practice_attempts().insert(&attempt).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn db_practice_list(
    topic_id: String,
    app: tauri::AppHandle,
    state: State<'_, DbState>,
) -> Result<Vec<PracticeAttempt>, String> {
    let db = open_db(&app, &state)?;
    db.practice_attempts().list_by_topic(&topic_id).map_err(|e| e.to_string())
}

// ── Review schedule ───────────────────────────────────────────────────────────

#[tauri::command]
pub fn db_review_get(
    topic_id: String,
    app: tauri::AppHandle,
    state: State<'_, DbState>,
) -> Result<Option<ReviewSchedule>, String> {
    let db = open_db(&app, &state)?;
    match db.review_schedule().get_by_topic(&topic_id) {
        Ok(s) => Ok(Some(s)),
        Err(stem_data::Error::NotFound) => Ok(None),
        Err(e) => Err(e.to_string()),
    }
}

#[tauri::command]
pub fn db_review_list_due(
    before_iso: String,
    app: tauri::AppHandle,
    state: State<'_, DbState>,
) -> Result<Vec<ReviewSchedule>, String> {
    let db = open_db(&app, &state)?;
    db.review_schedule().due_before(&before_iso).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn db_review_upsert(
    schedule: NewReviewSchedule,
    app: tauri::AppHandle,
    state: State<'_, DbState>,
) -> Result<(), String> {
    let db = open_db(&app, &state)?;
    db.review_schedule().upsert(&schedule).map_err(|e| e.to_string())
}

// ── Notes ─────────────────────────────────────────────────────────────────────

#[tauri::command]
pub fn db_notes_list(
    topic_id: Option<String>,
    app: tauri::AppHandle,
    state: State<'_, DbState>,
) -> Result<Vec<Note>, String> {
    let db = open_db(&app, &state)?;
    match topic_id {
        Some(tid) => db.notes().list_by_topic(&tid).map_err(|e| e.to_string()),
        None => db.notes().search("").map_err(|e| e.to_string()),
    }
}

#[tauri::command]
pub fn db_notes_insert(
    note: NewNote,
    app: tauri::AppHandle,
    state: State<'_, DbState>,
) -> Result<i64, String> {
    let db = open_db(&app, &state)?;
    db.notes().insert(&note).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn db_notes_update(
    id: i64,
    note: NewNote,
    app: tauri::AppHandle,
    state: State<'_, DbState>,
) -> Result<(), String> {
    let db = open_db(&app, &state)?;
    db.notes().update(id, &note).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn db_notes_delete(
    id: i64,
    app: tauri::AppHandle,
    state: State<'_, DbState>,
) -> Result<(), String> {
    let db = open_db(&app, &state)?;
    db.notes().delete(id).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn db_notes_search(
    query: String,
    app: tauri::AppHandle,
    state: State<'_, DbState>,
) -> Result<Vec<Note>, String> {
    let db = open_db(&app, &state)?;
    db.notes().search(&query).map_err(|e| e.to_string())
}

// ── Settings ──────────────────────────────────────────────────────────────────

#[tauri::command]
pub fn db_settings_get(
    key: String,
    app: tauri::AppHandle,
    state: State<'_, DbState>,
) -> Result<Option<String>, String> {
    let db = open_db(&app, &state)?;
    match db.settings().get(&key) {
        Ok(s) => Ok(Some(s.value)),
        Err(stem_data::Error::NotFound) => Ok(None),
        Err(e) => Err(e.to_string()),
    }
}

#[tauri::command]
pub fn db_settings_set(
    key: String,
    value: String,
    app: tauri::AppHandle,
    state: State<'_, DbState>,
) -> Result<(), String> {
    let db = open_db(&app, &state)?;
    db.settings().set(&key, &value).map_err(|e| e.to_string())
}

// ── Claude probe ──────────────────────────────────────────────────────────────

#[derive(Serialize)]
pub struct ClaudeProbe {
    pub found: bool,
    pub path: Option<String>,
    pub version: Option<String>,
}

/// Probe for the `claude` CLI: detect it on PATH and capture its version string.
/// Used by the Settings screen to show installation status.
#[tauri::command]
pub fn claude_probe() -> ClaudeProbe {
    match crate::shell::find_claude() {
        Err(_) => ClaudeProbe { found: false, path: None, version: None },
        Ok(path) => {
            let version = std::process::Command::new(&path)
                .arg("--version")
                .output()
                .ok()
                .and_then(|o| String::from_utf8(o.stdout).ok())
                .map(|s| s.trim().to_string());
            ClaudeProbe { found: true, path: Some(path), version }
        }
    }
}
