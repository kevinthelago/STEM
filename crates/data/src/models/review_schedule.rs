use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ReviewSchedule {
    pub id: i64,
    pub topic_id: String,
    pub due_at: String,
    pub interval_days: f64,
    pub ease_factor: f64,
    pub review_count: i64,
    pub last_reviewed_at: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NewReviewSchedule {
    pub topic_id: String,
    pub due_at: String,
    pub interval_days: f64,
    pub ease_factor: f64,
}
