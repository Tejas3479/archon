use archon_core::anneal::{AnnealEngine, FailureRecord, DeltaOp, GraphDelta};
use archon_core::graph::{Graph, Node, NodeType};
use archon_core::anneal::verifier::verify_delta;

#[test]
fn test_anneal_analyze_failure_renaming() {
    let engine = AnnealEngine::new();
    
    // Simulate rename error log
    let failures = vec![FailureRecord {
        error_msg: "Tool call failed: parameter 'id' renamed to 'message_id'".to_string(),
        timestamp: 1622505600,
    }];

    let delta = engine.analyze_failures(&failures).expect("Should analyze successfully");
    assert_eq!(delta.operations.len(), 1);
    
    match &delta.operations[0] {
        DeltaOp::ChangeProperty { node_id, property, value } => {
            assert_eq!(node_id, "tool_node");
            assert_eq!(property, "parameter_mapping");
            assert_eq!(value["id"], "message_id");
        }
        _ => panic!("Expected ChangeProperty delta operation"),
    }
}

#[test]
fn test_verifier_rejects_cycles() {
    let mut graph = Graph::new();
    let _ = graph.add_node(Node { id: "start_node".to_string(), node_type: NodeType::Decision("Start".to_string()) });
    let _ = graph.add_node(Node { id: "node_b".to_string(), node_type: NodeType::ToolCall("tool".to_string()) });
    let _ = graph.add_edge("start_node", "node_b");

    // Propose delta that introduces a directed cycle: node_b -> start_node
    let delta = GraphDelta {
        operations: vec![
            DeltaOp::AddEdge { from_id: "node_b".to_string(), to_id: "start_node".to_string() }
        ]
    };

    let check = verify_delta(&delta, &graph);
    assert!(check.is_err());
    let errs = check.unwrap_err();
    assert!(errs.iter().any(|e| e.contains("introduces a cycle")));
}

#[test]
fn test_verifier_rejects_orphans() {
    let mut graph = Graph::new();
    let _ = graph.add_node(Node { id: "start_node".to_string(), node_type: NodeType::Decision("Start".to_string()) });

    // Propose delta that adds a node without connecting it to the start_node (creating an orphan)
    let delta = GraphDelta {
        operations: vec![
            DeltaOp::AddNode { id: "orphan_node".to_string(), node_type: NodeType::ToolCall("tool".to_string()) }
        ]
    };

    let check = verify_delta(&delta, &graph);
    assert!(check.is_err());
    let errs = check.unwrap_err();
    assert!(errs.iter().any(|e| e.contains("orphaned and unreachable")));
}

#[test]
fn test_apply_valid_delta() {
    let mut graph = Graph::new();
    let _ = graph.add_node(Node { id: "start_node".to_string(), node_type: NodeType::Decision("Start".to_string()) });

    // Propose delta that adds and connects a new node to the start_node
    let delta = GraphDelta {
        operations: vec![
            DeltaOp::AddNode { id: "node_b".to_string(), node_type: NodeType::ToolCall("tool".to_string()) },
            DeltaOp::AddEdge { from_id: "start_node".to_string(), to_id: "node_b".to_string() }
        ]
    };

    graph.apply_delta(&delta).expect("Should apply valid delta successfully");
    assert!(graph.node_ids().contains(&"node_b".to_string()));
    
    // Invariant check on graph itself should pass
    graph.check_invariants().expect("Graph invariants should hold");
}
