use archon_core::error::ArchonError;
use archon_core::healing_router::{HealingRouter, RecoveryAction};

#[test]
fn test_healing_router_error_mapping() {
    // 1. Network errors should map to Retry
    let err_net = ArchonError::Network("Connection timed out".to_string());
    assert_eq!(HealingRouter::recover(&err_net), RecoveryAction::Retry);

    // 2. Authentication errors should map to Escalate (needs user action)
    let err_auth = ArchonError::Auth("OAuth token expired".to_string());
    assert_eq!(HealingRouter::recover(&err_auth), RecoveryAction::Escalate);

    // 3. Tool errors should map to SwitchTool
    let err_tool = ArchonError::Tool("Gmail tool API limit hit".to_string());
    assert_eq!(HealingRouter::recover(&err_tool), RecoveryAction::SwitchTool);

    // 4. Sandbox, Vault, and Serialization errors should Abort execution
    let err_sandbox = ArchonError::Sandbox("Attempted directory traversal".to_string());
    let err_vault = ArchonError::Vault("Decryption integrity check failed".to_string());
    let err_serde = ArchonError::Serialization("JSON parse error".to_string());
    
    assert_eq!(HealingRouter::recover(&err_sandbox), RecoveryAction::Abort);
    assert_eq!(HealingRouter::recover(&err_vault), RecoveryAction::Abort);
    assert_eq!(HealingRouter::recover(&err_serde), RecoveryAction::Abort);

    // 5. General internal errors should Escalate
    let err_internal = ArchonError::Internal("Null pointer reference in graph".to_string());
    assert_eq!(HealingRouter::recover(&err_internal), RecoveryAction::Escalate);
}
