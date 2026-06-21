use crate::error::{Error, Result};
use crate::models::mastery::{Mastery, NewMastery};
use rusqlite::{Connection, Row};

pub struct MasteryRepo<'conn> {
    conn: &'conn Connection,
}

impl<'conn> MasteryRepo<'conn> {
    pub fn new(conn: &'conn Connection) -> Self {
        Self { conn }
    }

    fn row_to_mastery(row: &Row<'_>) -> rusqlite::Result<Mastery> {
        Ok(Mastery {
            id: row.get(0)?,
            topic_id: row.get(1)?,
            level: row.get(2)?,
            confidence: row.get(3)?,
            last_assessed_at: row.get(4)?,
            updated_at: row.get(5)?,
        })
    }

    pub fn upsert(&self, mastery: &NewMastery) -> Result<()> {
        self.conn.execute(
            "INSERT INTO mastery (topic_id, level, confidence, last_assessed_at, updated_at)
             VALUES (?1, ?2, ?3, ?4, datetime('now'))
             ON CONFLICT(topic_id) DO UPDATE SET
               level = excluded.level,
               confidence = excluded.confidence,
               last_assessed_at = excluded.last_assessed_at,
               updated_at = datetime('now')",
            rusqlite::params![
                mastery.topic_id,
                mastery.level,
                mastery.confidence,
                mastery.last_assessed_at,
            ],
        )?;
        Ok(())
    }

    pub fn get_by_topic(&self, topic_id: &str) -> Result<Mastery> {
        let mut stmt = self.conn.prepare(
            "SELECT id, topic_id, level, confidence, last_assessed_at, updated_at
             FROM mastery WHERE topic_id = ?1",
        )?;
        stmt.query_row(rusqlite::params![topic_id], Self::row_to_mastery)
            .map_err(|e| match e {
                rusqlite::Error::QueryReturnedNoRows => Error::NotFound,
                other => Error::Rusqlite(other),
            })
    }
}
