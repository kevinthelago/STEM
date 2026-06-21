use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Note {
    pub id: i64,
    pub topic_id: Option<String>,
    pub title: String,
    pub body: String,
    pub tags: Option<String>,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NewNote {
    pub topic_id: Option<String>,
    pub title: String,
    pub body: String,
    pub tags: Option<String>,
}
