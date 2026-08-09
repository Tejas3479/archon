# Archon Secure Enclave Architecture

Archon is engineered as a secure, decentralized digital twin running inside localized secure enclaves (on-device Wasm sandboxes) that coordinate with enterprise systems using Cloudflare Worker gateways.

## System Topology Overview

```
+-----------------------------------------------------------+
|                     User Mobile Device                    |
|  +-----------------------------------------------------+  |
|  |             React Native Expo Frontend              |  |
|  +-----------------------------------------------------+  |
|                            |                              |
|             postMessage Bridge (JSON broker)              |
|                            v                              |
|  +-----------------------------------------------------+  |
|  |           WebView Enclave WASM Runtime              |  |
|  |  - Ed25519 / Dilithium Cryptographic Enclave        |  |
|  |  - Local Vault Storage (AES-GCM-256)                |  |
|  |  - ANNEAL Symbolic Self-Healing Engine              |  |
|  |  - FHE Lattice-encrypted Memory Block serialization |  |
|  +-----------------------------------------------------+  |
+-----------------------------------------------------------+
                             |
                   JIT Bearer Token HTTPS
                             v
+-----------------------------------------------------------+
|              Cloudflare Worker Gateway                    |
|  - Zero-Trust SSO Token Validation (Bearer OIDC JWT)      |
|  - Swarm Connection Durable Object Relay                  |
|  - Homomorphic CKKS Dot-Product Vector Search            |
|  - Mock Developer Agent Sandbox code synthesizer         |
+-----------------------------------------------------------+
```

## Security Model

1. **Zero-Trust Token Gates:** Tools are completely inaccessible without JIT tokens generated via signature proofs validated against Cloudflare KV registries.
2. **Homomorphic Encrypted Search (FHE):** High-dimensional vector searches are performed on-device via lattice-encrypted queries, homomorphically searched on the gateway, and decrypted in the enclave, leaving zero plaintext footprint in transit.
3. **Auditing and GDPR Erasures:** Local biometric validation triggers a signed deletion request sent to the gateway, ensuring cryptographic deletion compliance.
