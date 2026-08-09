use crate::error::ArchonError;
use serde_json::json;
use tracing::{error, info};

// WHY: EventBus outputs structured logs to stdout/console. The host Webview listens to console logs
// and can intercept these events for audit logging or state updates.
pub fn publish_error(err: &ArchonError) {
    let event = json!({
        "event_type": "ERROR",
        "timestamp": date_now(),
        "payload": {
            "error_code": format!("{:?}", err),
            "message": err.to_string()
        }
    });
    error!("{}", event.to_string());
}

pub fn publish_info(message: &str) {
    let event = json!({
        "event_type": "INFO",
        "timestamp": date_now(),
        "payload": {
            "message": message
        }
    });
    info!("{}", event.to_string());
}

// Helper function to get the current timestamp (using JS Date in wasm context)
fn date_now() -> f64 {
    #[cfg(target_arch = "wasm32")]
    {
        // In wasm, call JS Date.now()
        use wasm_bindgen::prelude::*;
        #[wasm_bindgen]
        extern "C" {
            #[wasm_bindgen(js_namespace = Date, js_name = now)]
            fn date_now_js() -> f64;
        }
        date_now_js()
    }
    #[cfg(not(target_arch = "wasm32"))]
    {
        // In native code (like cargo test), use standard duration
        use std::time::{SystemTime, UNIX_EPOCH};
        SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap_or_default()
            .as_millis() as f64
    }
}
