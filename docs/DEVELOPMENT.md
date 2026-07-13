# Local Development Guide

This document explains how to set up the Probo project on your local machine for development.

## Prerequisites

Ensure you have the following installed before starting:

- **[Go](https://go.dev/)**
- **[Bun](https://bun.sh/)**
- **[Docker](https://www.docker.com/)** & **Docker Compose**

---

## 1. Install Dependencies

**Location:** Repository Root

```bash
bun install
```

**What it does:** Installs all Bun workspace dependencies across the repository, links local workspace packages (`packages/*`, `services/*`, `apps/*`), and prepares the repository for local development.

**Why it is required:** The project uses Bun workspaces. Running this at the root ensures all internal package links (like `@probo/database` or `@probo/logger`) are correctly resolved for the various services.

---

## 2. Environment Variables

**Location:** Repository Root

You need to set up `.env` files for the services that require configuration.

```bash
# Database Package
cp packages/database/.env.example packages/database/.env

# Backend Services
cp services/api-service/.env.example services/api-service/.env
cp services/stream-service/.env.example services/stream-service/.env

# Go Matching Engine
cp services/matching-engine/.env.example services/matching-engine/.env
```

**What it does:** Copies the template `.env.example` files to `.env` files.

**Why it is required:** Services read configuration (like database URLs, Redis connection strings, and Kafka brokers) from `.env` files. Without these, the services will fail to start or connect to the infrastructure.

_(Note: Ensure you update any secrets or keys inside these `.env` files if your local setup differs from the default)._

---

## 3. Start Infrastructure

**Location:** Repository Root

```bash
docker-compose up -d
```

**What it does:** Starts PostgreSQL, Redis, Zookeeper, and Kafka containers in the background (`-d` flag).

**Why it is required:** The backend services depend on these stateful systems for data persistence (Postgres), caching/pub-sub (Redis), and reliable message streaming (Kafka).

---

## 4. Run Database Migrations & Seed Data

**Location:** Repository Root

```bash
bun run db:generate
```

- **What it does:** Generates the Prisma Client from the current Prisma schema located in `packages/database`.
- **Why it is required:** The services use the generated Prisma Client to interact with the database in a type-safe manner. This must be run whenever the Prisma schema changes.

```bash
bun run db:migrate
```

- **What it does:** Applies pending Prisma migrations to the local PostgreSQL database using `prisma migrate dev`.
- **Why it is required:** Ensures the database schema matches the expected application state.

```bash
bun run db:seed
```

- **What it does:** Seeds the database with initial development data by running `bun run src/seed.ts` inside the database package.
- **Why it is required:** Provides sample data so you can test features without having to manually insert records.

---

## 5. Start the Backend Services

**Location:** Repository Root

```bash
bun run start:all
```

**What it does:** Concurrently starts all Bun-based backend services (`api-service`, `stream-service`, and `processor-service`).
**Why it is required:** Brings up the core API and worker systems that process orders, stream updates to the frontend, and persist trades to the database.

_(Alternatively, you can start them individually from the Repository Root: `bun run start:api-service`, `bun run start:processor-service`, `bun run start:stream-service`)_

---

## 6. Start the Matching Engine

**Location:** Repository Root

```bash
make run
```

**What it does:** Navigates to `services/matching-engine` and executes `go run ./cmd`.
**Why it is required:** Starts the Go-based high-performance matching engine which processes trades from Redis and publishes matched trades to Kafka.
_(Note: You do **not** need to run `make build` before `make run`. The `go run` command automatically compiles the code into a temporary binary and executes it in a single step, similar to `bun src/server.ts`.)_

---

## 7. Start the Web Application

**Location:** Repository Root

```bash
bun run web:dev
```

**What it does:** Starts the Vite development server for the React frontend application.
**Why it is required:** Allows you to view and interact with the Probo user interface locally on your browser.

---

## Troubleshooting

- **Failed to connect to Redis/Kafka:** Ensure `docker-compose up -d` has fully started all containers before running the backend services. Kafka can sometimes take a few moments to become ready.
- **Port Conflicts:** Ensure ports `5432` (Postgres), `6379`, `6380` (Redis), `2181` (Zookeeper), `9092` (Kafka) and your application ports are not being used by other local services.
- **Prisma Issues:** If you face database client issues (e.g., "Prisma Client is not initialized"), re-run `bun run db:generate`.
