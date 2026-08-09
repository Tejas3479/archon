use crate::agents::DomainAgent;
use crate::error::ArchonError;
use serde_json::Value;

pub struct ForensicAgent;

impl DomainAgent for ForensicAgent {
    // WHY: Routes incoming forensic actions
    fn process_intent(&self, action: &str, variables: &Value) -> Result<Value, ArchonError> {
        match action {
            "audit_bom" => self.audit_bom(variables),
            _ => Err(ArchonError::Internal(format!("Unknown forensic action: {}", action))),
        }
    }
}

impl ForensicAgent {
    // WHY: Audits the append-only Agent Bill of Materials (BOM) log for exceptions or security scope leaks
    fn audit_bom(&self, variables: &Value) -> Result<Value, ArchonError> {
        let bom_logs = variables.get("bom_logs")
            .and_then(|v| v.as_array())
            .ok_or_else(|| ArchonError::Internal("Missing 'bom_logs' array".to_string()))?;

        let mut issues_found = Vec::new();
        let mut risk_score = 0.0;

        for log_val in bom_logs {
            let log = log_val.as_str().unwrap_or("");
            
            // Check for unhandled exceptions or potential security risks
            let is_error = log.to_lowercase().contains("error") 
                || log.to_lowercase().contains("failed") 
                || log.to_lowercase().contains("exception");
                
            let is_security_leak = log.to_lowercase().contains("leak") 
                || log.to_lowercase().contains("unauthorized")
                || log.to_lowercase().contains("bypass");

            if is_error || is_security_leak {
                issues_found.push(log.to_string());
                
                let next_score = risk_score + 0.2;
                risk_score = if next_score > 1.0 { 1.0 } else { next_score };
            }
        }

        let report = if issues_found.is_empty() {
            "Forensic Audit complete: No vulnerabilities or unhandled exceptions detected in the Agent-BOM trace. System is secure.".to_string()
        } else {
            format!(
                "Forensic Audit complete: Found {} anomalies/security issues. Risk Score: {:.0}%. We recommend reviewing these log lines immediately.",
                issues_found.len(),
                risk_score * 100.0
            )
        };

        Ok(serde_json::json!({
            "risk_score": risk_score,
            "issues_found": issues_found,
            "audit_report": report
        }))
    }
}
