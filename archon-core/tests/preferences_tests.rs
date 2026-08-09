use archon_core::preferences::PreferenceGraph;

#[test]
fn test_default_preferences() {
    let graph = PreferenceGraph::new();
    
    // Seeded values
    assert_eq!(graph.get_preference("tone_casual"), 0.5);
    assert_eq!(graph.get_preference("risk_averse"), 0.5);
    assert_eq!(graph.get_preference("diet_vegan"), 0.0);
    // Unseeded defaults to 0.5
    assert_eq!(graph.get_preference("non_existent"), 0.5);
}

#[test]
fn test_update_and_propagation() {
    let mut graph = PreferenceGraph::new();
    
    // Edge: tone_casual -> risk_averse (weight -0.2)
    // Update tone_casual by +0.2 -> tone_casual becomes 0.7
    // risk_averse should propagate: delta * weight = 0.2 * (-0.2) = -0.04
    // risk_averse goes from 0.5 to 0.46
    graph.update_preference("tone_casual", 0.2);
    
    assert!((graph.get_preference("tone_casual") - 0.7).abs() < 1e-9);
    assert!((graph.get_preference("risk_averse") - 0.46).abs() < 1e-9);
}

#[test]
fn test_clamp_weights() {
    let mut graph = PreferenceGraph::new();
    
    // Update past bounds
    graph.update_preference("tone_casual", 10.0);
    assert_eq!(graph.get_preference("tone_casual"), 1.0);
    
    graph.update_preference("diet_vegan", -10.0);
    assert_eq!(graph.get_preference("diet_vegan"), 0.0);
}
