use crate::error::Result;
use crate::models::practice_attempt::{NewPracticeAttempt, PracticeAttempt};
use rusqlite::{Connection, Row};

pub struct PracticeAttemptsRepo<'conn> {
    conn: &'conn Connection,
}

impl<'conn> PracticeAttemptsRepo<'conn> {
    pub fn new(conn: &'conn Connection) -> Self {
        Self { conn }
    }

    fn row_to_attempt(row: &Row<'_>) -> rusqlite::Result<PracticeAttempt> {
        Ok(PracticeAttempt {
            id: row.get(0)?,
            topic_id: row.get(1)?,
            problem_template_id: row.get(2)?,
            score: row.get(3)?,
            duration_seconds: row.get(4)?,
            attempted_at: row.get(5)?,
            notes: row.get(6)?,
        })
    }

    pub fn insert(&self, attempt: &NewPracticeAttempt) -> Result<i64> {
        self.conn.execute(
            "INSERT INTO practice_attempts (topic_id, problem_template_id, score, duration_seconds, notes)
             VALUES (?1, ?2, ?3, ?4, ?5)",
            rusqlite::params![
                attempt.topic_id,
                attempt.problem_template_id,
                attempt.score,
                attempt.duration_seconds,
                attempt.notes,
            ],
        )?;
        Ok(self.conn.last_insert_rowid())
    }

    pub fn list_by_topic(&self, topic_id: &str) -> Result<Vec<PracticeAttempt>> {
        let mut stmt = self.conn.prepare(
            "SELECT id, topic_id, problem_template_id, score, duration_seconds, attempted_at, notes
             FROM practice_attempts WHERE topic_id = ?1 ORDER BY attempted_at DESC",
        )?;
        let rows = stmt
            .query_map(rusqlite::params![topic_id], Self::row_to_attempt)?
            .collect::<std::result::Result<Vec<_>, _>>()?;
        Ok(rows)
    }

    pub fn recent(&self, limit: u32) -> Result<Vec<PracticeAttempt>> {
        let mut stmt = self.conn.prepare(
            "SELECT id, topic_id, problem_template_id, score, duration_seconds, attempted_at, notes
             FROM practice_attempts ORDER BY attempted_at DESC LIMIT ?1",
        )?;
        let rows = stmt
            .query_map(rusqlite::params![limit], Self::row_to_attempt)?
            .collect::<std::result::Result<Vec<_>, _>>()?;
        Ok(rows)
    }
}
