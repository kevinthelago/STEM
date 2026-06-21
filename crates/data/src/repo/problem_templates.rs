use crate::error::{Error, Result};
use crate::models::problem_template::{NewProblemTemplate, ProblemTemplate};
use rusqlite::{Connection, Row};

pub struct ProblemTemplatesRepo<'conn> {
    conn: &'conn Connection,
}

impl<'conn> ProblemTemplatesRepo<'conn> {
    pub fn new(conn: &'conn Connection) -> Self {
        Self { conn }
    }

    fn row_to_template(row: &Row<'_>) -> rusqlite::Result<ProblemTemplate> {
        Ok(ProblemTemplate {
            id: row.get(0)?,
            topic_id: row.get(1)?,
            difficulty: row.get(2)?,
            prompt_template: row.get(3)?,
            created_at: row.get(4)?,
        })
    }

    pub fn insert_or_ignore(&self, t: &NewProblemTemplate) -> Result<()> {
        self.conn.execute(
            "INSERT OR IGNORE INTO problem_templates (id, topic_id, difficulty, prompt_template)
             VALUES (?1, ?2, ?3, ?4)",
            rusqlite::params![t.id, t.topic_id, t.difficulty, t.prompt_template],
        )?;
        Ok(())
    }

    pub fn get_by_id(&self, id: &str) -> Result<ProblemTemplate> {
        let mut stmt = self.conn.prepare(
            "SELECT id, topic_id, difficulty, prompt_template, created_at
             FROM problem_templates WHERE id = ?1",
        )?;
        stmt.query_row(rusqlite::params![id], Self::row_to_template)
            .map_err(|e| match e {
                rusqlite::Error::QueryReturnedNoRows => Error::NotFound,
                other => Error::Rusqlite(other),
            })
    }

    pub fn list_by_topic(&self, topic_id: &str) -> Result<Vec<ProblemTemplate>> {
        let mut stmt = self.conn.prepare(
            "SELECT id, topic_id, difficulty, prompt_template, created_at
             FROM problem_templates WHERE topic_id = ?1 ORDER BY difficulty, id",
        )?;
        let rows = stmt
            .query_map(rusqlite::params![topic_id], Self::row_to_template)?
            .collect::<std::result::Result<Vec<_>, _>>()?;
        Ok(rows)
    }
}
