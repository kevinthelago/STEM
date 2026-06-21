use crate::error::Result;
use crate::migrations::{all_migrations, run_migrations};
use crate::repo::{
    MasteryRepo, NotesRepo, PracticeAttemptsRepo, ProblemTemplatesRepo, ReviewScheduleRepo,
    SettingsRepo, TopicsRepo,
};
use rusqlite::Connection;
use std::path::Path;

pub use crate::seed::{seed_all, seed_pack};

pub struct Db {
    pub(crate) conn: Connection,
}

impl Db {
    pub fn open(path: &Path) -> Result<Self> {
        let conn = Connection::open(path)?;
        Self::configure_and_migrate(conn)
    }

    pub fn open_in_memory() -> Result<Self> {
        let conn = Connection::open_in_memory()?;
        Self::configure_and_migrate(conn)
    }

    fn configure_and_migrate(conn: Connection) -> Result<Self> {
        conn.execute_batch("PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON;")?;
        let migrations = all_migrations();
        run_migrations(&conn, &migrations)?;
        Ok(Self { conn })
    }

    pub fn topics(&self) -> TopicsRepo<'_> {
        TopicsRepo::new(&self.conn)
    }

    pub fn mastery(&self) -> MasteryRepo<'_> {
        MasteryRepo::new(&self.conn)
    }

    pub fn practice_attempts(&self) -> PracticeAttemptsRepo<'_> {
        PracticeAttemptsRepo::new(&self.conn)
    }

    pub fn review_schedule(&self) -> ReviewScheduleRepo<'_> {
        ReviewScheduleRepo::new(&self.conn)
    }

    pub fn notes(&self) -> NotesRepo<'_> {
        NotesRepo::new(&self.conn)
    }

    pub fn settings(&self) -> SettingsRepo<'_> {
        SettingsRepo::new(&self.conn)
    }

    pub fn problem_templates(&self) -> ProblemTemplatesRepo<'_> {
        ProblemTemplatesRepo::new(&self.conn)
    }

    /// Seeds all content packs on first launch (no-op when topics already exist).
    pub fn ensure_content_seeded(&self) -> Result<()> {
        let count: i64 = self
            .conn
            .query_row("SELECT COUNT(*) FROM topics", [], |r| r.get(0))?;
        if count == 0 {
            crate::seed::seed_all(self)?;
        }
        Ok(())
    }
}
