use thiserror::Error;

#[derive(Debug, Error)]
pub enum Error {
    #[error("SQLite error: {0}")]
    Rusqlite(#[from] rusqlite::Error),

    #[error("JSON error: {0}")]
    Json(#[from] serde_json::Error),

    #[error("migration {0} already applied")]
    MigrationAlreadyApplied(u32),

    #[error("schema version mismatch: expected {expected}, found {found}")]
    VersionMismatch { expected: u32, found: u32 },

    #[error("not found")]
    NotFound,
}

pub type Result<T> = std::result::Result<T, Error>;
