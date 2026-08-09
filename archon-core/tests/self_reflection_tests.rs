use archon_core::self_reflection::ReflectionEngine;

#[test]
fn test_reflection_report_empty_logs() {
    // Should trigger fallback default metrics
    let logs = Vec::new();
    let report = ReflectionEngine::generate_report(&logs).unwrap();
    
    assert_eq!(report.actions_count, 5);
    assert_eq!(report.time_saved_minutes, 120);
    assert_eq!(report.money_saved_dollars, 220.0);
    assert_eq!(report.self_healing_count, 1);
    assert_eq!(report.total_finops_cost_cents, 150);
    assert_eq!(report.health_score, 98);
}

#[test]
fn test_reflection_report_with_logs() {
    let logs = vec![
        "Approved flight claim refund proposal".to_string(), // time +30, money +150
        "Found price_drop for NYC flight".to_string(),       // time +15, money +70
        "Learned home_assistant comfort temperature".to_string(), // time +5
        "Applied ANNEAL self-healing repair".to_string(),       // self_healing +1, time +20
        "Executed tool calendar.list".to_string()             // cost +10
    ];
    
    let report = ReflectionEngine::generate_report(&logs).unwrap();
    
    assert_eq!(report.actions_count, 5);
    assert_eq!(report.time_saved_minutes, 30 + 15 + 5 + 20); // 70
    assert_eq!(report.money_saved_dollars, 150.0 + 70.0);      // 220.0
    assert_eq!(report.self_healing_count, 1);
    assert_eq!(report.total_finops_cost_cents, 10);
    assert!(report.message.contains("saved 70 minutes"));
    assert!(report.message.contains("recovered $220.00"));
}
