use super::Migration;

pub const MIGRATION_V3: Migration = Migration {
    version: 3,
    up: "
-- Drop FTS5 triggers and virtual table (content_rowid was pointing at INTEGER id)
DROP TRIGGER IF EXISTS notes_ai;
DROP TRIGGER IF EXISTS notes_ad;
DROP TRIGGER IF EXISTS notes_au;
DROP TABLE IF EXISTS notes_fts;

-- Preserve existing rows
ALTER TABLE notes RENAME TO notes_v2;

-- New schema: TEXT UUID primary key; implicit integer rowid still exists
CREATE TABLE notes (
    id TEXT PRIMARY KEY,
    topic_id TEXT REFERENCES topics(id) ON DELETE SET NULL,
    title TEXT NOT NULL DEFAULT '',
    body TEXT NOT NULL DEFAULT '',
    tags TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Migrate existing rows, assigning UUID v4-format IDs via randomblob
INSERT INTO notes (id, topic_id, title, body, tags, created_at, updated_at)
SELECT
    lower(hex(randomblob(4))) || '-' ||
    lower(hex(randomblob(2))) || '-4' ||
    substr(lower(hex(randomblob(2))), 2) || '-' ||
    substr('89ab', (abs(random()) % 4) + 1, 1) ||
    substr(lower(hex(randomblob(2))), 2) || '-' ||
    lower(hex(randomblob(6))),
    topic_id, title, body, tags, created_at, updated_at
FROM notes_v2;

DROP TABLE notes_v2;

-- Recreate FTS5 using the implicit integer rowid (id is now TEXT, not usable as content_rowid)
CREATE VIRTUAL TABLE notes_fts USING fts5(
    title, body, tags,
    content=notes, content_rowid=rowid
);

-- Seed FTS index from existing content
INSERT INTO notes_fts(rowid, title, body, tags)
SELECT rowid, title, body, tags FROM notes;

-- Triggers reference new.rowid / old.rowid (implicit integer rowid, always available)
CREATE TRIGGER notes_ai AFTER INSERT ON notes BEGIN
    INSERT INTO notes_fts(rowid, title, body, tags) VALUES (new.rowid, new.title, new.body, new.tags);
END;

CREATE TRIGGER notes_ad AFTER DELETE ON notes BEGIN
    INSERT INTO notes_fts(notes_fts, rowid, title, body, tags)
        VALUES ('delete', old.rowid, old.title, old.body, old.tags);
END;

CREATE TRIGGER notes_au AFTER UPDATE ON notes BEGIN
    INSERT INTO notes_fts(notes_fts, rowid, title, body, tags)
        VALUES ('delete', old.rowid, old.title, old.body, old.tags);
    INSERT INTO notes_fts(rowid, title, body, tags) VALUES (new.rowid, new.title, new.body, new.tags);
END;
",
};
