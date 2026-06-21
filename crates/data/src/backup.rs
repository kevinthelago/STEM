use crate::db::Db;
use crate::error::{Error, Result};
use crate::models::mastery::NewMastery;
use rusqlite::Connection;
use serde_json::{json, Value};
use std::path::Path;

const SCHEMA_VERSION: u64 = 1;

pub fn backup_to_file(conn: &Connection, dest: &Path) -> Result<()> {
    let mut dst = Connection::open(dest)?;
    let backup = rusqlite::backup::Backup::new(conn, &mut dst)?;
    backup.run_to_completion(100, std::time::Duration::from_millis(250), None)?;
    Ok(())
}

pub fn export_json(db: &Db) -> Result<Value> {
    let topics = {
        let mut stmt = db.conn.prepare(
            "SELECT id, slug, title, description, subject, category, level, estimated_minutes, objectives, viz_refs FROM topics",
        )?;
        let rows: Vec<Value> = stmt
            .query_map([], |row| {
                Ok(json!({
                    "id": row.get::<_, String>(0)?,
                    "slug": row.get::<_, String>(1)?,
                    "title": row.get::<_, String>(2)?,
                    "description": row.get::<_, Option<String>>(3)?,
                    "subject": row.get::<_, String>(4)?,
                    "category": row.get::<_, Option<String>>(5)?,
                    "level": row.get::<_, i64>(6)?,
                    "estimated_minutes": row.get::<_, Option<i64>>(7)?,
                    "objectives": row.get::<_, Option<String>>(8)?,
                    "viz_refs": row.get::<_, Option<String>>(9)?,
                }))
            })?
            .collect::<std::result::Result<_, _>>()?;
        rows
    };

    let mastery = {
        let mut stmt = db.conn.prepare(
            "SELECT topic_id, level, confidence, last_assessed_at FROM mastery",
        )?;
        let rows: Vec<Value> = stmt
            .query_map([], |row| {
                Ok(json!({
                    "topic_id": row.get::<_, String>(0)?,
                    "level": row.get::<_, f64>(1)?,
                    "confidence": row.get::<_, f64>(2)?,
                    "last_assessed_at": row.get::<_, Option<String>>(3)?,
                }))
            })?
            .collect::<std::result::Result<_, _>>()?;
        rows
    };

    let practice_attempts = {
        let mut stmt = db.conn.prepare(
            "SELECT topic_id, problem_template_id, score, duration_seconds, attempted_at, notes FROM practice_attempts",
        )?;
        let rows: Vec<Value> = stmt
            .query_map([], |row| {
                Ok(json!({
                    "topic_id": row.get::<_, String>(0)?,
                    "problem_template_id": row.get::<_, Option<String>>(1)?,
                    "score": row.get::<_, Option<f64>>(2)?,
                    "duration_seconds": row.get::<_, Option<i64>>(3)?,
                    "attempted_at": row.get::<_, String>(4)?,
                    "notes": row.get::<_, Option<String>>(5)?,
                }))
            })?
            .collect::<std::result::Result<_, _>>()?;
        rows
    };

    let notes = {
        let mut stmt = db.conn.prepare(
            "SELECT topic_id, title, body, tags FROM notes",
        )?;
        let rows: Vec<Value> = stmt
            .query_map([], |row| {
                Ok(json!({
                    "topic_id": row.get::<_, Option<String>>(0)?,
                    "title": row.get::<_, String>(1)?,
                    "body": row.get::<_, String>(2)?,
                    "tags": row.get::<_, Option<String>>(3)?,
                }))
            })?
            .collect::<std::result::Result<_, _>>()?;
        rows
    };

    Ok(json!({
        "schema_version": SCHEMA_VERSION,
        "topics": topics,
        "mastery": mastery,
        "practice_attempts": practice_attempts,
        "notes": notes,
    }))
}

pub fn import_json(db: &mut Db, bundle: Value) -> Result<()> {
    let version = bundle
        .get("schema_version")
        .and_then(|v| v.as_u64())
        .unwrap_or(0);
    if version != SCHEMA_VERSION {
        return Err(Error::VersionMismatch {
            expected: SCHEMA_VERSION as u32,
            found: version as u32,
        });
    }

    if let Some(mastery_arr) = bundle.get("mastery").and_then(|v| v.as_array()) {
        let repo = db.mastery();
        for item in mastery_arr {
            let m = NewMastery {
                topic_id: item["topic_id"].as_str().unwrap_or("").to_string(),
                level: item["level"].as_f64().unwrap_or(0.0),
                confidence: item["confidence"].as_f64().unwrap_or(0.0),
                last_assessed_at: item["last_assessed_at"]
                    .as_str()
                    .map(|s| s.to_string()),
            };
            repo.upsert(&m)?;
        }
    }

    if let Some(notes_arr) = bundle.get("notes").and_then(|v| v.as_array()) {
        let repo = db.notes();
        for item in notes_arr {
            let n = crate::models::note::NewNote {
                topic_id: item["topic_id"].as_str().map(|s| s.to_string()),
                title: item["title"].as_str().unwrap_or("").to_string(),
                body: item["body"].as_str().unwrap_or("").to_string(),
                tags: item["tags"].as_str().map(|s| s.to_string()),
            };
            repo.insert(&n)?;
        }
    }

    Ok(())
}
