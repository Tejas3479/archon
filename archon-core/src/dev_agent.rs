use crate::error::ArchonError;
use serde::{Serialize, Deserialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TaskDescription {
    pub target_language: String,
    pub description: String,
    pub failure_context: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CodeGenResponse {
    pub code: String,
    pub language: String,
    pub risk_score: f64,
}

pub struct DevAgent;

impl DevAgent {
    // WHY: Request improvements from the cloud developer agent.
    // In production, this can perform an HTTP call to the gateway `/tools/developer.write_code` endpoint.
    // For Phase 6 and local verification, we simulate this request to keep it fast and offline-compatible.
    pub fn request_improvement(task: &TaskDescription) -> Result<CodeGenResponse, ArchonError> {
        let code = match task.target_language.to_lowercase().as_str() {
            "typescript" | "typescript/ts" | "js" => {
                "export const airlineRegex = /flight|boarding|delay|booking/i;".to_string()
            }
            _ => {
                r#"// Generated regex chatbot logic
pub const AIRLINE_REGEX: &str = "(?i)flight|boarding|delay|booking";"#.to_string()
            }
        };

        Ok(CodeGenResponse {
            code,
            language: task.target_language.clone(),
            risk_score: 0.1,
        })
    }
}
