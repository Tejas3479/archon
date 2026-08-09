use serde::{Serialize, Deserialize};
use regex::Regex;
use crate::error::ArchonError;
use crate::graph::{NodeType, Graph};

pub mod verifier;


#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FailureRecord {
    pub error_msg: String,
    pub timestamp: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub enum DeltaOp {
    AddNode { id: String, node_type: NodeType },
    RemoveNode { id: String },
    AddEdge { from_id: String, to_id: String },
    ChangeProperty { node_id: String, property: String, value: serde_json::Value },
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GraphDelta {
    pub operations: Vec<DeltaOp>,
}

pub struct AnnealEngine;

impl AnnealEngine {
    pub fn new() -> Self {
        Self
    }

    // WHY: Analyzes failure logs using regex patterns to suggest self-healing GraphDeltas.
    // For example, if a tool fails because a parameter was renamed, it generates a ChangeProperty delta.
    pub fn analyze_failures(&self, failures: &[FailureRecord]) -> Result<GraphDelta, ArchonError> {
        let mut operations = Vec::new();
        
        let rename_regex = Regex::new(r"parameter '([a-zA-Z0-9_]+)' renamed to '([a-zA-Z0-9_]+)'")
            .map_err(|e| ArchonError::Internal(e.to_string()))?;
            
        let deprecate_regex = Regex::new(r"tool '([a-zA-Z0-9_\.]+)' is deprecated, use '([a-zA-Z0-9_\.]+)'")
            .map_err(|e| ArchonError::Internal(e.to_string()))?;

        for failure in failures {
            if let Some(caps) = rename_regex.captures(&failure.error_msg) {
                let _old_param = caps.get(1).map_or("", |m| m.as_str());
                let new_param = caps.get(2).map_or("", |m| m.as_str());
                
                // Propose updating mapping property on node "tool_node"
                operations.push(DeltaOp::ChangeProperty {
                    node_id: "tool_node".to_string(),
                    property: "parameter_mapping".to_string(),
                    value: serde_json::json!({ "id": new_param }),
                });
            } else if let Some(caps) = deprecate_regex.captures(&failure.error_msg) {
                let old_tool = caps.get(1).map_or("", |m| m.as_str());
                let new_tool = caps.get(2).map_or("", |m| m.as_str());
                
                // Propose changing tool call from old to new
                operations.push(DeltaOp::AddNode {
                    id: "new_tool_node".to_string(),
                    node_type: NodeType::ToolCall(new_tool.to_string()),
                });
                operations.push(DeltaOp::AddEdge {
                    from_id: "start_node".to_string(),
                    to_id: "new_tool_node".to_string(),
                });
                operations.push(DeltaOp::RemoveNode {
                    id: "old_tool_node".to_string(),
                });
            }
        }
        
        Ok(GraphDelta { operations })
    }
}
