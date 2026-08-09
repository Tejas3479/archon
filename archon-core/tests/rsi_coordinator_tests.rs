use archon_core::graph::{Graph, Node, NodeType};
use archon_core::rsi_coordinator::RSICoordinator;
use archon_core::anneal::FailureRecord;

#[test]
fn test_rsi_coordinator_no_failures() {
    let mut graph = Graph::new();
    let failures = Vec::new();
    let records = RSICoordinator::run(&failures, &[], &mut graph).unwrap();
    assert!(records.is_empty());
}

#[test]
fn test_rsi_coordinator_deprecate_delta_success() {
    let mut graph = Graph::new();
    // Pre-populate nodes for deprecation target
    let _ = graph.add_node(Node { id: "start_node".to_string(), node_type: NodeType::Decision("Check".to_string()) });
    let _ = graph.add_node(Node { id: "old_tool_node".to_string(), node_type: NodeType::ToolCall("email.read".to_string()) });
    let _ = graph.add_edge("start_node", "old_tool_node");

    let failures = vec![
        FailureRecord {
            error_msg: "tool 'email.read' is deprecated, use 'email.search'".to_string(),
            timestamp: 123456,
        }
    ];

    // Running with empty wasm_bytes bypasses actual sandbox execution check
    let records = RSICoordinator::run(&failures, &[], &mut graph).unwrap();
    
    assert_eq!(records.len(), 1);
    let record = &records[0];
    
    // Proving it either got applied or flagged for manual review
    assert!(record.status == "Applied" || record.status == "FlaggedForHumanReview");
    assert!(record.risk_score > 0.0);
}

#[test]
fn test_rsi_coordinator_rejected_by_invariants() {
    let mut graph = Graph::new();
    // Deliberately do not add nodes so the deprecation delta fails referential integrity (missing start_node edge)
    let failures = vec![
        FailureRecord {
            error_msg: "tool 'email.read' is deprecated, use 'email.search'".to_string(),
            timestamp: 123456,
        }
    ];

    let records = RSICoordinator::run(&failures, &[], &mut graph).unwrap();
    assert_eq!(records.len(), 1);
    assert_eq!(records[0].status, "Rejected");
    assert!(records[0].reason.contains("Invariant check failed"));
}
