# Archon: Autonomous AI Life Twin

[![Live Web Dashboard](https://img.shields.io/badge/Live_Demo-Web_Dashboard-000000?style=for-the-badge&logo=vercel)](http://localhost:3000)
[![Gateway Edge API](https://img.shields.io/badge/Live_API-Cloudflare_Gateway-F38020?style=for-the-badge&logo=cloudflare)](http://localhost:8787)

> **Archon is not a dashboard. It is an autonomous, on-device AI digital twin.** <br/>
> It acts on your behalf—canceling unused subscriptions, claiming flight delays, and managing your smart home—while keeping your private data strictly within a military-grade WebAssembly (WASM) enclave on your device. Zero cloud exposure.

---

## 🔒 Evaluation & Sandbox Mode

Because Archon requires deep integration with highly sensitive user APIs (Plaid for banking, Apple HealthKit for biometrics, Google Workspace for emails), this deployment is currently running in **Sandbox Evaluation Mode**. 

To allow evaluators to experience the autonomous intent engine without requiring them to supply real banking credentials or OAuth tokens, the Cloudflare Gateway deterministically simulates real-world data streams. 

**What is real?** 
The core intelligence (`archon-core`), the Ed25519 cryptography, the AES-256-GCM memory vault, and the self-healing `ANNEAL` agent logic are 100% active, compiled to Rust/WASM, and running locally. The Gateway simply feeds this engine simulated API responses to demonstrate the UX safely.

---

## 🧠 System Architecture

Archon is built on a bleeding-edge stack utilizing edge computing and on-device execution:

```mermaid
graph TD
    subgraph Client Layer
        Mobile[React Native iOS App]
        Web[Next.js Admin Dashboard]
    end

    subgraph Enclave Sandbox (Zero-Cloud)
        Core[Archon Core WASM]
        Rust[Rust Neural Engine]
        Vault[AES-256-GCM Memory Vault]
        Core <--> Rust
        Rust <--> Vault
    end

    subgraph Cloud Edge
        Gateway[Cloudflare Worker Gateway]
        D1[(D1 SQLite)]
        KV[(KV Store)]
        Gateway --> D1
        Gateway --> KV
    end

    Mobile -- JIT Tokens --> Gateway
    Web -- JIT Tokens --> Gateway
    Gateway -- MCP / Swarm Protocol --> Core
```

### Key Technical Achievements
1. **On-Device WASM Enclave (`archon-core`)**: The AI intent logic is written in Rust and compiled to WebAssembly. It executes directly on the client device, meaning your raw bank data and emails are never sent to a centralized LLM server.
2. **Cryptographic Identity (`ed25519`)**: Every Archon instance generates a secure hardware-backed identity upon initialization. Data at rest is encrypted using AES-256-GCM.
3. **Cloudflare D1 Persistence**: The Gateway edge API relies on distributed SQLite (D1) for hyper-fast, globally replicated state management and team configurations.
4. **Premium Encrypted UX**: A completely overhauled Next.js Web Dashboard featuring deep glassmorphism, Recharts visualization, and real-time optimistic UI updates.

---

## 🚀 Running the Local Demo

For engineers and evaluators who wish to run the entire Archon ecosystem locally:

### 1. Prerequisites
- Node.js 18+
- pnpm (`npm install -g pnpm`)
- Rust (`rustup default stable`)
- wrangler (`npm install -g wrangler`)

### 2. Setup the Cloud Edge (Gateway)
1. Navigate to the gateway app: `cd apps/gateway`
2. Install dependencies: `pnpm install`
3. Initialize the D1 database: 
   ```bash
   wrangler d1 execute archon-core-db --local --file=./migrations/0001_init.sql
   ```
4. Start the local worker:
   ```bash
   npm run dev
   ```
   *The gateway will be running on `http://localhost:8787`.*

### 3. Setup the Enterprise Web Dashboard
1. Open a new terminal and navigate to the web app: `cd apps/web`
2. Install dependencies: `pnpm install`
3. Start the Next.js frontend:
   ```bash
   pnpm run dev
   ```
4. Open your browser to `http://localhost:3000`. You will see the glassmorphic Archon Dashboard reflecting live metrics from the gateway.

### 4. Setup the Mobile App (Consumer Twin)
1. Open a third terminal and navigate to the mobile app: `cd apps/mobile`
2. Install dependencies: `pnpm install`
3. Start Expo:
   ```bash
   npx expo start
   ```
4. Press `i` to open in iOS Simulator (or use Expo Go on your physical device).

---
## License
MIT
