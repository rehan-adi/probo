# api-service

The primary HTTP backend service for Probo, built with [Bun](https://bun.sh/) and [Hono](https://hono.dev/).

It handles user authentication, wallet operations, market queries, and admin operations. Endpoints are structured into client (`/capi`) and admin (`/aapi`) routes. It delegates order execution and state sync to the matching engine via Redis queues to maintain low latency.

## Running the Service

Make sure your background infrastructure (Redis, Postgres) is running first.

```bash
bun install
bun run dev
```

## Key Modules

- **Client API (`/capi`):** Authentication, wallet, user profiles, market queries, and order submission.
- **Admin API (`/aapi`):** Market creation, event resolution, user management, and verification approvals.
- **Public API (`/papi`):** Public APIs for api service
