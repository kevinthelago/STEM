use tauri::{Manager, RunEvent};

mod data;
mod pty;
mod shell;
mod tutor;

// ── App entry point ───────────────────────────────────────────────────────────

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_log::Builder::new().build())
        .plugin(tauri_plugin_opener::init())
        .manage(pty::PtyState::new())
        .manage(data::DbState::new())
        .invoke_handler(tauri::generate_handler![
            // ── PTY session manager ──────────────────────────────────────────
            pty::pty_create,
            pty::pty_write,
            pty::pty_resize,
            pty::pty_kill,
            pty::pty_list,
            // ── Tutor protocol ───────────────────────────────────────────────
            tutor::tutor_learn,
            tutor::tutor_problem,
            tutor::tutor_answer,
            tutor::tutor_explain,
            tutor::tutor_viz,
            // ── Data layer — topics ──────────────────────────────────────────
            data::db_topics_list,
            data::db_topics_get,
            data::db_topics_upsert,
            data::db_topics_delete,
            // ── Data layer — mastery ─────────────────────────────────────────
            data::db_mastery_get,
            data::db_mastery_upsert,
            // ── Data layer — practice ────────────────────────────────────────
            data::db_practice_insert,
            data::db_practice_list,
            // ── Data layer — review schedule ─────────────────────────────────
            data::db_review_get,
            data::db_review_list_due,
            data::db_review_upsert,
            // ── Data layer — notes ───────────────────────────────────────────
            data::db_notes_list,
            data::db_notes_insert,
            data::db_notes_update,
            data::db_notes_delete,
            data::db_notes_search,
            // ── Data layer — settings ────────────────────────────────────────
            data::db_settings_get,
            data::db_settings_set,
            // ── Utilities ────────────────────────────────────────────────────
            data::claude_probe,
        ])
        .build(tauri::generate_context!())
        .expect("error building tauri application")
        .run(|app, event| {
            if let RunEvent::ExitRequested { .. } = event {
                // Kill all active PTY sessions so the whole process tree is cleaned up.
                app.state::<pty::PtyState>().kill_all();
            }
        });
}
