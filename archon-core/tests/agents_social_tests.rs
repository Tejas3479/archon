use archon_core::agents::{social::SocialAgent, DomainAgent};

#[test]
fn test_social_agent_milestones() {
    let agent = SocialAgent;
    let variables = serde_json::json!({
        "messages": [
            { "sender": "Mom", "text": "Happy birthday to you, hope it's great!" },
            { "sender": "John", "text": "Congrats on the new job promotion!" },
            { "sender": "Alice", "text": "Can't wait for the wedding next week!" },
            { "sender": "Bob", "text": "What are you doing today?" } // No milestone
        ]
    });

    let res = agent.process_intent("extract_life_events", &variables).unwrap();
    let events = res.as_array().unwrap();

    assert_eq!(events.len(), 3);
    
    assert_eq!(events[0]["event_type"], "Birthday");
    assert_eq!(events[0]["sender"], "Mom");
    assert!(events[0]["suggestion"].as_str().unwrap().contains("birthday"));

    assert_eq!(events[1]["event_type"], "Career Milestone");
    assert_eq!(events[1]["sender"], "John");
    assert!(events[1]["suggestion"].as_str().unwrap().contains("congratulatory"));

    assert_eq!(events[2]["event_type"], "Relationship Milestone");
    assert_eq!(events[2]["sender"], "Alice");
    assert!(events[2]["suggestion"].as_str().unwrap().contains("registry"));
}
