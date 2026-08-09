use archon_core::dev_agent::{DevAgent, TaskDescription};
use archon_core::rsi_coordinator::RSICoordinator;
use archon_core::anneal::FailureRecord;
use archon_core::graph::Graph;

#[test]
fn test_dev_agent_request_improvement() {
    let task = TaskDescription {
        target_language: "typescript".to_string(),
        description: "add a new field extraction pattern".to_string(),
        failure_context: "Regex parsing exception in flight delayed notifier".to_string(),
    };

    let response = DevAgent::request_improvement(&task).unwrap();
    assert_eq!(response.language, "typescript");
    assert!(response.code.contains("export const airlineRegex"));
    assert_eq!(response.risk_score, 0.1);
}

#[test]
fn test_rsi_coordinator_triggers_dev_agent_on_code_needed() {
    let failures = vec![
        FailureRecord {
            error_msg: "Needs code improvement for parsing the new airline chatbot format".to_string(),
            timestamp: 123456789,
        }
    ];

    let mut graph = Graph::new();
    let records = RSICoordinator::run(&failures, &[], &mut graph).unwrap();

    assert_eq!(records.len(), 1);
    let record = &records[0];
    assert_eq!(record.status, "FlaggedForHumanReview");
    assert!(record.reason.contains("Code improvement generated"));
    assert!(record.reason.contains("pub const AIRLINE_REGEX"));
}
