use crate::agents::DomainAgent;
use crate::error::ArchonError;
use serde_json::Value;

pub struct FinanceAgent;

impl DomainAgent for FinanceAgent {
    // WHY: Routes incoming financial actions to the appropriate rule-based evaluator
    fn process_intent(&self, action: &str, variables: &Value) -> Result<Value, ArchonError> {
        match action {
            "categorize_transactions" => self.categorize_transactions(variables),
            "detect_subscriptions" => self.detect_subscriptions(variables),
            "suggest_negotiation" => self.suggest_negotiation(variables),
            _ => Err(ArchonError::Internal(format!("Unknown finance action: {}", action))),
        }
    }
}

impl FinanceAgent {
    // WHY: Rule-based transaction categorization
    fn categorize_transactions(&self, variables: &Value) -> Result<Value, ArchonError> {
        let transactions = variables.get("transactions")
            .and_then(|v| v.as_array())
            .ok_or_else(|| ArchonError::Internal("Missing 'transactions' array".to_string()))?;

        let mut categorized = Vec::new();
        for tx in transactions {
            let merchant = tx.get("merchant").and_then(|v| v.as_str()).unwrap_or("");
            let amount = tx.get("amount").and_then(|v| v.as_f64()).unwrap_or(0.0);
            
            let category = if merchant.to_lowercase().contains("airline") {
                "Travel"
            } else if merchant.to_lowercase().contains("spotify") || merchant.to_lowercase().contains("netflix") {
                "Subscriptions"
            } else if merchant.to_lowercase().contains("foods") || merchant.to_lowercase().contains("market") {
                "Groceries"
            } else {
                "Other"
            };

            categorized.push(serde_json::json!({
                "merchant": merchant,
                "amount": amount,
                "category": category
            }));
        }

        Ok(Value::Array(categorized))
    }

    // WHY: Identifies subscriptions by detecting identical recurring merchant amounts
    fn detect_subscriptions(&self, variables: &Value) -> Result<Value, ArchonError> {
        let transactions = variables.get("transactions")
            .and_then(|v| v.as_array())
            .ok_or_else(|| ArchonError::Internal("Missing 'transactions' array".to_string()))?;

        let mut counts = std::collections::HashMap::new();
        for tx in transactions {
            let merchant = tx.get("merchant").and_then(|v| v.as_str()).unwrap_or("");
            let amount = tx.get("amount").and_then(|v| v.as_f64()).unwrap_or(0.0);
            
            let key = (merchant.to_string(), (amount * 100.0).round() as i64);
            *counts.entry(key).or_insert(0) += 1;
        }

        let mut subscriptions = Vec::new();
        for ((merchant, amount_cents), count) in counts {
            if count > 1 {
                subscriptions.push(serde_json::json!({
                    "merchant": merchant,
                    "amount": (amount_cents as f64) / 100.0,
                    "frequency": "recurring"
                }));
            }
        }

        Ok(Value::Array(subscriptions))
    }

    // WHY: Suggests bill negotiations for high subscription amounts
    fn suggest_negotiation(&self, variables: &Value) -> Result<Value, ArchonError> {
        let transactions = self.categorize_transactions(variables)?;
        let tx_array = transactions.as_array().unwrap();

        let mut suggestions = Vec::new();
        for tx in tx_array {
            let category = tx.get("category").and_then(|v| v.as_str()).unwrap_or("");
            let amount = tx.get("amount").and_then(|v| v.as_f64()).unwrap_or(0.0);
            let merchant = tx.get("merchant").and_then(|v| v.as_str()).unwrap_or("");

            if category == "Subscriptions" && amount > 100.0 {
                suggestions.push(format!(
                    "Negotiation Suggestion: Your subscription to '{}' costs ${:.2}. We recommend contacting them to check for promotional rates.",
                    merchant, amount
                ));
            }
        }

        Ok(serde_json::json!({ "suggestions": suggestions }))
    }
}
