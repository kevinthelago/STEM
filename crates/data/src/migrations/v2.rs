use super::Migration;

pub const MIGRATION_V2: Migration = Migration {
    version: 2,
    up: "
CREATE TABLE IF NOT EXISTS problem_templates (
    id TEXT PRIMARY KEY,
    topic_id TEXT NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
    difficulty INTEGER NOT NULL DEFAULT 1,
    prompt_template TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_problem_templates_topic_id ON problem_templates(topic_id);
",
};
