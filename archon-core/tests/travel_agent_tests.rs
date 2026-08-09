use archon_core::agents::DomainAgent;
use archon_core::agents::travel::TravelAgent;
use serde_json::json;

#[test]
fn test_travel_agent_search_flights() {
    let agent = TravelAgent;
    let variables = json!({
        "destination": "Paris"
    });
    
    let result = agent.process_intent("search_flights", &variables).unwrap();
    let flights = result["flights"].as_array().unwrap();
    
    assert_eq!(flights.len(), 2);
    assert_eq!(flights[0]["destination"], "Paris");
}

#[test]
fn test_travel_agent_monitor_price_drop() {
    let agent = TravelAgent;
    
    // Test case: price drop detected (New York, price > 300)
    let variables1 = json!({
        "original_price": 350.00,
        "destination": "New York"
    });
    let result1 = agent.process_intent("monitor_price_drop", &variables1).unwrap();
    assert!(result1["price_drop_detected"].as_bool().unwrap());
    assert_eq!(result1["new_price"].as_f64().unwrap(), 280.00);
    assert_eq!(result1["savings"].as_f64().unwrap(), 70.00);
    assert!(result1["message"].as_str().unwrap().contains("Price Drop Alert"));

    // Test case: no price drop
    let variables2 = json!({
        "original_price": 250.00,
        "destination": "Chicago"
    });
    let result2 = agent.process_intent("monitor_price_drop", &variables2).unwrap();
    assert!(!result2["price_drop_detected"].as_bool().unwrap());
}

#[test]
fn test_travel_agent_auto_checkin() {
    let agent = TravelAgent;
    let variables = json!({
        "booking_reference": "XYZ12345"
    });
    
    let result = agent.process_intent("auto_checkin", &variables).unwrap();
    assert!(result["checkin_successful"].as_bool().unwrap());
    assert_eq!(result["booking_reference"].as_str().unwrap(), "XYZ12345");
    assert_eq!(result["seat"].as_str().unwrap(), "14B");
    assert!(result["message"].as_str().unwrap().contains("Auto Check-in Successful"));
}

#[test]
fn test_travel_agent_suggest_hotel() {
    let agent = TravelAgent;
    let variables = json!({
        "destination": "Tokyo"
    });
    
    let result = agent.process_intent("suggest_hotel", &variables).unwrap();
    let hotels = result["hotels"].as_array().unwrap();
    assert_eq!(hotels.len(), 2);
    assert_eq!(hotels[0]["destination"], "Tokyo");
}
