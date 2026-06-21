use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Mastery {
    pub id: i64,
    pub topic_id: String,
    pub level: f64,
    pub confidence: f64,
    pub last_assessed_at: Option<String>,
    pub updated_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NewMastery {
    pub topic_id: String,
    pub level: f64,
    pub confidence: f64,
    pub last_assessed_at: Option<String>,
}
