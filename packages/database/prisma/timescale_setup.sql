-- Create Extension
CREATE EXTENSION IF NOT EXISTS timescaledb CASCADE;

-- Setup TimescaleDB Hypertable
SELECT create_hypertable('trades', by_range('created_at'), migrate_data => true, if_not_exists => true);

-- Enable Compression
ALTER TABLE trades SET (
    timescaledb.compress,
    timescaledb.compress_segmentby = 'market_id'
);
SELECT add_compression_policy('trades', INTERVAL '7 days', if_not_exists => true);

-- Create Continuous Aggregate (1m Candles)
CREATE MATERIALIZED VIEW IF NOT EXISTS trade_candles_1m
WITH (timescaledb.continuous) AS
SELECT
    time_bucket('1 minute', created_at) AS bucket,
    market_id AS "marketId",
    first(price, created_at) AS open,
    max(price) AS high,
    min(price) AS low,
    last(price, created_at) AS close,
    sum(quantity) AS volume
FROM trades
GROUP BY bucket, market_id WITH NO DATA;

-- Add Refresh Policy for Continuous Aggregate
SELECT add_continuous_aggregate_policy('trade_candles_1m',
    start_offset => INTERVAL '3 days',
    end_offset => INTERVAL '1 minute',
    schedule_interval => INTERVAL '1 minute',
    if_not_exists => true);
