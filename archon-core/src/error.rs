use std::fmt;

// WHY: Structured error format sent to the host Webview and logged to the EventBus
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize, PartialEq, Eq)]
pub enum ArchonError {
    Network(String),
    Auth(String),
    Tool(String),
    Sandbox(String),
    Serialization(String),
    Vault(String),
    Internal(String),
}

impl fmt::Display for ArchonError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            ArchonError::Network(msg) => write!(f, "Network error: {}", msg),
            ArchonError::Auth(msg) => write!(f, "Auth error: {}", msg),
            ArchonError::Tool(msg) => write!(f, "Tool error: {}", msg),
            ArchonError::Sandbox(msg) => write!(f, "Sandbox violation: {}", msg),
            ArchonError::Serialization(msg) => write!(f, "Serialization error: {}", msg),
            ArchonError::Vault(msg) => write!(f, "Vault error: {}", msg),
            ArchonError::Internal(msg) => write!(f, "Internal error: {}", msg),
        }
    }
}

impl std::error::Error for ArchonError {}

// WHY: Allows using `?` for standard serialization/deserialization errors
impl From<serde_json::Error> for ArchonError {
    fn from(err: serde_json::Error) -> Self {
        ArchonError::Serialization(err.to_string())
    }
}

// WHY: Allows using `?` when performing cryptography/vault operations
impl From<aes_gcm::Error> for ArchonError {
    fn from(err: aes_gcm::Error) -> Self {
        ArchonError::Vault(err.to_string())
    }
}

// WHY: Convert from ed25519-dalek SignatureError
impl From<ed25519_dalek::SignatureError> for ArchonError {
    fn from(err: ed25519_dalek::SignatureError) -> Self {
        ArchonError::Auth(err.to_string())
    }
}
