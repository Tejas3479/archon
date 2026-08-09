# Archon Setup Guide

This page details the local development setup, Prisma database configuration, and gateway integrations.

## Prerequisites

- Node.js >= 18 and `pnpm`
- Rust toolchain (with `wasm-pack` installed)
- Cloudflare `wrangler` CLI

## Local Installation

1. Clone the repository and install all dependencies:
   ```bash
   pnpm install
   ```

2. Run database migrations to provision SQLite tables:
   ```bash
   pnpm --filter @archon/db db:generate
   ```

3. Compile the secure Rust enclave Wasm package:
   ```bash
   cd archon-core
   wasm-pack build --target web --out-dir ../apps/mobile/assets/pkg
   ```

## Next.js Admin Portal Setup

To run the admin portal locally, add `.env` in `apps/web`:
```env
NEXTAUTH_SECRET="your_nextauth_jwt_signing_secret_hash"
NEXTAUTH_URL="http://localhost:3000"
```

Start the Next.js development server:
```bash
pnpm --filter @archon/web dev
```
Navigate to `http://localhost:3000/login` to sign in.
