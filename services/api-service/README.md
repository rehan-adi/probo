# API Service

The primary HTTP backend for Probo, built with [Bun](https://bun.sh/) and [Hono](https://hono.dev/).

This service is responsible for handling user authentication (via Twilio OTP), wallet operations, market data queries, and pushing trade orders to the matching engine via Redis queues. **Crucially, it does not write trades directly to the database** to maintain extreme low latency.

## Setup

1. Install dependencies from the repository root (`bun install`).
2. Set up the `.env` file:
   ```bash
   cp .env.example .env
   ```
3. Run the service (usually via the root command `bun run start:all` or individually):
   ```bash
   bun start
   ```

## Key Technologies

- **Framework:** Hono
- **Runtime:** Bun
- **Caching & Queues:** Redis (via `ioredis`)
- **Validation:** Zod
