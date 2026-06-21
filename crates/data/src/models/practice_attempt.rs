use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PracticeAttempt {
    pub id: i64,
    pub topic_id: String,
    pub problem_template_id: Option<String>,
    pub score: Option<f64>,
    pub duration_seconds: Option<i64>,
    pub attempted_at: String,
    pub notes: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NewPracticeAttempt {
    pub topic_id: String,
    pub problem_template_id: Option<String>,
    pub score: Option<f64>,
    pub duration_seconds: Option<i64>,
    pub notes: Option<String>,
}
