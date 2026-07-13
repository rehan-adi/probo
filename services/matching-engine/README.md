# Matching Engine

The core, high-frequency trading engine of Probo, written in Go.

This service is the "brain" of the platform. It listens for new trade orders pushed to a Redis queue by the API Service. It holds the active orderbooks for all markets in-memory, executes a **Price-Time Priority** matching algorithm, updates locked balances, and pushes completed trades to Kafka. By keeping state in-memory and avoiding database I/O, it achieves sub-millisecond execution times.

## Setup

1. Ensure you have Go installed on your machine.
2. Setup the `.env` file:
   ```bash
   cp .env.example .env
   ```
3. You do **not** need to build the project manually for local development. You can simply run:
   ```bash
   make run
   ```
   _(This uses `go run ./cmd` which compiles and executes the program in one step)_.

## Key Technologies

- **Language:** Go
- **Queues:** Redis
- **Message Broker:** Kafka
