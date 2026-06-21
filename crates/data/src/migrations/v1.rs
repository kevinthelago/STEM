use super::Migration;

pub const MIGRATION_V1: Migration = Migration {
    version: 1,
    up: "
CREATE TABLE IF NOT EXISTS schema_migrations (
    version INTEGER PRIMARY KEY,
    applied_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS topics (
    id TEXT PRIMARY KEY,
    slug TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    description TEXT,
    subject TEXT NOT NULL,
    category TEXT,
    level INTEGER NOT NULL DEFAULT 0,
    estimated_minutes INTEGER,
    objectives TEXT,
    viz_refs TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS topic_prerequisites (
    topic_id TEXT NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
    prerequisite_id TEXT NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
    PRIMARY KEY (topic_id, prerequisite_id)
);

CREATE TABLE IF NOT EXISTS mastery (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    topic_id TEXT NOT NULL UNIQUE REFERENCES topics(id) ON DELETE CASCADE,
    level REAL NOT NULL DEFAULT 0.0,
    confidence REAL NOT NULL DEFAULT 0.0,
    last_assessed_at TEXT,
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS practice_attempts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    topic_id TEXT NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
    problem_template_id TEXT,
    score REAL,
    duration_seconds INTEGER,
    attempted_at TEXT NOT NULL DEFAULT (datetime('now')),
    notes TEXT
);

CREATE TABLE IF NOT EXISTS review_schedule (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    topic_id TEXT NOT NULL UNIQUE REFERENCES topics(id) ON DELETE CASCADE,
    due_at TEXT NOT NULL,
    interval_days REAL NOT NULL DEFAULT 1.0,
    ease_factor REAL NOT NULL DEFAULT 2.5,
    review_count INTEGER NOT NULL DEFAULT 0,
    last_reviewed_at TEXT
);

CREATE TABLE IF NOT EXISTS notes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    topic_id TEXT REFERENCES topics(id) ON DELETE SET NULL,
    title TEXT NOT NULL DEFAULT '',
    body TEXT NOT NULL DEFAULT '',
    tags TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE VIRTUAL TABLE IF NOT EXISTS notes_fts USING fts5(
    title, body, tags,
    content=notes, content_rowid=id
);

CREATE TRIGGER IF NOT EXISTS notes_ai AFTER INSERT ON notes BEGIN
    INSERT INTO notes_fts(rowid, title, body, tags) VALUES (new.id, new.title, new.body, new.tags);
END;

CREATE TRIGGER IF NOT EXISTS notes_ad AFTER DELETE ON notes BEGIN
    INSERT INTO notes_fts(notes_fts, rowid, title, body, tags) VALUES ('delete', old.id, old.title, old.body, old.tags);
END;

CREATE TRIGGER IF NOT EXISTS notes_au AFTER UPDATE ON notes BEGIN
    INSERT INTO notes_fts(notes_fts, rowid, title, body, tags) VALUES ('delete', old.id, old.title, old.body, old.tags);
    INSERT INTO notes_fts(rowid, title, body, tags) VALUES (new.id, new.title, new.body, new.tags);
END;

CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
",
};
