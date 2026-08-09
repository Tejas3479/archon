use archon_core::agents::{finance::FinanceAgent, DomainAgent};

#[test]
fn test_finance_agent_categorization() {
    let agent = FinanceAgent;
    let variables = serde_json::json!({
        "transactions": [
            { "merchant": "Delta Airlines", "amount": 350.00 },
            { "merchant": "Spotify Premium", "amount": 14.99 },
            { "merchant": "Whole Foods Market", "amount": 82.50 },
            { "merchant": "Local Hardware Store", "amount": 25.00 }
        ]
    });

    let res = agent.process_intent("categorize_transactions", &variables).unwrap();
    let txs = res.as_array().unwrap();

    assert_eq!(txs.len(), 4);
    assert_eq!(txs[0]["category"], "Travel");
    assert_eq!(txs[1]["category"], "Subscriptions");
    assert_eq!(txs[2]["category"], "Groceries");
    assert_eq!(txs[3]["category"], "Other");
}

#[test]
fn test_finance_agent_subscriptions() {
    let agent = FinanceAgent;
    let variables = serde_json::json!({
        "transactions": [
            { "merchant": "Netflix Inc", "amount": 19.99 },
            { "merchant": "Local Grocery Store", "amount": 45.00 },
            { "merchant": "Netflix Inc", "amount": 19.99 } // Recurring
        ]
    });

    let res = agent.process_intent("detect_subscriptions", &variables).unwrap();
    let subs = res.as_array().unwrap();

    assert_eq!(subs.len(), 1);
    assert_eq!(subs[0]["merchant"], "Netflix Inc");
    assert_eq!(subs[0]["amount"], 19.99);
}

#[test]
fn test_finance_agent_negotiations() {
    let agent = FinanceAgent;
    let variables = serde_json::json!({
        "transactions": [
            { "merchant": "Spotify Family Plan", "amount": 150.00 }, // High amount subscription
            { "merchant": "Netflix Standard", "amount": 15.49 }
        ]
    });

    let res = agent.process_intent("suggest_negotiation", &variables).unwrap();
    let suggestions = res["suggestions"].as_array().unwrap();

    assert_eq!(suggestions.len(), 1);
    assert!(suggestions[0].as_str().unwrap().contains("Spotify Family Plan"));
}
