# Processor Service

A backend worker service built with Bun that acts as the persistence layer for the Probo matching engine.

Instead of writing trades directly to the database synchronously, the Matching Engine publishes matched trades to Kafka. The **Processor Service** consumes these events from Kafka and reliably writes them to PostgreSQL. This asynchronous architecture ensures the Matching Engine remains unblocked and blazingly fast.

## Setup

1. Make sure dependencies are installed via the workspace root.
2. Ensure you have the proper `.env` configuration:

   ```bash
   cp .env.example .env
   ```

3. Start the service (usually run with `bun run start:all` at the root):
   ```bash
   bun start
   ```

## Key Technologies

- **Consumer:** KafkaJS
- **Persistence:** PostgreSQL via Prisma ORM
- **Runtime:** Bun
