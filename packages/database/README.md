# Database Package

This package manages the PostgreSQL database connection, schema, and migrations for the entire Probo project using [Prisma ORM](https://www.prisma.io/).

It is imported by other services (like `api-service` and `processor-service`) to interact with the database in a type-safe manner.

## Setup & Usage

To use this package, you must ensure the database is running (via Docker Compose) and the Prisma Client is generated.

From the repository root, you can run:

```bash
# Generate the Prisma Client
bun run db:generate

# Apply pending migrations
bun run db:migrate

# Seed the database
bun run db:seed
```

Environment variables are required for Prisma to connect to the database. You should have a `.env` file present:

```bash
cp .env.example .env
```
