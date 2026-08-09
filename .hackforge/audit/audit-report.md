<!-- Source: hackforge-audit | Version: v1 | Checkpoint: audit-complete | Dependencies: blueprint.md, codebase-scan -->
# Audit Report: Archon — Autonomous AI Life Twin

## Summary
- **Languages detected:** TypeScript, Rust
- **Files scanned:** 48 source files (all source files excluding node_modules, dist, .next, target)
- **Issues:** 3 CRITICAL, 8 HIGH, 9 MEDIUM, 4 LOW
- **Design compliance:** 42% (5/12 checks — Tailwind used but inconsistently, no design tokens file)
- **Test results:** Tests directory exists (gateway/tests, mobile/__tests__, mcp-server/tests) — not run (no dev environment)
- **Security issues:** 3 surface-level CRITICAL (run hackforge-security for full audit)
- **Observability:** PARTIAL — event_log.ts structured logging in gateway, no Sentry/error tracking

---

## CRITICAL Issues

| # | File | Issue | Fix |
|---|---|---|---|
| C1 | `apps/web/src/pages/dashboard.tsx:43` | Hardcoded `localhost:8787` gateway URL | Move to `NEXT_PUBLIC_GATEWAY_URL` env var |
| C2 | `apps/web/src/pages/team.tsx:30,51,73` | Hardcoded `mock_sso_token_123` Bearer token | Replace with actual NextAuth session token |
| C3 | `apps/gateway/src/index.ts:258` | SSO validation checks `=== "invalid_sso_token"` — real token always passes | Implement actual JWT/OIDC verification |

---

## HIGH Issues

| # | File | Issue | Fix |
|---|---|---|---|
| H1 | `apps/web/src/pages/audit.tsx` | Audit logs are frontend hardcoded mock — not from D1 | Fetch from `/org/:id/audit` endpoint |
| H2 | `archon-core/src/self_reflection.rs:59` | Health score hardcoded to `98` always | Compute from actual ANNEAL/RSI metrics |
| H3 | `apps/gateway/src/index.ts:345-348` | `pub_export_durable()` is empty no-op function | Use proper Wrangler DO re-export syntax |
| H4 | `apps/mobile/App.tsx:69-72` | Identity seed exists → navigate to Dashboard, but Wasm may not have re-derived keys | Call `ArchonBridge.generateIdentity()` from stored seed on boot |
| H5 | `archon-core/src/anneal.rs:62` | AddNode for "new_tool_node" hardcoded — will conflict on second repair | Use dynamic UUIDs for new node IDs |
| H6 | `apps/web/src/pages/dashboard.tsx:29-31` | Stats hardcoded to `{totalActions:320,totalCost:1540,activeAgents:4}` even when gateway is online | Only show gateway data, use skeleton loader |
| H7 | `apps/gateway/src/finops.ts:3` | `DAILY_BUDGET_CENTS=500` hardcoded constant | Move to Cloudflare env var / D1 per-user config |
| H8 | `archon-core/src/voice.rs:77` | Departure date hardcoded to `"2026-06-12"` | Extract from user utterance or use relative date |

---

## MEDIUM Issues

| # | File | Issue | Fix |
|---|---|---|---|
| M1 | `archon-core/src/voice.rs` | Keyword-matching NLU — no ML, no fuzzy match | Integrate Whisper API or on-device ONNX model |
| M2 | `archon-core/src/memory_fhe.rs` | FHE is XOR simulation — misleading to users | Add `[EXPERIMENTAL]` label in UI, plan TFHE-rs |
| M3 | `archon-core/src/agents/defi.rs` | DeFi returns mock balances/swaps | Integrate Ethers.js or 1inch API behind feature flag |
| M4 | `archon-core/src/wasm_bridge.rs:503-516` | `trigger_reflection()` uses hardcoded event_logs strings | Pass real runtime event log from DETECTOR/GRAPH |
| M5 | `apps/web/src/pages/team.tsx:88-91` | Role changes are UI-only, never persisted to gateway | Add PATCH `/org/:id/member/:uid/role` endpoint |
| M6 | `apps/gateway/src/index.ts:66-70` | Skills list is hardcoded 3 skills — not from DB | Connect to skill-marketplace package |
| M7 | `archon-core/src/graph.rs:93,95` | Uses custom `ok_ok_or_else` trait — non-idiomatic Rust | Replace with standard `.ok_or_else()` |
| M8 | `apps/mobile/App.tsx` | 26 screens but no deep-link routing configuration | Add `@react-navigation/deep-link` config |
| M9 | `apps/web/src/pages/team.tsx:162-170` | Role change UI sends no API call | Wire to PATCH endpoint or disable until endpoint exists |

---

## LOW Issues

| # | File | Issue | Fix |
|---|---|---|---|
| L1 | All web pages | No `<head>` SEO meta tags — missing title, description | Add `<Head>` from next/head to all pages |
| L2 | `apps/web/src/components/Layout.tsx` | Only one shared component — nav/sidebar missing proper ARIA roles | Add `role="navigation"`, `aria-label` |
| L3 | `archon-core/src/self_reflection.rs:50-57` | Default mock metrics returned when logs are empty | Remove mock fallback, return zero state |
| L4 | Multiple gateway tools | Tools directory has 18 files — no index barrel file | Create `tools/index.ts` export barrel |

---

## Design Drift Analysis

| Component | Expected (Archon premium AI product) | Actual | Action |
|---|---|---|---|
| Color palette | Glassmorphism dark, gradient accents, depth | Flat `slate-900/950` + `blue-500` only | Add gradient layer, glow effects |
| Typography | Custom premium font (e.g., Space Grotesk, Inter) | Browser default / Tailwind default | Add Google Font import |
| Loading states | Skeleton shimmer loaders | `"Loading Session..."` text only | Build Skeleton component |
| Error states | Friendly error with retry + icon | No error boundaries anywhere | Add React Error Boundary |
| Micro-animations | Hover glow, card depth transitions | `transition-colors duration-150` only | Add `transform: scale()` hover, glow |
| Chart theming | Custom color palette matching design system | Recharts default colors | Theme AreaChart fill colors |
| Mobile screens | Premium dark native UI | Basic white/gray native screens | Apply design system to all 26 screens |
| Empty states | Illustrated empty + CTA | No empty states | Add IllustratedEmpty component |

---

## Psychology Audit

| Check | Result | Details |
|---|---|---|
| First Failure Test | FAIL | No error boundaries — blank screen on API failure |
| Cognitive Load | PASS | Dashboard: 3 decisions max per screen |
| CTA Consistency | FAIL | Buttons vary: blue-600, emerald-600, red-500 — no single primary pattern |
| Default Audit | WARN | `inviteRole` defaults to "member" — correct, but hardcoded org ID `org_123` is wrong |
| Signifier Audit | PASS | Buttons clearly styled as interactive |

---

## Missing Features (from Blueprint)

| Feature | Status | Priority |
|---|---|---|
| Real LLM voice integration | ❌ Not started | HIGH |
| Persistent on-device DB (OPFS/SQLite) | ❌ Not started | HIGH |
| Real-time WebSocket swarm | ❌ Not started | MEDIUM |
| Production FHE (TFHE-rs) | ❌ Not started | LOW |
| Skill marketplace UI | 🔧 Backend scaffold only | MEDIUM |
| MCP server full implementation | 🔧 Scaffold only | MEDIUM |
| Real DeFi integration | ❌ Mock only | MEDIUM |
| Audit log real D1 connection | ❌ Frontend mock | HIGH |
| Role change persistence | ❌ UI only | HIGH |
| SSO OIDC real validation | ❌ Mock check only | CRITICAL |

---

## Repair Prompts

### Fix C1+C2+C3: Environment Variables + Real SSO
> In `apps/web/src/pages/dashboard.tsx`, `team.tsx`, and `audit.tsx`, replace all instances of `"http://localhost:8787"` with `process.env.NEXT_PUBLIC_GATEWAY_URL`. Replace `"Bearer mock_sso_token_123"` with the real NextAuth session token obtained via `useSession()` — `session?.accessToken`. In `apps/gateway/src/index.ts`, replace the ssoMiddleware's `token === "invalid_sso_token"` check with real JWT OIDC verification using `jose` or Cloudflare's JWKS endpoint.

### Fix H1: Real Audit Log
> In `apps/web/src/pages/audit.tsx`, replace the hardcoded `logs` array with a `useEffect` that fetches from `${process.env.NEXT_PUBLIC_GATEWAY_URL}/org/org_123/audit?format=csv` and parses the CSV response into AuditRecord objects. Add a loading skeleton while fetching.

### Fix H5: Dynamic Node IDs in ANNEAL
> In `archon-core/src/anneal.rs`, line 62, replace `"new_tool_node".to_string()` with `format!("tool_node_{}", uuid::Uuid::new_v4())` to prevent conflicts when ANNEAL runs multiple repair cycles.

### Upgrade Design System
> Install `@fontsource/inter` or add Google Fonts link for "Space Grotesk". Update `apps/web/tailwind.config.js` to add custom colors: `archon-primary: '#6366f1'`, `archon-glow: 'rgba(99,102,241,0.15)'`. Add CSS `backdrop-filter: blur(12px)` glassmorphism to all card components. Add `box-shadow: 0 0 20px rgba(99,102,241,0.3)` hover glow to primary buttons.

### Fix M5+M9: Role Change Persistence
> Add `PATCH /org/:orgId/member/:userId` endpoint to `apps/gateway/src/index.ts` with SSO middleware. In `apps/web/src/pages/team.tsx`, wire `handleRoleChange` to call this endpoint. Add optimistic update with rollback on failure.

---

## Session Output
- **Objective:** Post-build audit of Archon codebase
- **Status:** COMPLETE
- **Files created:** .hackforge/audit/audit-report.md
- **Issues found:** 3 CRITICAL, 8 HIGH, 9 MEDIUM, 4 LOW
- **Design compliance:** 42%
- **Repair prompts generated:** 5
- **Next checkpoint:** hackforge-design (elevate the UI/UX system)
