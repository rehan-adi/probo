# Stream Service

The real-time streaming service for Probo.

This service connects to Redis via Pub/Sub to listen for market events (e.g., price changes, executed trades) and broadcasts those updates directly to connected frontend clients using WebSockets.

## Setup

1. Install dependencies from the workspace root.
2. Set up the `.env` file:
   ```bash
   cp .env.example .env
   ```
3. Run the service:
   ```bash
   bun start
   ```

## Key Technologies

- **WebSockets:** Socket.io
- **Event Bus:** Redis Pub/Sub (`ioredis`)
- **Runtime:** Bun + Hono
