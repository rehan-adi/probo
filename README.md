# Probo: Building a High-Frequency Opinion Trading / Prediction Market Platform from scratch where users can trade on the outcome of future events.

> _"I wanted to understand how trading systems and low latency systems work under the hood. Not just the APIs, but the deep internal engineering of how they match thousands of orders per second without race conditions ?How do they handle money when every millisecond counts ? This project is a simple, straightforward implementation of those kinds of systems."_

## The Architecture: Two Core Journeys

When I started designing Probo by clonning and revers-engneering it from first principals thiking, I knew a monolithic architecture wouldn't cut it. I needed something that could scale independently and handle the "thundering herd" of users during live events.

### Journey 1: User Onboarding (First Login Flow)

The first time a user opens the app, multiple backend systems collaborate to establish their identity and financial state.  
This flow is designed for **speed, safety, and eventual consistency**.

### 1. Phone Authentication (OTP-Based)

- The user enters their phone number.
- A **6-digit OTP** is generated and stored in **Redis** with a TTL of **5 minutes**.
- OTP delivery is handled via SMS (Twilio).
- Redis acts as a short-lived authentication cache, avoiding unnecessary database writes during OTP validation.

### 2. User Creation & Identity Sync

- If the phone number does not exist:
  - A new user record is created in **Postgres**.
  - A unique referral code is generated.
- After user creation, a `CREATE_USER` event is pushed to the **Matching Engine**.
- Engine sync is **retryable**:
  - Up to **3 retries** are attempted for transient failures.
  - Failures are logged and alerted.
  - User login is **not blocked** if engine sync fails.

> **Design Principle**
>
> - Postgres is the **Source of Truth** for user identity.
> - The Matching Engine is a **Source of Speed**, kept in sync via events.

### 3. OTP Verification & Wallet Initialization

- Upon successful OTP verification:
  - The OTP is deleted from Redis.
  - A JWT is generated and stored in an **HTTP-only, secure cookie**.
- If the user is logging in for the **first time**:
  - An INR wallet is created atomically using a database transaction.
  - A **₹15 signup bonus** is credited.
  - A corresponding transaction history record is created.

### 4. Engine Balance Sync (Eventually Consistent)

- After wallet creation, an `INIT_BALANCE` event is sent to the Matching Engine.
- This ensures the user’s balance is available **in-memory** for low-latency trading.
- Engine sync behavior:
  - Retries on retryable failures.
  - Does **not** block user login if the engine is temporarily unavailable.

> **Consistency Model**
>
> - Financial data is always correct in **Postgres**.
> - Engine state is **eventually consistent**, optimized for performance.

### Journey 2: A Trade Request

This is the core loop. When a user bets "Yes" on "Will India win?", speed is everything.

1.  The Entry:
    - The request hits the **API Service** (built with **Bun** & **Hono**). I chose Bun for its faster startup time and improved I/O performance compared to Node.js in many benchmarks.
    - The API verifies the JWT, checks the payload, and then—_crucially_—**it does not touch the database**.
    - It pushes the order intent to a **Redis Queue**. This decouples the HTTP response from the matching logic. Latency here is typically **< 14ms**.

2.  **The Brain (Matching Engine)**:
    - The **Go** Engine picks up the order. It locks the specific market's orderbook.
    - It runs a **Price-Time Priority** algorithm. If a match is found, it executes the trade in-memory, updates the user's locked balance, and generates a `Trade Executed` event.
    - All of this happens in **sub-millisecond** timeframes.

3.  **The Reliability Layer (Kafka)**:
    - Matched trades are produced to **Apache Kafka**. This acts as an immutable log. If the DB crashes, we replay the Kafka stream.

4.  **The Persistence (DB Processor)**:
    - A separate worker listens to Kafka and batch-inserts trades into **PostgreSQL**.

5.  **The Feedback Loop (Stream Service)**:
    - Results are broadcast via **WebSockets (Socket.io)** to the frontend. I used a "Room" pattern so users only receive updates for markets they are watching.

## Deep Dive: Engineering Decisions

### 1. In-House KYC Simulation

> _"In a real fintech app, you verify PAN and Bank details against government databases."_

While reverse-engineering the actual Probo app (via the Network Tab), I noticed they call an external service for PAN verification. To mimic this:

- When users submit pan/bank The system creates a **Pending Request** record in the database.
- This request is visible to **admins via an internal dashboard**.
- Admins manually review the request and update its status to **VERIFIED** or **REJECTED**.

### 2. The Referral System

#### Design Approach

- The referral flow is **database-first and transactionally safe**.
- All validation checks happen synchronously before any reward is issued.

#### Referral Processing Flow

- When a new user submits a referral code:
  - The system validates the code and prevents self-referrals.
  - A single **database transaction** is used to:
    - Credit the referrer’s wallet
    - Record the referral relationship
    - Mark the referred user as no longer new
    - Create an immutable transaction history entry
- This guarantees **atomicity** and prevents double-crediting under concurrent requests.

#### Engine Synchronization

- After the database transaction succeeds, a `REFERRAL_CREDIT` event is pushed to a queue.
- This event syncs the updated balance with the Matching Engine.
- The queue is **not responsible for deciding rewards**—it only mirrors the already-committed database state.
- Engine sync is retryable and does not affect user-facing correctness.

### 3. Transaction Idempotency

Double-spending is the nightmare of any financial app.

- For **Deposits & Withdrawals**, every transaction is wrapped in a `Prisma.$transaction`.
- We use strict ACID compliance: Money is deducted from the wallet and the transaction log is created in the _same_ atomic commit. If one fails, both roll back.

### 4. Logging Strategy

Unstructured logging using `console.log` can introduce unnecessary overhead in high-throughput Node.js applications, especially under load.

#### Design Choice

- The system uses **Pino**, a high-performance structured logger.
- Logs are written asynchronously and serialized efficiently, reducing pressure on the event loop.
- Structured logs also improve observability and downstream log processing.

While exact performance gains vary by workload, this approach is widely used in production systems to improve throughput and reduce logging-related bottlenecks.

## Deployment Strategy

### Option A: Low Budget / MVP

For a resume project or < 1000 users.

- **Provider**: AWS Lightsail or DigitalOcean Droplet.
- **Setup**: Docker Compose allowing all services (api, matching-engine, db-processor, stream-service, Redis, Postgres) to run on a single instance.
- **Why?**: Simple to manage, zero network latency between services (localhost networking).

### Option B: High Scale

For handling 100k trades/sec.

- **Orchestration**: Kubernetes (EKS).
  - **API**: HPA (Horizontal Pod Autoscaling) based on CPU.
  - **Engine**: Sharded by `MarketID`. Markets 1-100 on Pod A, 101-200 on Pod B.
- **Database**: PostgreSQL (RDS) with Read Replicas. Writes go to Master, analytics queries go to Replicas.
- **Cache**: AWS ElastiCache (Redis Cluster or Valkey) for high availability.
- **Why?**: Eliminates single points of failure and allows independent scaling of stateless (API) and stateful (Engine) components.

## Tech Stack

### Backend

- **Core**: TypeScript (Bun), Go
- **Framework**: Hono (High performance web framework)
- **Communication**: Redis (PubSub/Queue), Kafka
- **Database**: PostgreSQL, Prisma ORM

### Frontend

- **Framework**: React.js
- **State Management**: Zustand / TanStack Query
- **Realtime**: Socket.io Client

_This project isn't just a clone; it's a deep exploration of how to build reliable, systems using modern tools._

## Contributing & Audits

Contributions are welcome and appreciated.

The system includes an [`AUDIT.md`](./AUDIT.md) outlining known limitations, assumptions, and potential improvements.  
If you’re interested in improving correctness, performance, or fault tolerance, that document is a good place to start.

All contributions are reviewed with a focus on system safety and correctness.
