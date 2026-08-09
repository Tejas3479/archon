use archon_core::voice::{VoiceProcessor, VoiceResult};

#[test]
fn test_voice_travel_intent_complete() {
    let mut processor = VoiceProcessor::new();
    let result = processor.process_command("I want to travel to London").unwrap();
    
    assert!(result.intent_detected);
    assert!(!result.clarification_needed);
    assert!(result.message.contains("london"));
    
    let intent = result.intent.unwrap();
    assert_eq!(intent["domain"], "travel");
    assert_eq!(intent["action"], "search_flights");
    assert_eq!(intent["parameters"]["destination"], "london");
}


#[test]
fn test_voice_travel_intent_clarification() {
    let mut processor = VoiceProcessor::new();
    // 1st turn: missing destination
    let result1 = processor.process_command("I want to book a flight").unwrap();
    assert!(!result1.intent_detected);
    assert!(result1.clarification_needed);
    assert_eq!(result1.message, "What is your flight destination?");
    assert_eq!(processor.awaiting_parameter, Some("destination".to_string()));

    // 2nd turn: provide destination
    let result2 = processor.process_command("Paris").unwrap();
    assert!(result2.intent_detected);
    assert!(!result2.clarification_needed);
    assert!(result2.message.contains("travel search flights"));
    
    let intent = result2.intent.unwrap();
    assert_eq!(intent["domain"], "travel");
    assert_eq!(intent["action"], "search_flights");
    assert_eq!(intent["parameters"]["destination"], "Paris");
    assert!(processor.awaiting_parameter.is_none());
}

#[test]
fn test_voice_food_order_clarification() {
    let mut processor = VoiceProcessor::new();
    // 1st turn: food order triggers restaurant clarification
    let result1 = processor.process_command("I am hungry, let's order food").unwrap();
    assert!(!result1.intent_detected);
    assert!(result1.clarification_needed);
    assert_eq!(result1.message, "Which restaurant would you like to order food from?");
    assert_eq!(processor.awaiting_parameter, Some("restaurant".to_string()));

    // 2nd turn: provide restaurant name
    let result2 = processor.process_command("Pizza Hut").unwrap();
    assert!(result2.intent_detected);
    assert!(!result2.clarification_needed);
    assert!(result2.message.contains("social order dinner"));
    
    let intent = result2.intent.unwrap();
    assert_eq!(intent["domain"], "social");
    assert_eq!(intent["action"], "order_dinner");
    assert_eq!(intent["parameters"]["restaurant"], "Pizza Hut");
}

#[test]
fn test_voice_smart_home_intents() {
    let mut processor = VoiceProcessor::new();
    let result = processor.process_command("turn off the living room lights").unwrap();
    
    assert!(result.intent_detected);
    assert!(!result.clarification_needed);
    let intent = result.intent.unwrap();
    assert_eq!(intent["domain"], "home");
    assert_eq!(intent["action"], "toggle_device");
    assert_eq!(intent["parameters"]["device"], "light");
    assert_eq!(intent["parameters"]["state"], "off");
}

#[test]
fn test_voice_finance_intent() {
    let mut processor = VoiceProcessor::new();
    let result = processor.process_command("how much did I spend this week?").unwrap();
    
    assert!(result.intent_detected);
    assert!(!result.clarification_needed);
    let intent = result.intent.unwrap();
    assert_eq!(intent["domain"], "finance");
    assert_eq!(intent["action"], "detect_subscriptions");
}

#[test]
fn test_voice_health_intent() {
    let mut processor = VoiceProcessor::new();
    let result = processor.process_command("check my heart rate bpm").unwrap();
    
    assert!(result.intent_detected);
    assert!(!result.clarification_needed);
    let intent = result.intent.unwrap();
    assert_eq!(intent["domain"], "health");
    assert_eq!(intent["action"], "detect_anomaly");
}

#[test]
fn test_voice_unknown_intent() {
    let mut processor = VoiceProcessor::new();
    let result = processor.process_command("explain the theory of relativity").unwrap();
    
    assert!(!result.intent_detected);
    assert!(!result.clarification_needed);
    assert!(result.message.contains("Could you clarify"));
}

