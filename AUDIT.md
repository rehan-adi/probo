# Internal Engineering Audit: Probo

> [NOTE]
> This document is for internal developer use and contains a deep-dive into the current codebase state, identified "gems," and architectural gaps.

## Technical Highlights

- **Price-Time Priority Engine**: The matching logic (`handleBuyOrder` / `handleSellOrder`) correctly implements price-time priority, ensuring fair execution.
- **Dynamic Probability Pricing**: The system calculates the probability of an outcome based on the aggregated orderbook depth and updates the "Yes/No" prices dynamically. This is a sophisticated feature for a prediction market.
- **Self-Trade Prevention**: The matching engine explicitly skips trades where the buyer and seller are the same user, preventing wash trading and artificial volume.
- **Granular Locking Strategy**: Uses three levels of locking (Engine-level for Users/Markets, and Market-level for Orderbooks) to maximize concurrency and minimize contention.
- **Atomic In-Memory Updates**: Balance checks and stock transfers happen atomically within the Go engine, ensuring no "double-spending" before persistence even begins.
- **WS Room Pattern**: The Stream Service uses a `SUBSCRIBE/UNSUBSCRIBE` pattern with Socket.io rooms, ensuring users only receive data for markets they are actively viewing, significantly saving bandwidth.

---

## Critical Fixes & Missing Robustness

- **State Recovery (Priority 0)**: Currently, if the Go engine restarts, all in-memory orderbooks and balances are lost.
  - _Fix_: Need to replay events from Kafka on startup or implement periodic Redis snapshots.
- **Persistence Lag Awareness**: The API reads from PostgreSQL while the Engine maintains state in-memory. In high-traffic scenarios, the DB might lag behind.
  - _Fix_: API should prefer reading current balances from the Engine (via Redis) for active traders.
- **Lack of Idempotency Keys**: If a network flip occurs during order placement, the user might double-order.
  - _Fix_: Implement `X-Idempotency-Key` at the API level and verify in the Engine.
- **Zero Automated Testing**: The matching logic is complex.
  - _Fix_: Need unit tests for `engine/handlers.go` and integration tests for the `API -> Redis -> Engine` flow.

---

## Incomplete / Future Roadmap

- **Market Settlement Service**: The system currently lacks a service to settle markets (e.g., "India Won") and distribute locked funds to winners.
- **L2 Orderbook Snapshots**: Currently, the whole orderbook is sent via Socket.io. For high-volume markets, we should send incremental diffs.
- **Admin Dashboard**: Visual tool for managing market liquidity, user verification (KYC), and platform-wide monitoring.
- **Observability Stack**: Prometheus/Grafana for monitoring engine throughput and Kafka lag.
