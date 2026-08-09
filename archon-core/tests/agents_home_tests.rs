use archon_core::agents::{home::HomeAgent, DomainAgent};

#[test]
fn test_home_agent_preference_learned() {
    let agent = HomeAgent;
    let variables = serde_json::json!({
        "temperature_adjustments": [
            { "temp": 72.0, "time": "10:00" },
            { "temp": 72.0, "time": "12:00" },
            { "temp": 68.0, "time": "14:00" },
            { "temp": 72.0, "time": "16:00" } // 72.0 is seen 3 times (> 2 times threshold)
        ]
    });

    let res = agent.process_intent("learn_preference", &variables).unwrap();
    
    assert_eq!(res["preference_detected"], true);
    assert_eq!(res["learned_temp"], 72.0);
    assert!(res["message"].as_str().unwrap().contains("Preference Detected"));
}

#[test]
fn test_home_agent_insufficient_data() {
    let agent = HomeAgent;
    let variables = serde_json::json!({
        "temperature_adjustments": [
            { "temp": 72.0, "time": "10:00" },
            { "temp": 68.0, "time": "12:00" }
        ]
    });

    let res = agent.process_intent("learn_preference", &variables).unwrap();
    
    assert_eq!(res["preference_detected"], false);
    assert!(res["message"].as_str().unwrap().contains("Gathering more data"));
}
