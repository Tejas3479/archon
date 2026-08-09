use crate::error::ArchonError;
use serde::{Serialize, Deserialize};

// WHY: Defines the types of recovery strategies the twin can execute autonomous
#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
pub enum RecoveryAction {
    Retry,
    SwitchTool,
    Escalate,
    Abort,
    DeployAnneal,
}

pub struct HealingRouter;

impl HealingRouter {
    // WHY: Classifies the error and maps it to a specific healing strategy
    pub fn recover(failure: &ArchonError) -> RecoveryAction {
        match failure {
            // Transient network issues should be retried
            ArchonError::Network(_) => RecoveryAction::Retry,
            
            // Authentication issues require human intervention (credential renewal)
            ArchonError::Auth(_) => RecoveryAction::Escalate,
            
            // Tool execution failure should cause the agent to try an alternative tool
            // If the failure is due to a signature change, trigger the ANNEAL repair engine
            ArchonError::Tool(msg) => {
                if msg.contains("renamed") || msg.contains("deprecated") {
                    RecoveryAction::DeployAnneal
                } else {
                    RecoveryAction::SwitchTool
                }
            }
            
            // Strict sandbox or cryptography failures are high risk and must be aborted
            ArchonError::Sandbox(_) => RecoveryAction::Abort,
            ArchonError::Vault(_) => RecoveryAction::Abort,
            ArchonError::Serialization(_) => RecoveryAction::Abort,
            
            // Unhandled internal errors must be escalated to the user
            ArchonError::Internal(_) => RecoveryAction::Escalate,
        }
    }
}
