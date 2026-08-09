use archon_core::detector::{Detector, Event};
use archon_core::task_templates::flight_delay::FlightDelayTemplate;
use serde_json::json;

#[test]
fn test_flight_delay_detection() {
    let template = Box::new(FlightDelayTemplate);
    let detector = Detector::new(vec![template]);
    
    // 1. Matching event
    let event_match = Event {
        domain: "email".to_string(),
        payload: json!({
            "subject": "Urgent: Your Flight AA234 is Delayed",
            "body": "We regret to inform you that your flight is delayed by 3 hours. Booking ref: GJKD8S.",
            "delay_minutes": 180
        }),
        timestamp: 1622505600,
    };
    
    let intents_match = detector.process_event(&event_match);
    assert_eq!(intents_match.len(), 1);
    assert_eq!(intents_match[0].domain, "travel");
    assert_eq!(intents_match[0].action, "claim_refund");
    assert_eq!(intents_match[0].confidence, 0.95);
    assert_eq!(intents_match[0].status, "pending");
    assert_eq!(intents_match[0].parameters["booking_reference"], "GJKD8S");

    // 2. Non-matching event (different domain)
    let event_wrong_domain = Event {
        domain: "calendar".to_string(),
        payload: json!({
            "title": "Meeting: Flight plans discussion"
        }),
        timestamp: 1622505600,
    };
    let intents_wrong_domain = detector.process_event(&event_wrong_domain);
    assert_eq!(intents_wrong_domain.len(), 0);

    // 3. Non-matching event (email without delays)
    let event_ok = Event {
        domain: "email".to_string(),
        payload: json!({
            "subject": "Your boarding pass for flight UA789",
            "body": "Here is your ticket. Safe travels!",
        }),
        timestamp: 1622505600,
    };
    let intents_ok = detector.process_event(&event_ok);
    assert_eq!(intents_ok.len(), 0);
}
