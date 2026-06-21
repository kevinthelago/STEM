mod v1;
mod v2;

pub use v1::MIGRATION_V1;
pub use v2::MIGRATION_V2;

use crate::error::Result;
use rusqlite::Connection;

pub struct Migration {
    pub version: u32,
    pub up: &'static str,
}

pub fn all_migrations() -> Vec<Migration> {
    vec![MIGRATION_V1, MIGRATION_V2]
}

pub fn run_migrations(conn: &Connection, migrations: &[Migration]) -> Result<()> {
    conn.execute_batch(
        "CREATE TABLE IF NOT EXISTS schema_migrations (
            version INTEGER PRIMARY KEY,
            applied_at TEXT NOT NULL
        );",
    )?;

    let applied: Vec<u32> = {
        let mut stmt =
            conn.prepare("SELECT version FROM schema_migrations ORDER BY version")?;
        let rows = stmt.query_map([], |row| row.get(0))?
            .collect::<std::result::Result<Vec<_>, _>>()?;
        rows
    };

    for migration in migrations {
        if applied.contains(&migration.version) {
            continue;
        }

        let tx = conn.unchecked_transaction()?;
        tx.execute_batch(migration.up)?;
        tx.execute(
            "INSERT INTO schema_migrations (version, applied_at) VALUES (?1, datetime('now'))",
            rusqlite::params![migration.version],
        )?;
        tx.commit()?;
    }

    Ok(())
}
