use crate::error::{Error, Result};
use crate::models::review_schedule::{NewReviewSchedule, ReviewSchedule};
use rusqlite::{Connection, Row};

pub struct ReviewScheduleRepo<'conn> {
    conn: &'conn Connection,
}

impl<'conn> ReviewScheduleRepo<'conn> {
    pub fn new(conn: &'conn Connection) -> Self {
        Self { conn }
    }

    fn row_to_schedule(row: &Row<'_>) -> rusqlite::Result<ReviewSchedule> {
        Ok(ReviewSchedule {
            id: row.get(0)?,
            topic_id: row.get(1)?,
            due_at: row.get(2)?,
            interval_days: row.get(3)?,
            ease_factor: row.get(4)?,
            review_count: row.get(5)?,
            last_reviewed_at: row.get(6)?,
        })
    }

    pub fn upsert(&self, schedule: &NewReviewSchedule) -> Result<()> {
        self.conn.execute(
            "INSERT INTO review_schedule (topic_id, due_at, interval_days, ease_factor)
             VALUES (?1, ?2, ?3, ?4)
             ON CONFLICT(topic_id) DO UPDATE SET
               due_at = excluded.due_at,
               interval_days = excluded.interval_days,
               ease_factor = excluded.ease_factor,
               review_count = review_count + 1,
               last_reviewed_at = datetime('now')",
            rusqlite::params![
                schedule.topic_id,
                schedule.due_at,
                schedule.interval_days,
                schedule.ease_factor,
            ],
        )?;
        Ok(())
    }

    pub fn get_by_topic(&self, topic_id: &str) -> Result<ReviewSchedule> {
        let mut stmt = self.conn.prepare(
            "SELECT id, topic_id, due_at, interval_days, ease_factor, review_count, last_reviewed_at
             FROM review_schedule WHERE topic_id = ?1",
        )?;
        stmt.query_row(rusqlite::params![topic_id], Self::row_to_schedule)
            .map_err(|e| match e {
                rusqlite::Error::QueryReturnedNoRows => Error::NotFound,
                other => Error::Rusqlite(other),
            })
    }

    pub fn due_before(&self, datetime_str: &str) -> Result<Vec<ReviewSchedule>> {
        let mut stmt = self.conn.prepare(
            "SELECT id, topic_id, due_at, interval_days, ease_factor, review_count, last_reviewed_at
             FROM review_schedule WHERE due_at <= ?1 ORDER BY due_at",
        )?;
        let rows = stmt
            .query_map(rusqlite::params![datetime_str], Self::row_to_schedule)?
            .collect::<std::result::Result<Vec<_>, _>>()?;
        Ok(rows)
    }
}
