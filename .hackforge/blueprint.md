<!-- Source: hackforge-analyze | Confidence: STRONG | Version: v1 | Checkpoint: analyze-complete | Dependencies: full-codebase-scan -->

# Blueprint: Archon — Autonomous AI Life Twin Platform

## Metadata
- **Type:** PRODUCT
- **Domain:** AI-powered personal digital twin / autonomous agent platform
- **Generated:** 2026-07-22-191200
- **Languages:** TypeScript (Next.js, React Native, Hono) + Rust (Wasm core)
- **Monorepo:** pnpm workspaces + Turborepo

## Problem Statement
Archon is an autonomous AI "life twin" — a personal AI agent that lives on the user device (via Rust compiled to WebAssembly), manages all life domains (finance, health, home, social, travel, DeFi), self-heals its own workflows using the ANNEAL engine, communicates peer-to-peer with other twins via encrypted swarm messaging, and preserves user sovereignty through on-device cryptographic identity (Ed25519/X25519). Serves both individual consumers (mobile) and enterprise teams (Next.js web admin + Cloudflare gateway).

## Architecture Pattern
Modular Monorepo (Multi-runtime). Three runtimes: Rust/Wasm (on-device intelligence), Cloudflare Workers (edge gateway), Next.js+React Native (presentation). Alternative: Microservices — rejected, Cloudflare DO already provides stateful isolation per user.

## Tech Stack Summary
| Layer | Choice | Version | Confidence |
|---|---|---|---|
| Core intelligence | Rust → WebAssembly | 2021 edition | STRONG |
| Mobile | React Native + Jotai | 0.74+ | STRONG |
| Web admin | Next.js (Pages Router) | 14 | STRONG |
| Edge API | Hono on Cloudflare Workers | 4.x | STRONG |
| Database | Cloudflare D1 (SQLite) | — | STRONG |
| State | Cloudflare KV + Durable Objects | — | STRONG |
| Crypto signing | ed25519-dalek | 2.1.1 | STRONG |
| Crypto DH | x25519-dalek | 2.0.1 | STRONG |
| Crypto encryption | aes-gcm | 0.10.3 | STRONG |
| Graph engine | petgraph | 0.6.4 | STRONG |
| WASM sandbox | wasmi | 0.32.0 | STRONG |
| PQC (optional) | liboqs (Dilithium) | path dep | MEDIUM |
| Auth (web) | NextAuth.js | 4.x | STRONG |

## Innovation Differentiators
1. On-device Rust/WASM AI — zero plaintext leaves device (privacy-first, unlike all cloud AI)
2. ANNEAL Self-Healing Graph — regex analysis generates GraphDelta ops, sandbox-verified, 10% human sampling
3. W3C DID:key Verifiable Credentials — full VC issuance/verification with did:key DIDs
4. X25519 Family Swarm E2E — DH key exchange + HKDF + AES-GCM P2P without central server
5. FHE Memory Search (simulated) — placeholder for homomorphic encrypted semantic search
6. RSI + DevAgent Loop — self-improving agent that generates code patches for human review

## Build Order Status
- COMPLETE (24/30): identity, vault, event_bus, graph, ANNEAL, 7 domain agents, voice, swarm, VC, wasm_bridge (638 lines), Hono gateway, JIT auth, FinOps, OAuth/DPoP, 18 tools, org mgmt, audit export, Next.js web, 26-screen React Native mobile, spatial_ui, self_reflection, deepfake, gdpr_wiper, memory_fhe, dev_agent
- SCAFFOLDED (2/30): skill-marketplace, mcp-server
- MISSING (4/30): Real LLM integration, real-time WebSocket swarm, production FHE, real DeFi/payment

## Critical Issues Found
| Severity | Issue | File |
|---|---|---|
| CRITICAL | Mock SSO token "mock_sso_token_123" hardcoded | team.tsx, dashboard.tsx, audit.tsx |
| CRITICAL | Gateway URL hardcoded to localhost:8787 | team.tsx, dashboard.tsx |
| HIGH | Audit log is frontend mock data, not from D1 | audit.tsx |
| HIGH | Health score hardcoded to 98 | self_reflection.rs |
| HIGH | pub_export_durable() is empty no-op hack | gateway/index.ts |
| MEDIUM | Voice NLU is keyword-matching, not real AI | voice.rs |
| MEDIUM | MemoryFHE is XOR simulation, not real FHE | memory_fhe.rs |
| MEDIUM | DeFi agent returns mock data | agents/defi.rs |
| MEDIUM | No persistent on-device DB (in-memory graph lost on kill) | wasm_bridge.rs |

## Kill Conditions
- WASM bundle exceeds 5MB → investigate code splitting
- D1 free tier limits hit → upgrade or mock locally
- Swarm real-time latency exceeds 500ms → upgrade to DO WebSocket hibernation API

## Elevation Sprint Priority
1. IMMEDIATE: Fix hardcoded tokens, localhost URLs, mock SSO
2. HIGH: Design system upgrade (glassmorphism premium dark UI)
3. HIGH: LLM voice integration (replace keyword NLU)
4. HIGH: Persistent on-device state (OPFS/SQLite for WASM)
5. MEDIUM: Real-time swarm (DO WebSocket hibernation API)
6. LOW: Production FHE (TFHE-rs)
