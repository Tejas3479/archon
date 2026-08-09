use crate::error::ArchonError;

pub mod finance;
pub mod health;
pub mod home;
pub mod social;
pub mod forensic;
pub mod travel;
pub mod defi;


// WHY: DomainAgent trait defines the common interface for domain-specialist twins.
// They receive structured variables and execute calculations (e.g. classification, anomaly detection) on-device.
pub trait DomainAgent {
    fn process_intent(&self, action: &str, variables: &serde_json::Value) -> Result<serde_json::Value, ArchonError>;
}
