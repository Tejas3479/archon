use archon_core::agents::{health::HealthAgent, DomainAgent};

#[test]
fn test_health_agent_no_anomalies() {
    let agent = HealthAgent;
    let variables = serde_json::json!({
        "heart_rates": [72.0, 75.0, 71.0, 73.0, 74.0]
    });

    let res = agent.process_intent("detect_anomaly", &variables).unwrap();
    
    assert_eq!(res["anomaly_detected"], false);
    assert_eq!(res["anomalies"].as_array().unwrap().len(), 0);
    assert!(res["message"].as_str().unwrap().contains("normal"));
}

#[test]
fn test_health_agent_anomalies_detected() {
    let agent = HealthAgent;
    let variables = serde_json::json!({
        "heart_rates": [70.0, 72.0, 71.0, 125.0, 73.0] // 125.0 is an anomaly (spike > 120 bpm)
    });

    let res = agent.process_intent("detect_anomaly", &variables).unwrap();
    
    assert_eq!(res["anomaly_detected"], true);
    assert_eq!(res["anomalies"].as_array().unwrap().len(), 1);
    assert_eq!(res["anomalies"][0], 125.0);
    assert!(res["message"].as_str().unwrap().contains("Warning: We detected elevated heart rate anomalies"));
}
