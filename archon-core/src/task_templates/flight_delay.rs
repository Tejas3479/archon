use crate::detector::{Event, Intent, TaskTemplate};
use uuid::Uuid;

pub struct FlightDelayTemplate;

impl TaskTemplate for FlightDelayTemplate {
    fn name(&self) -> &'static str {
        "FlightDelayTemplate"
    }

    // WHY: Match event if it is an email about a delayed flight
    fn preconditions(&self, event: &Event) -> bool {
        if event.domain != "email" {
            return false;
        }

        let subject = event.payload.get("subject")
            .and_then(|v| v.as_str())
            .unwrap_or("")
            .to_lowercase();
            
        let body = event.payload.get("body")
            .and_then(|v| v.as_str())
            .unwrap_or("")
            .to_lowercase();

        let contains_flight = subject.contains("flight") || body.contains("flight");
        let contains_delayed = subject.contains("delayed") || body.contains("delayed") || body.contains("delay");

        contains_flight && contains_delayed
    }

    // WHY: Creates an Intent for the flight delay claim process
    fn generate_intent(&self, event: &Event) -> Intent {
        let body = event.payload.get("body")
            .and_then(|v| v.as_str())
            .unwrap_or("");
            
        // Look for 6-letter alphanumeric booking reference (mock/extract)
        let booking_ref = extract_booking_ref(body).unwrap_or_else(|| "UNKNOWN".to_string());
        
        let parameters = serde_json::json!({
            "booking_reference": booking_ref,
            "original_email_subject": event.payload.get("subject").unwrap_or(&serde_json::Value::Null),
            "estimated_delay_minutes": event.payload.get("delay_minutes").unwrap_or(&serde_json::json!(180))
        });

        Intent {
            id: Uuid::new_v4().to_string(),
            domain: "travel".to_string(),
            action: "claim_refund".to_string(),
            confidence: 0.95,
            parameters,
            status: "pending".to_string(),
        }
    }
}

// Simple helper to extract booking reference (usually 6 alphanumeric characters)
fn extract_booking_ref(body: &str) -> Option<String> {
    // Look for "booking reference" or "ref" label
    let lower_body = body.to_lowercase();
    if let Some(idx) = lower_body.find("booking ref") {
        let substring = &body[idx..];
        // Find the next 6-letter uppercase/alphanumeric code
        for word in substring.split_whitespace() {
            let clean: String = word.chars().filter(|c| c.is_alphanumeric()).collect();
            if clean.len() == 6 && clean.chars().all(|c| c.is_ascii_alphanumeric()) {
                return Some(clean.to_uppercase());
            }
        }
    }
    
    // Fallback search
    for word in body.split_whitespace() {
        let clean: String = word.chars().filter(|c| c.is_alphanumeric()).collect();
        if clean.len() == 6 && clean.chars().all(|c| c.is_uppercase() && c.is_alphabetic()) {
            return Some(clean);
        }
    }
    
    None
}
