use crate::error::ArchonError;
use serde::{Serialize, Deserialize};

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct VoiceProcessor {
    pub awaiting_parameter: Option<String>,
    pub current_domain: Option<String>,
    pub current_action: Option<String>,
    pub stored_params: serde_json::Map<String, serde_json::Value>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VoiceResult {
    pub intent_detected: bool,
    pub clarification_needed: bool,
    pub message: String,
    pub intent: Option<serde_json::Value>,
}

impl VoiceProcessor {
    pub fn new() -> Self {
        Self::default()
    }

    // WHY: Processes natural language text inputs and classifies them into structured twin actions,
    // handling multi-turn dialogues when required parameters are missing.
    pub fn process_command(&mut self, text: &str) -> Result<VoiceResult, ArchonError> {
        let text_lower = text.to_lowercase();

        // 1. Check if we are currently awaiting a clarification parameter from previous turn
        if let Some(param) = &self.awaiting_parameter {
            let p_name = param.clone();
            self.stored_params.insert(p_name, serde_json::json!(text.to_string()));
            self.awaiting_parameter = None;

            let domain = self.current_domain.take().unwrap_or_default();
            let action = self.current_action.take().unwrap_or_default();
            let params = serde_json::Value::Object(self.stored_params.clone());
            self.stored_params.clear();

            return Ok(VoiceResult {
                intent_detected: true,
                clarification_needed: false,
                message: format!("Confirmed. Initiating {} {} workflow.", domain, action.replace("_", " ")),
                intent: Some(serde_json::json!({
                    "domain": domain,
                    "action": action,
                    "parameters": params
                })),
            });
        }

        // 2. Classify base intent type from keywords
        
        // --- Travel / Flight Intent ---
        if text_lower.contains("flight") || text_lower.contains("travel") || text_lower.contains("trip") || text_lower.contains("book") {
            // Check if destination is specified in text
            let destinations = vec!["new york", "london", "paris", "tokyo", "chicago", "san francisco", "berlin"];
            let mut found_dest = None;
            for dest in destinations {
                if text_lower.contains(dest) {
                    found_dest = Some(dest.to_string());
                    break;
                }
            }

            if let Some(dest) = found_dest {
                return Ok(VoiceResult {
                    intent_detected: true,
                    clarification_needed: false,
                    message: format!("Scheduling flight search to {}.", dest),
                    intent: Some(serde_json::json!({
                        "domain": "travel",
                        "action": "search_flights",
                        "parameters": {
                            "destination": dest,
                            "departure_date": "2026-06-12"
                        }
                    })),
                });
            } else {
                // Clarification needed
                self.awaiting_parameter = Some("destination".to_string());
                self.current_domain = Some("travel".to_string());
                self.current_action = Some("search_flights".to_string());
                return Ok(VoiceResult {
                    intent_detected: false,
                    clarification_needed: true,
                    message: "What is your flight destination?".to_string(),
                    intent: None,
                });
            }
        }

        // --- Food Order Intent (Awaiting restaurant clarification) ---
        if text_lower.contains("order food") || text_lower.contains("delivery") || text_lower.contains("hungry") {
            self.awaiting_parameter = Some("restaurant".to_string());
            self.current_domain = Some("social".to_string());
            self.current_action = Some("order_dinner".to_string());
            return Ok(VoiceResult {
                intent_detected: false,
                clarification_needed: true,
                message: "Which restaurant would you like to order food from?".to_string(),
                intent: None,
            });
        }

        // --- Home Automation / Control Intent ---
        if text_lower.contains("light") || text_lower.contains("lights") || text_lower.contains("turn off") || text_lower.contains("turn on") || text_lower.contains("temp") || text_lower.contains("temperature") || text_lower.contains("thermostat") {
            return Ok(VoiceResult {
                intent_detected: true,
                clarification_needed: false,
                message: "Updating smart home configurations.".to_string(),
                intent: Some(serde_json::json!({
                    "domain": "home",
                    "action": "toggle_device",
                    "parameters": {
                        "device": if text_lower.contains("light") { "light" } else { "thermostat" },
                        "state": if text_lower.contains("off") { "off" } else { "on" }
                    }
                })),
            });
        }

        // --- Finance / Balance Intent ---
        if text_lower.contains("balance") || text_lower.contains("subscription") || text_lower.contains("spend") || text_lower.contains("money") || text_lower.contains("cost") || text_lower.contains("finance") {
            return Ok(VoiceResult {
                intent_detected: true,
                clarification_needed: false,
                message: "Retrieving active subscription cost ledgers.".to_string(),
                intent: Some(serde_json::json!({
                    "domain": "finance",
                    "action": "detect_subscriptions",
                    "parameters": {}
                })),
            });
        }

        // --- Health / Biosensors Intent ---
        if text_lower.contains("heart") || text_lower.contains("rate") || text_lower.contains("pulse") || text_lower.contains("health") || text_lower.contains("bpm") {
            return Ok(VoiceResult {
                intent_detected: true,
                clarification_needed: false,
                message: "Auditing biometrics heart rate log history.".to_string(),
                intent: Some(serde_json::json!({
                    "domain": "health",
                    "action": "detect_anomaly",
                    "parameters": {}
                })),
            });
        }

        // --- Social Greetings / Reminders Intent ---
        if text_lower.contains("birthday") || text_lower.contains("congrats") || text_lower.contains("wedding") || text_lower.contains("message") || text_lower.contains("greetings") || text_lower.contains("social") {
            return Ok(VoiceResult {
                intent_detected: true,
                clarification_needed: false,
                message: "Analyzing message history logs for social milestones.".to_string(),
                intent: Some(serde_json::json!({
                    "domain": "social",
                    "action": "extract_life_events",
                    "parameters": {}
                })),
            });
        }

        // No matches found
        Ok(VoiceResult {
            intent_detected: false,
            clarification_needed: false,
            message: "I heard you, but I couldn't map that to a specific twin capability. Could you clarify?".to_string(),
            intent: None,
        })
    }
}
