use crate::error::{Error, Result};
use crate::models::note::{NewNote, Note};
use rusqlite::{Connection, Row};

pub struct NotesRepo<'conn> {
    conn: &'conn Connection,
}

impl<'conn> NotesRepo<'conn> {
    pub fn new(conn: &'conn Connection) -> Self {
        Self { conn }
    }

    fn row_to_note(row: &Row<'_>) -> rusqlite::Result<Note> {
        Ok(Note {
            id: row.get(0)?,
            topic_id: row.get(1)?,
            title: row.get(2)?,
            body: row.get(3)?,
            tags: row.get(4)?,
            created_at: row.get(5)?,
            updated_at: row.get(6)?,
        })
    }

    /// Generates a UUID v4 string using SQLite's randomblob as the entropy source.
    fn gen_uuid(&self) -> Result<String> {
        let bytes: Vec<u8> = self
            .conn
            .query_row("SELECT randomblob(16)", [], |row| row.get(0))?;
        let mut b = [0u8; 16];
        b.copy_from_slice(&bytes);
        // Set version bits to 4
        b[6] = (b[6] & 0x0f) | 0x40;
        // Set RFC 4122 variant bits
        b[8] = (b[8] & 0x3f) | 0x80;
        Ok(format!(
            "{:08x}-{:04x}-{:04x}-{:04x}-{:012x}",
            u32::from_be_bytes([b[0], b[1], b[2], b[3]]),
            u16::from_be_bytes([b[4], b[5]]),
            u16::from_be_bytes([b[6], b[7]]),
            u16::from_be_bytes([b[8], b[9]]),
            u64::from_be_bytes([0, 0, b[10], b[11], b[12], b[13], b[14], b[15]]),
        ))
    }

    pub fn insert(&self, note: &NewNote) -> Result<String> {
        let id = self.gen_uuid()?;
        self.conn.execute(
            "INSERT INTO notes (id, topic_id, title, body, tags) VALUES (?1, ?2, ?3, ?4, ?5)",
            rusqlite::params![id, note.topic_id, note.title, note.body, note.tags],
        )?;
        Ok(id)
    }

    pub fn update(&self, id: &str, note: &NewNote) -> Result<()> {
        let changed = self.conn.execute(
            "UPDATE notes SET topic_id = ?1, title = ?2, body = ?3, tags = ?4, \
             updated_at = datetime('now') WHERE id = ?5",
            rusqlite::params![note.topic_id, note.title, note.body, note.tags, id],
        )?;
        if changed == 0 {
            return Err(Error::NotFound);
        }
        Ok(())
    }

    pub fn delete(&self, id: &str) -> Result<()> {
        self.conn
            .execute("DELETE FROM notes WHERE id = ?1", rusqlite::params![id])?;
        Ok(())
    }

    pub fn get(&self, id: &str) -> Result<Note> {
        let mut stmt = self.conn.prepare(
            "SELECT id, topic_id, title, body, tags, created_at, updated_at \
             FROM notes WHERE id = ?1",
        )?;
        stmt.query_row(rusqlite::params![id], Self::row_to_note)
            .map_err(|e| match e {
                rusqlite::Error::QueryReturnedNoRows => Error::NotFound,
                other => Error::Rusqlite(other),
            })
    }

    pub fn list_by_topic(&self, topic_id: &str) -> Result<Vec<Note>> {
        let mut stmt = self.conn.prepare(
            "SELECT id, topic_id, title, body, tags, created_at, updated_at \
             FROM notes WHERE topic_id = ?1 ORDER BY updated_at DESC",
        )?;
        let rows = stmt
            .query_map(rusqlite::params![topic_id], Self::row_to_note)?
            .collect::<std::result::Result<Vec<_>, _>>()?;
        Ok(rows)
    }

    pub fn search(&self, query: &str) -> Result<Vec<Note>> {
        // FTS5 content_rowid is the implicit integer rowid; join on n.rowid to resolve back to note.
        let mut stmt = self.conn.prepare(
            "SELECT n.id, n.topic_id, n.title, n.body, n.tags, n.created_at, n.updated_at \
             FROM notes n \
             INNER JOIN notes_fts ON notes_fts.rowid = n.rowid \
             WHERE notes_fts MATCH ?1 \
             ORDER BY rank",
        )?;
        let rows = stmt
            .query_map(rusqlite::params![query], Self::row_to_note)?
            .collect::<std::result::Result<Vec<_>, _>>()?;
        Ok(rows)
    }
}
