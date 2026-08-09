use crate::agents::DomainAgent;
use crate::error::ArchonError;
use serde_json::Value;
use regex::Regex;

pub struct SocialAgent;

impl DomainAgent for SocialAgent {
    // WHY: Routes incoming social agent actions
    fn process_intent(&self, action: &str, variables: &Value) -> Result<Value, ArchonError> {
        match action {
            "extract_life_events" => self.extract_life_events(variables),
            _ => Err(ArchonError::Internal(format!("Unknown social action: {}", action))),
        }
    }
}

impl SocialAgent {
    // WHY: NLP pattern matching to extract life events from message streams on-device
    fn extract_life_events(&self, variables: &Value) -> Result<Value, ArchonError> {
        let messages = variables.get("messages")
            .and_then(|v| v.as_array())
            .ok_or_else(|| ArchonError::Internal("Missing 'messages' array".to_string()))?;

        let birthday_regex = Regex::new(r"(?i)(happy\s+)?birthday")
            .map_err(|e| ArchonError::Internal(e.to_string()))?;
        let job_regex = Regex::new(r"(?i)(new\s+job|promotion|hired)")
            .map_err(|e| ArchonError::Internal(e.to_string()))?;
        let wedding_regex = Regex::new(r"(?i)(wedding|married|engagement)")
            .map_err(|e| ArchonError::Internal(e.to_string()))?;

        let mut events = Vec::new();

        for msg in messages {
            let text = msg.get("text").and_then(|v| v.as_str()).unwrap_or("");
            let sender = msg.get("sender").and_then(|v| v.as_str()).unwrap_or("Unknown");

            if birthday_regex.is_match(text) {
                events.push(serde_json::json!({
                    "event_type": "Birthday",
                    "sender": sender,
                    "snippet": text,
                    "suggestion": "Draft a birthday congratulation message and recommend a gift."
                }));
            } else if job_regex.is_match(text) {
                events.push(serde_json::json!({
                    "event_type": "Career Milestone",
                    "sender": sender,
                    "snippet": text,
                    "suggestion": "Draft a congratulatory message and recommend a celebratory dinner."
                }));
            } else if wedding_regex.is_match(text) {
                events.push(serde_json::json!({
                    "event_type": "Relationship Milestone",
                    "sender": sender,
                    "snippet": text,
                    "suggestion": "Draft congratulations and view wedding registry."
                }));
            }
        }

        Ok(Value::Array(events))
    }
}
