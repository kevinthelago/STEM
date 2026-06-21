use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Topic {
    pub id: String,
    pub slug: String,
    pub title: String,
    pub description: Option<String>,
    pub subject: String,
    pub category: Option<String>,
    pub level: i64,
    pub estimated_minutes: Option<i64>,
    pub objectives: Option<String>,
    pub viz_refs: Option<String>,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NewTopic {
    pub id: String,
    pub slug: String,
    pub title: String,
    pub description: Option<String>,
    pub subject: String,
    pub category: Option<String>,
    pub level: i64,
    pub estimated_minutes: Option<i64>,
    pub objectives: Option<String>,
    pub viz_refs: Option<String>,
}
