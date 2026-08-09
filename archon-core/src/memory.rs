use std::collections::VecDeque;
use serde::{Serialize, Deserialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Message {
    pub role: String,
    pub content: String,
    pub timestamp: u64,
}

pub struct ShortTermMemory {
    messages: VecDeque<Message>,
    capacity: usize,
}

impl ShortTermMemory {
    // WHY: Constructor that initializes memory with a maximum capacity
    pub fn new(capacity: usize) -> Self {
        Self {
            messages: VecDeque::with_capacity(capacity),
            capacity,
        }
    }

    // WHY: Adds a new message to the buffer, sliding out old messages if capacity is exceeded
    pub fn add_message(&mut self, role: &str, content: &str) {
        if self.messages.len() >= self.capacity {
            self.messages.pop_front();
        }
        
        let timestamp = get_timestamp();
        self.messages.push_back(Message {
            role: role.to_string(),
            content: content.to_string(),
            timestamp,
        });
    }

    // WHY: Retrieves the last N messages as a context window
    pub fn context_window(&self, size: usize) -> Vec<Message> {
        let count = std::cmp::min(size, self.messages.len());
        let skip_count = self.messages.len() - count;
        self.messages.iter().skip(skip_count).cloned().collect()
    }
}

// Utility to get current timestamp
fn get_timestamp() -> u64 {
    #[cfg(target_arch = "wasm32")]
    {
        use wasm_bindgen::prelude::*;
        #[wasm_bindgen]
        extern "C" {
            #[wasm_bindgen(js_namespace = Date, js_name = now)]
            fn date_now_js() -> f64;
        }
        date_now_js() as u64
    }
    #[cfg(not(target_arch = "wasm32"))]
    {
        use std::time::{SystemTime, UNIX_EPOCH};
        SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap_or_default()
            .as_secs()
    }
}
