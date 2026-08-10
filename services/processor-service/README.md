# processor-service

The processor service acts as a background worker for the system. It listens to events from Kafka emitted by the Matching Engine, processes them by interacting with the database and broadcasts updates via Redis Pub/Sub.

## Running the Service

Make sure your Docker services (Kafka, Zookeeper, Redis, Postgres) are running first.

```bash
bun install
bun run start
```
