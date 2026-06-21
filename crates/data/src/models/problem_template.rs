use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProblemTemplate {
    pub id: String,
    pub topic_id: String,
    /// 1 = easy, 2 = medium, 3 = hard
    pub difficulty: i64,
    pub prompt_template: String,
    pub created_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NewProblemTemplate {
    pub id: String,
    pub topic_id: String,
    pub difficulty: i64,
    pub prompt_template: String,
}
