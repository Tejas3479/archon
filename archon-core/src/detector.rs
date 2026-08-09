use serde::{Serialize, Deserialize};
use uuid::Uuid;

// WHY: Event represents an input signal from parsed sensors/gateways
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Event {
    pub domain: String,
    pub payload: serde_json::Value,
    pub timestamp: u64,
}

// WHY: Intent represents an actionable proactive plan generated for user consent
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Intent {
    pub id: String,
    pub domain: String,
    pub action: String,
    pub confidence: f64,
    pub parameters: serde_json::Value,
    pub status: String,
}

// WHY: TaskTemplate is a trait for creating modules that match events to proactive tasks
pub trait TaskTemplate: Send + Sync {
    fn name(&self) -> &'static str;
    fn preconditions(&self, event: &Event) -> bool;
    fn generate_intent(&self, event: &Event) -> Intent;
}

pub struct Detector {
    templates: Vec<Box<dyn TaskTemplate>>,
}

impl Detector {
    // WHY: Constructor that initializes all registered task templates
    pub fn new(templates: Vec<Box<dyn TaskTemplate>>) -> Self {
        Self { templates }
    }

    // WHY: Scans incoming events across all templates and returns triggered intents
    pub fn process_event(&self, event: &Event) -> Vec<Intent> {
        let mut intents = Vec::new();
        for template in &self.templates {
            if template.preconditions(event) {
                intents.push(template.generate_intent(event));
            }
        }
        intents
    }
}
