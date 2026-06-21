use crate::error::{Error, Result};
use crate::models::setting::Setting;
use rusqlite::{Connection, Row};

pub struct SettingsRepo<'conn> {
    conn: &'conn Connection,
}

impl<'conn> SettingsRepo<'conn> {
    pub fn new(conn: &'conn Connection) -> Self {
        Self { conn }
    }

    fn row_to_setting(row: &Row<'_>) -> rusqlite::Result<Setting> {
        Ok(Setting {
            key: row.get(0)?,
            value: row.get(1)?,
            updated_at: row.get(2)?,
        })
    }

    pub fn set(&self, key: &str, value: &str) -> Result<()> {
        self.conn.execute(
            "INSERT INTO settings (key, value, updated_at) VALUES (?1, ?2, datetime('now'))
             ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = datetime('now')",
            rusqlite::params![key, value],
        )?;
        Ok(())
    }

    pub fn get(&self, key: &str) -> Result<Setting> {
        let mut stmt = self.conn.prepare(
            "SELECT key, value, updated_at FROM settings WHERE key = ?1",
        )?;
        stmt.query_row(rusqlite::params![key], Self::row_to_setting)
            .map_err(|e| match e {
                rusqlite::Error::QueryReturnedNoRows => Error::NotFound,
                other => Error::Rusqlite(other),
            })
    }

    pub fn all(&self) -> Result<Vec<Setting>> {
        let mut stmt = self.conn.prepare(
            "SELECT key, value, updated_at FROM settings ORDER BY key",
        )?;
        let rows = stmt
            .query_map([], Self::row_to_setting)?
            .collect::<std::result::Result<Vec<_>, _>>()?;
        Ok(rows)
    }
}
