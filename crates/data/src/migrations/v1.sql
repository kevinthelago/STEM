-- v1: initial schema — curriculum, mastery, practice, spaced-repetition, notes, settings

CREATE TABLE topics (
    id                TEXT PRIMARY KEY,
    slug              TEXT NOT NULL UNIQUE,
    title             TEXT NOT NULL,
    description       TEXT,
    subject           TEXT NOT NULL,
    category          TEXT,
    level             INTEGER NOT NULL DEFAULT 1,
    estimated_minutes INTEGER,
    objectives        TEXT,
    viz_refs          TEXT,
    created_at        TEXT NOT NULL DEFAULT (STRFTIME('%Y-%m-%dT%H:%M:%SZ', 'now')),
    updated_at        TEXT NOT NULL DEFAULT (STRFTIME('%Y-%m-%dT%H:%M:%SZ', 'now'))
);

CREATE TABLE topic_prerequisites (
    topic_id       TEXT NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
    prerequisite_id TEXT NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
    PRIMARY KEY (topic_id, prerequisite_id),
    CHECK (topic_id != prerequisite_id)
);

CREATE TABLE mastery (
    id               INTEGER PRIMARY KEY AUTOINCREMENT,
    topic_id         TEXT NOT NULL UNIQUE REFERENCES topics(id) ON DELETE CASCADE,
    level            REAL NOT NULL DEFAULT 0.0,
    confidence       REAL NOT NULL DEFAULT 0.0,
    last_assessed_at TEXT,
    updated_at       TEXT NOT NULL DEFAULT (STRFTIME('%Y-%m-%dT%H:%M:%SZ', 'now'))
);

CREATE TABLE practice_attempts (
    id             INTEGER PRIMARY KEY AUTOINCREMENT,
    topic_id       TEXT NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
    problem_text   TEXT NOT NULL,
    student_answer TEXT NOT NULL,
    score          REAL NOT NULL,
    feedback       TEXT,
    created_at     TEXT NOT NULL DEFAULT (STRFTIME('%Y-%m-%dT%H:%M:%SZ', 'now'))
);

CREATE TABLE review_schedule (
    id             INTEGER PRIMARY KEY AUTOINCREMENT,
    topic_id       TEXT NOT NULL UNIQUE REFERENCES topics(id) ON DELETE CASCADE,
    next_review_at TEXT NOT NULL,
    interval_days  REAL NOT NULL DEFAULT 1.0,
    ease_factor    REAL NOT NULL DEFAULT 2.5,
    repetitions    INTEGER NOT NULL DEFAULT 0,
    updated_at     TEXT NOT NULL DEFAULT (STRFTIME('%Y-%m-%dT%H:%M:%SZ', 'now'))
);

CREATE TABLE notes (
    id         TEXT PRIMARY KEY,
    topic_id   TEXT NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
    content    TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (STRFTIME('%Y-%m-%dT%H:%M:%SZ', 'now')),
    updated_at TEXT NOT NULL DEFAULT (STRFTIME('%Y-%m-%dT%H:%M:%SZ', 'now'))
);

CREATE TABLE settings (
    key        TEXT PRIMARY KEY,
    value      TEXT NOT NULL,
    updated_at TEXT NOT NULL DEFAULT (STRFTIME('%Y-%m-%dT%H:%M:%SZ', 'now'))
);

-- indices for common queries
CREATE INDEX idx_topics_subject ON topics(subject);
CREATE INDEX idx_practice_attempts_topic ON practice_attempts(topic_id, created_at DESC);
CREATE INDEX idx_review_schedule_due ON review_schedule(next_review_at);
