use archon_core::agents::DomainAgent;
use archon_core::agents::defi::DeFiAgent;
use serde_json::json;

#[test]
fn test_defi_agent_check_balance() {
    let agent = DeFiAgent;
    let balance = agent.process_intent("check_balance", &json!({})).unwrap();
    
    assert!(balance.get("ETH").is_some());
    assert!(balance.get("USDC").is_some());
    assert!(balance.get("total_value_usd").unwrap().as_f64().unwrap() > 0.0);
}

#[test]
fn test_defi_agent_suggest_swap() {
    let agent = DeFiAgent;
    
    // Test case: price change > 2% suggests swap
    let variables1 = json!({
        "from": "USDC",
        "to": "ETH",
        "amount": 200.0,
        "price_change_percent": 3.2
    });
    let suggestion1 = agent.process_intent("suggest_swap", &variables1).unwrap();
    assert!(suggestion1["should_swap"].as_bool().unwrap());
    assert!(suggestion1["message"].as_str().unwrap().contains("Suggesting swap"));

    // Test case: price change <= 2% does not suggest swap
    let variables2 = json!({
        "from": "USDC",
        "to": "ETH",
        "amount": 200.0,
        "price_change_percent": 1.1
    });
    let suggestion2 = agent.process_intent("suggest_swap", &variables2).unwrap();
    assert!(!suggestion2["should_swap"].as_bool().unwrap());
}

#[test]
fn test_defi_agent_swap_tokens_limits() {
    let agent = DeFiAgent;

    // Test case: swap amount <= $50, succeeds without manual review
    let variables1 = json!({
        "amount": 30.00,
        "monthly_spent": 10.00
    });
    let tx1 = agent.process_intent("swap_tokens", &variables1).unwrap();
    assert!(tx1["success"].as_bool().unwrap());
    assert!(!tx1["approval_required"].as_bool().unwrap());

    // Test case: swap amount > $50, blocked for approval
    let variables2 = json!({
        "amount": 100.00,
        "monthly_spent": 10.00
    });
    let tx2 = agent.process_intent("swap_tokens", &variables2).unwrap();
    assert!(!tx2["success"].as_bool().unwrap());
    assert!(tx2["approval_required"].as_bool().unwrap());
    assert_eq!(tx2["reason"].as_str().unwrap(), "Transaction amount exceeds $50 safety limit");

    // Test case: swap exceeds 5% monthly portfolio spending limit (5% of 5725 = 286.25)
    let variables3 = json!({
        "amount": 40.00,
        "monthly_spent": 260.00
    });
    let tx3 = agent.process_intent("swap_tokens", &variables3).unwrap();
    assert!(!tx3["success"].as_bool().unwrap());
    assert!(tx3["approval_required"].as_bool().unwrap());
    assert!(tx3["reason"].as_str().unwrap().contains("spending cap"));
}
