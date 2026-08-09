use crate::error::ArchonError;
use petgraph::stable_graph::{StableDiGraph, NodeIndex};
use petgraph::visit::EdgeRef;
use std::collections::HashMap;
use serde::{Serialize, Deserialize};

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub enum NodeType {
    Decision(String),
    ToolCall(String),
    HumanApproval(String),
    SelfHealing(String),
    SwarmNode(String),
    AgentNode(String),
    SpatialNode(String),
    VoiceNode(String),
    DeFiNode(String),
    DeepfakeNode(String),
    GDPRWipeNode(String),
}


#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Node {
    pub id: String,
    pub node_type: NodeType,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct State {
    pub current_node_id: String,
    pub variables: serde_json::Value,
    pub execution_log: Vec<String>,
    pub completed: bool,
}

#[derive(Clone)]
pub struct Graph {
    graph: StableDiGraph<Node, ()>,
    id_to_index: HashMap<String, NodeIndex>,
}

impl Graph {
    // WHY: Creates a new orchestrator graph
    pub fn new() -> Self {
        Self {
            graph: StableDiGraph::new(),
            id_to_index: HashMap::new(),
        }
    }

    // WHY: Creates a cloned copy of the graph structure for simulation
    pub fn clone_graph_structure(&self) -> Self {
        self.clone()
    }

    // WHY: Returns list of all node IDs
    pub fn node_ids(&self) -> Vec<String> {
        self.id_to_index.keys().cloned().collect()
    }

    // WHY: Returns the underlying stable graph structure
    pub fn raw_graph(&self) -> &StableDiGraph<Node, ()> {
        &self.graph
    }

    // WHY: Returns the stable index for a node ID
    pub fn get_node_index(&self, id: &str) -> Option<NodeIndex> {
        self.id_to_index.get(id).copied()
    }

    // WHY: Removes a node and all of its associated edges
    pub fn remove_node_by_id(&mut self, id: &str) {
        if let Some(idx) = self.id_to_index.remove(id) {
            self.graph.remove_node(idx);
        }
    }

    // WHY: Add execution node to graph
    pub fn add_node(&mut self, node: Node) -> Result<(), ArchonError> {
        if self.id_to_index.contains_key(&node.id) {
            return Err(ArchonError::Internal(format!("Node ID already exists: {}", node.id)));
        }
        let id = node.id.clone();
        let idx = self.graph.add_node(node);
        self.id_to_index.insert(id, idx);
        Ok(())
    }

    // WHY: Connect nodes with directed edges
    pub fn add_edge(&mut self, from_id: &str, to_id: &str) -> Result<(), ArchonError> {
        let from_idx = *self.id_to_index.get(from_id)
            .ok_ok_or_else(|| ArchonError::Internal(format!("From node not found: {}", from_id)))?;
        let to_idx = *self.id_to_index.get(to_id)
            .ok_ok_or_else(|| ArchonError::Internal(format!("To node not found: {}", to_id)))?;
        self.graph.add_edge(from_idx, to_idx, ());
        Ok(())
    }

    // WHY: Verifies and applies a GraphDelta to repair the active workflow
    pub fn apply_delta(&mut self, delta: &crate::anneal::GraphDelta) -> Result<(), ArchonError> {
        crate::anneal::verifier::verify_delta(delta, self)
            .map_err(|errors| ArchonError::Internal(format!("GraphDelta failed invariant checks: {:?}", errors)))?;
            
        for op in &delta.operations {
            match op {
                crate::anneal::DeltaOp::AddNode { id, node_type } => {
                    self.add_node(Node { id: id.clone(), node_type: node_type.clone() })?;
                }
                crate::anneal::DeltaOp::RemoveNode { id } => {
                    self.remove_node_by_id(id);
                }
                crate::anneal::DeltaOp::AddEdge { from_id, to_id } => {
                    self.add_edge(from_id, to_id)?;
                }
                crate::anneal::DeltaOp::ChangeProperty { node_id: _, property: _, value: _ } => {
                    // Simulated property change mapping
                }
            }
        }
        Ok(())
    }

    // WHY: Validates cycle-free and reachability checks on the current graph state
    pub fn check_invariants(&self) -> Result<(), ArchonError> {
        let empty_delta = crate::anneal::GraphDelta { operations: Vec::new() };
        crate::anneal::verifier::verify_delta(&empty_delta, self)
            .map_err(|errors| ArchonError::Internal(format!("Graph invariants check failed: {:?}", errors)))
    }

    // WHY: Executes the next step of the graph task workflow based on state
    pub fn execute(&self, state: &mut State) -> Result<(), ArchonError> {
        if state.completed {
            return Ok(());
        }

        if state.current_node_id.is_empty() {
            return Err(ArchonError::Internal("No current node ID in state".to_string()));
        }

        let node_idx = *self.id_to_index.get(&state.current_node_id)
            .ok_ok_or_else(|| ArchonError::Internal(format!("Current node not found in graph: {}", state.current_node_id)))?;

        let node = &self.graph[node_idx];
        
        // Log node execution details
        let log_msg = match &node.node_type {
            NodeType::Decision(desc) => format!("Evaluating decision: {}", desc),
            NodeType::ToolCall(tool) => format!("Invoking tool: {}", tool),
            NodeType::HumanApproval(desc) => format!("Awaiting human approval for: {}", desc),
            NodeType::SelfHealing(desc) => format!("Executing self-healing recovery: {}", desc),
            NodeType::SwarmNode(desc) => format!("Swarm coordination: {}", desc),
            NodeType::AgentNode(desc) => format!("Delegating to domain agent: {}", desc),
            NodeType::SpatialNode(desc) => format!("Updating Spatial UI node: {}", desc),
            NodeType::VoiceNode(desc) => format!("Processing voice node: {}", desc),
            NodeType::DeFiNode(desc) => format!("Executing DeFi strategy: {}", desc),
            NodeType::DeepfakeNode(desc) => format!("Running deepfake analysis: {}", desc),
            NodeType::GDPRWipeNode(desc) => format!("Initiating GDPR wipe sequence: {}", desc),
        };
        state.execution_log.push(log_msg);


        // Find outgoing edges/transitions
        let mut neighbors = self.graph.edges(node_idx);
        if let Some(edge) = neighbors.next() {
            let next_idx = edge.target();
            let next_node = &self.graph[next_idx];
            state.current_node_id = next_node.id.clone();
        } else {
            // No outgoing edges, meaning execution is completed
            state.completed = true;
            state.execution_log.push("Task workflow execution completed successfully".to_string());
        }

        Ok(())
    }
}

// Helper trait to allow `.ok_ok_or_else` syntax
trait OptionExt<T> {
    fn ok_ok_or_else<F: FnOnce() -> ArchonError>(self, err_fn: F) -> Result<T, ArchonError>;
}
impl<T> OptionExt<T> for Option<T> {
    fn ok_ok_or_else<F: FnOnce() -> ArchonError>(self, err_fn: F) -> Result<T, ArchonError> {
        self.ok_or_else(err_fn)
    }
}
