use crate::anneal::{GraphDelta, DeltaOp};
use crate::graph::{Graph, Node, NodeType};
use crate::error::ArchonError;
use petgraph::visit::{Dfs, EdgeRef};
use petgraph::stable_graph::StableDiGraph;
use std::collections::HashSet;

fn has_cycle(graph: &StableDiGraph<Node, ()>) -> bool {
    let mut visited = HashSet::new();
    let mut rec_stack = HashSet::new();
    for node in graph.node_indices() {
        if dfs_cycle_check(node, graph, &mut visited, &mut rec_stack) {
            return true;
        }
    }
    false
}

fn dfs_cycle_check(
    node: petgraph::stable_graph::NodeIndex,
    graph: &StableDiGraph<Node, ()>,
    visited: &mut HashSet<petgraph::stable_graph::NodeIndex>,
    rec_stack: &mut HashSet<petgraph::stable_graph::NodeIndex>,
) -> bool {
    if rec_stack.contains(&node) {
        return true;
    }
    if visited.contains(&node) {
        return false;
    }
    
    visited.insert(node);
    rec_stack.insert(node);
    
    for edge in graph.edges(node) {
        let neighbor = edge.target();
        if dfs_cycle_check(neighbor, graph, visited, rec_stack) {
            return true;
        }
    }
    
    rec_stack.remove(&node);
    false
}

// WHY: Validates that applying the proposed GraphDelta does not violate PKG integrity constraints.
// Checks checked: (1) Graph remains acyclic, (2) No orphan nodes (all nodes reachable from 'start_node').
pub fn verify_delta(delta: &GraphDelta, current_graph: &Graph) -> Result<(), Vec<String>> {
    let mut errors = Vec::new();
    
    // 1. Reconstruct a simulated graph
    let mut sim_graph = current_graph.clone_graph_structure();
    
    // Track nodes that are proposed to be added or removed
    let mut nodes_present: HashSet<String> = sim_graph.node_ids().into_iter().collect();

    for op in &delta.operations {
        match op {
            DeltaOp::AddNode { id, node_type } => {
                if nodes_present.contains(id) {
                    errors.push(format!("Invariant violation: Node '{}' already exists", id));
                }
                nodes_present.insert(id.clone());
                if let Err(e) = sim_graph.add_node(Node { id: id.clone(), node_type: node_type.clone() }) {
                    errors.push(format!("Failed to add node during simulation: {:?}", e));
                }
            }
            DeltaOp::RemoveNode { id } => {
                if !nodes_present.contains(id) {
                    errors.push(format!("Invariant violation: Cannot remove non-existent node '{}'", id));
                }
                nodes_present.remove(id);
                sim_graph.remove_node_by_id(id);
            }
            DeltaOp::AddEdge { from_id, to_id } => {
                if !nodes_present.contains(from_id) {
                    errors.push(format!("Invariant violation: Edge source '{}' does not exist", from_id));
                }
                if !nodes_present.contains(to_id) {
                    errors.push(format!("Invariant violation: Edge target '{}' does not exist", to_id));
                }
                if let Err(e) = sim_graph.add_edge(from_id, to_id) {
                    errors.push(format!("Failed to add edge during simulation: {:?}", e));
                }
            }
            DeltaOp::ChangeProperty { node_id, property, value: _ } => {
                if !nodes_present.contains(node_id) {
                    errors.push(format!("Invariant violation: Cannot change property of non-existent node '{}'", node_id));
                }
            }
        }
    }

    if !errors.is_empty() {
        return Err(errors);
    }

    // 2. Invariant Check: Cycle Detection (Acyclicity)
    if has_cycle(sim_graph.raw_graph()) {
        errors.push("Invariant violation: Proposed delta introduces a cycle in the task graph".to_string());
    }

    // 3. Invariant Check: Connectivity / Orphan node check
    // We start from the node ID "start_node". Every node in nodes_present must be reachable from "start_node".
    if nodes_present.contains("start_node") {
        let start_idx = sim_graph.get_node_index("start_node").unwrap();
        let mut dfs = Dfs::new(sim_graph.raw_graph(), start_idx);
        let mut visited = HashSet::new();
        
        while let Some(nx) = dfs.next(sim_graph.raw_graph()) {
            let node_id = sim_graph.raw_graph()[nx].id.clone();
            visited.insert(node_id);
        }
        
        for id in &nodes_present {
            if !visited.contains(id) {
                errors.push(format!("Invariant violation: Node '{}' is orphaned and unreachable from start_node", id));
            }
        }
    } else if !nodes_present.is_empty() {
        errors.push("Invariant violation: 'start_node' is missing from the graph".to_string());
    }

    if errors.is_empty() {
        Ok(())
    } else {
        Err(errors)
    }
}
