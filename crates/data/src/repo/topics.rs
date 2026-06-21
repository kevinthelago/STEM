use crate::error::{Error, Result};
use crate::models::topic::{NewTopic, Topic};
use rusqlite::{Connection, Row};

pub struct TopicsRepo<'conn> {
    conn: &'conn Connection,
}

impl<'conn> TopicsRepo<'conn> {
    pub fn new(conn: &'conn Connection) -> Self {
        Self { conn }
    }

    fn row_to_topic(row: &Row<'_>) -> rusqlite::Result<Topic> {
        Ok(Topic {
            id: row.get(0)?,
            slug: row.get(1)?,
            title: row.get(2)?,
            description: row.get(3)?,
            subject: row.get(4)?,
            category: row.get(5)?,
            level: row.get(6)?,
            estimated_minutes: row.get(7)?,
            objectives: row.get(8)?,
            viz_refs: row.get(9)?,
            created_at: row.get(10)?,
            updated_at: row.get(11)?,
        })
    }

    pub fn insert(&self, topic: &NewTopic) -> Result<()> {
        self.conn.execute(
            "INSERT INTO topics (id, slug, title, description, subject, category, level, estimated_minutes, objectives, viz_refs)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10)",
            rusqlite::params![
                topic.id,
                topic.slug,
                topic.title,
                topic.description,
                topic.subject,
                topic.category,
                topic.level,
                topic.estimated_minutes,
                topic.objectives,
                topic.viz_refs,
            ],
        )?;
        Ok(())
    }

    pub fn insert_or_ignore(&self, topic: &NewTopic) -> Result<()> {
        self.conn.execute(
            "INSERT OR IGNORE INTO topics (id, slug, title, description, subject, category, level, estimated_minutes, objectives, viz_refs)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10)",
            rusqlite::params![
                topic.id,
                topic.slug,
                topic.title,
                topic.description,
                topic.subject,
                topic.category,
                topic.level,
                topic.estimated_minutes,
                topic.objectives,
                topic.viz_refs,
            ],
        )?;
        Ok(())
    }

    pub fn get_by_id(&self, id: &str) -> Result<Topic> {
        let mut stmt = self.conn.prepare(
            "SELECT id, slug, title, description, subject, category, level, estimated_minutes, objectives, viz_refs, created_at, updated_at
             FROM topics WHERE id = ?1",
        )?;
        stmt.query_row(rusqlite::params![id], Self::row_to_topic)
            .map_err(|e| match e {
                rusqlite::Error::QueryReturnedNoRows => Error::NotFound,
                other => Error::Rusqlite(other),
            })
    }

    pub fn get_by_slug(&self, slug: &str) -> Result<Topic> {
        let mut stmt = self.conn.prepare(
            "SELECT id, slug, title, description, subject, category, level, estimated_minutes, objectives, viz_refs, created_at, updated_at
             FROM topics WHERE slug = ?1",
        )?;
        stmt.query_row(rusqlite::params![slug], Self::row_to_topic)
            .map_err(|e| match e {
                rusqlite::Error::QueryReturnedNoRows => Error::NotFound,
                other => Error::Rusqlite(other),
            })
    }

    pub fn list_by_subject(&self, subject: &str) -> Result<Vec<Topic>> {
        let mut stmt = self.conn.prepare(
            "SELECT id, slug, title, description, subject, category, level, estimated_minutes, objectives, viz_refs, created_at, updated_at
             FROM topics WHERE subject = ?1 ORDER BY level, title",
        )?;
        let rows = stmt
            .query_map(rusqlite::params![subject], Self::row_to_topic)?
            .collect::<std::result::Result<Vec<_>, _>>()?;
        Ok(rows)
    }

    pub fn delete(&self, id: &str) -> Result<()> {
        self.conn
            .execute("DELETE FROM topics WHERE id = ?1", rusqlite::params![id])?;
        Ok(())
    }

    pub fn add_prerequisite(&self, topic_id: &str, prerequisite_id: &str) -> Result<()> {
        self.conn.execute(
            "INSERT OR IGNORE INTO topic_prerequisites (topic_id, prerequisite_id) VALUES (?1, ?2)",
            rusqlite::params![topic_id, prerequisite_id],
        )?;
        Ok(())
    }

    pub fn remove_prerequisite(&self, topic_id: &str, prerequisite_id: &str) -> Result<()> {
        self.conn.execute(
            "DELETE FROM topic_prerequisites WHERE topic_id = ?1 AND prerequisite_id = ?2",
            rusqlite::params![topic_id, prerequisite_id],
        )?;
        Ok(())
    }

    pub fn get_prerequisites(&self, topic_id: &str) -> Result<Vec<Topic>> {
        let mut stmt = self.conn.prepare(
            "SELECT t.id, t.slug, t.title, t.description, t.subject, t.category, t.level, t.estimated_minutes, t.objectives, t.viz_refs, t.created_at, t.updated_at
             FROM topics t
             INNER JOIN topic_prerequisites tp ON tp.prerequisite_id = t.id
             WHERE tp.topic_id = ?1
             ORDER BY t.level, t.title",
        )?;
        let rows = stmt
            .query_map(rusqlite::params![topic_id], Self::row_to_topic)?
            .collect::<std::result::Result<Vec<_>, _>>()?;
        Ok(rows)
    }
}

#[cfg(test)]
pub fn has_cycle(conn: &Connection) -> bool {
    use std::collections::{HashMap, HashSet};

    let mut adj: HashMap<String, Vec<String>> = HashMap::new();

    let mut stmt = conn
        .prepare("SELECT topic_id, prerequisite_id FROM topic_prerequisites")
        .unwrap();
    let edges: Vec<(String, String)> = stmt
        .query_map([], |row| Ok((row.get(0)?, row.get(1)?)))
        .unwrap()
        .map(|r| r.unwrap())
        .collect();

    for (topic_id, prereq_id) in edges {
        adj.entry(topic_id).or_default().push(prereq_id);
    }

    let mut visited: HashSet<String> = HashSet::new();
    let mut stack: HashSet<String> = HashSet::new();

    fn dfs(
        node: &str,
        adj: &HashMap<String, Vec<String>>,
        visited: &mut HashSet<String>,
        stack: &mut HashSet<String>,
    ) -> bool {
        if stack.contains(node) {
            return true;
        }
        if visited.contains(node) {
            return false;
        }
        visited.insert(node.to_string());
        stack.insert(node.to_string());
        if let Some(neighbors) = adj.get(node) {
            for neighbor in neighbors {
                if dfs(neighbor, adj, visited, stack) {
                    return true;
                }
            }
        }
        stack.remove(node);
        false
    }

    let all_nodes: Vec<String> = adj.keys().cloned().collect();
    for node in all_nodes {
        if !visited.contains(&node) {
            if dfs(&node, &adj, &mut visited, &mut stack) {
                return true;
            }
        }
    }
    false
}
