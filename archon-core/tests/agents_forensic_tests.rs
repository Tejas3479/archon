use archon_core::agents::{forensic::ForensicAgent, DomainAgent};

#[test]
fn test_forensic_agent_secure_logs() {
    let agent = ForensicAgent;
    let variables = serde_json::json!({
        "bom_logs": [
            "Initiating claim refund sequence",
            "Tool email.read successfully executed with token"
        ]
    });

    let res = agent.process_intent("audit_bom", &variables).unwrap();

    assert_eq!(res["risk_score"], 0.0);
    assert_eq!(res["issues_found"].as_array().unwrap().len(), 0);
    assert!(res["audit_report"].as_str().unwrap().contains("No vulnerabilities"));
}

#[test]
fn test_forensic_agent_anomalies_flagged() {
    let agent = ForensicAgent;
    let variables = serde_json::json!({
        "bom_logs": [
            "Tool call failed: parameter 'id' renamed to 'message_id'", // Error
            "Unauthorized tool execution attempt by peer 0x99",         // Security leak
            "Graph invariants check passed"
        ]
    });

    let res = agent.process_intent("audit_bom", &variables).unwrap();

    // 2 issues -> risk_score = 0.4
    assert_eq!(res["risk_score"], 0.4);
    assert_eq!(res["issues_found"].as_array().unwrap().len(), 2);
    assert!(res["audit_report"].as_str().unwrap().contains("Found 2 anomalies"));
}
