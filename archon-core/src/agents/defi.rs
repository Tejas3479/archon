use crate::agents::DomainAgent;
use crate::error::ArchonError;
use serde_json::Value;

pub struct DeFiAgent;

impl DomainAgent for DeFiAgent {
    // WHY: Routes incoming DeFi intent requests to specialized rule actions
    fn process_intent(&self, action: &str, variables: &Value) -> Result<Value, ArchonError> {
        match action {
            "check_balance" => self.check_balance(variables),
            "suggest_swap" => self.suggest_swap(variables),
            "swap_tokens" => self.swap_tokens(variables),
            "stake" => self.stake(variables),
            _ => Err(ArchonError::Internal(format!("Unknown DeFi action: {}", action))),
        }
    }
}

impl DeFiAgent {
    fn check_balance(&self, _variables: &Value) -> Result<Value, ArchonError> {
        Ok(serde_json::json!({
            "ETH": 1.45,
            "USDC": 650.00,
            "USDT": 150.00,
            "total_value_usd": 1.45 * 3500.0 + 650.0 + 150.0
        }))
    }

    // WHY: Monitors volatility and suggests swaps when exchange rates shift > 2%
    fn suggest_swap(&self, variables: &Value) -> Result<Value, ArchonError> {
        let from_token = variables.get("from").and_then(|v| v.as_str()).unwrap_or("USDC");
        let to_token = variables.get("to").and_then(|v| v.as_str()).unwrap_or("ETH");
        let amount = variables.get("amount").and_then(|v| v.as_f64()).unwrap_or(100.0);
        
        let price_change = variables.get("price_change_percent").and_then(|v| v.as_f64()).unwrap_or(2.5);

        let should_swap = price_change > 2.0;

        Ok(serde_json::json!({
            "should_swap": should_swap,
            "from": from_token,
            "to": to_token,
            "amount": amount,
            "rate": 0.00028, // mock rate
            "risk_score": 0.15,
            "message": format!(
                "DeFi Alert: Favorable price movement detected for {} to {} (price changed by {:.1}%). Suggesting swap of {:.2} {}.",
                from_token, to_token, price_change, amount, from_token
            )
        }))
    }

    // WHY: Enforces security transaction limits: anything > $50 or > 5% of portfolio monthly cap requires explicit signing
    fn swap_tokens(&self, variables: &Value) -> Result<Value, ArchonError> {
        let amount = variables.get("amount").and_then(|v| v.as_f64())
            .ok_or_else(|| ArchonError::Internal("Missing 'amount'".to_string()))?;
            
        let monthly_spent = variables.get("monthly_spent").and_then(|v| v.as_f64()).unwrap_or(10.0);
        let portfolio_value = 5725.00; // Total mock portfolio value
        
        let exceeds_fifty = amount > 50.0;
        let exceeds_five_percent = (monthly_spent + amount) > (portfolio_value * 0.05);

        if exceeds_fifty || exceeds_five_percent {
            let reason = if exceeds_fifty {
                "Transaction amount exceeds $50 safety limit"
            } else {
                "Transaction exceeds 5% monthly portfolio spending cap"
            };

            return Ok(serde_json::json!({
                "success": false,
                "approval_required": true,
                "reason": reason,
                "message": format!("DeFi Block: Human approval required. Reason: {}.", reason)
            }));
        }

        Ok(serde_json::json!({
            "success": true,
            "approval_required": false,
            "tx_hash": "0x34a5d89f81a7b4de9cf8bde56a81d1ef8f56ae9043285741bde8bcf9a2de4ff1",
            "message": format!("DeFi execution complete: Swapped ${:.2} successfully.", amount)
        }))
    }

    fn stake(&self, variables: &Value) -> Result<Value, ArchonError> {
        let amount = variables.get("amount").and_then(|v| v.as_f64()).unwrap_or(0.5);
        Ok(serde_json::json!({
            "success": true,
            "staked_amount": amount,
            "yield_apy": 3.8,
            "message": format!("Successfully staked {} ETH at 3.8% APY.", amount)
        }))
    }
}
