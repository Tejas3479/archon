use std::collections::HashMap;
use serde::{Serialize, Deserialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PreferenceNode {
    pub key: String,
    pub category: String, // e.g. "Style", "Risk", "Diet"
    pub weight: f64,      // range 0.0 to 1.0
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PreferenceEdge {
    pub from: String,
    pub to: String,
    pub weight: f64,
}

// WHY: In-memory property graph to model and learn the user's customized preferences.
// Stored as an encrypted vault block when persisted.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PreferenceGraph {
    pub nodes: HashMap<String, PreferenceNode>,
    pub edges: Vec<PreferenceEdge>,
}

impl PreferenceGraph {
    pub fn new() -> Self {
        let mut graph = Self {
            nodes: HashMap::new(),
            edges: Vec::new(),
        };
        
        // Seed default nodes for Phase 2
        graph.add_node("tone_casual", "Style", 0.5);
        graph.add_node("risk_averse", "Risk", 0.5);
        graph.add_node("diet_vegan", "Diet", 0.0);
        
        // Add association edges (e.g. casual tone is negatively associated with risk-aversion)
        graph.add_edge("tone_casual", "risk_averse", -0.2);

        graph
    }

    pub fn add_node(&mut self, key: &str, category: &str, default_weight: f64) {
        self.nodes.insert(key.to_string(), PreferenceNode {
            key: key.to_string(),
            category: category.to_string(),
            weight: default_weight.clamp(0.0, 1.0),
        });
    }

    pub fn add_edge(&mut self, from: &str, to: &str, weight: f64) {
        self.edges.push(PreferenceEdge {
            from: from.to_string(),
            to: to.to_string(),
            weight,
        });
    }

    // WHY: Returns the weight of a preference (defaults to 0.5)
    pub fn get_preference(&self, key: &str) -> f64 {
        self.nodes.get(key).map(|n| n.weight).unwrap_or(0.5)
    }

    // WHY: Dynamically updates preference weights, propagating delta changes to associated edges
    pub fn update_preference(&mut self, key: &str, delta: f64) {
        if let Some(node) = self.nodes.get_mut(key) {
            node.weight = (node.weight + delta).clamp(0.0, 1.0);
            
            // Propagate updates along associated edges
            let mut propagations = Vec::new();
            for edge in &self.edges {
                if edge.from == key {
                    propagations.push((edge.to.clone(), delta * edge.weight));
                } else if edge.to == key {
                    propagations.push((edge.from.clone(), delta * edge.weight));
                }
            }
            
            for (target_key, target_delta) in propagations {
                if let Some(target_node) = self.nodes.get_mut(&target_key) {
                    target_node.weight = (target_node.weight + target_delta).clamp(0.0, 1.0);
                }
            }
        }
    }
}
