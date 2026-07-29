/*
  Warnings:

  - You are about to drop the column `tradedQuantity` on the `Order` table. All the data in the column will be lost.
  - Added the required column `updatedAt` to the `Order` table without a default value. This is not possible if the table is not empty.

*/
-- CreateExtension
CREATE EXTENSION IF NOT EXISTS timescaledb CASCADE;

-- CreateEnum
CREATE TYPE "public"."MatchType" AS ENUM ('STANDARD', 'MINT', 'MERGE');

-- CreateEnum
CREATE TYPE "public"."SystemAccount" AS ENUM ('PLATFORM_FEES', 'EXCHANGE_ESCROW', 'REWARD_POOL');

-- AlterTable
ALTER TABLE "public"."Market" ADD COLUMN     "volume" DECIMAL(14,2) NOT NULL DEFAULT 0.00;

-- AlterTable
ALTER TABLE "public"."Order" DROP COLUMN "tradedQuantity",
ADD COLUMN     "filledQuantity" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "public"."User" ADD COLUMN     "name" TEXT NOT NULL DEFAULT 'Prober',
ADD COLUMN     "profilePic" TEXT;

-- CreateTable
CREATE TABLE "public"."LedgerEntry" (
    "id" TEXT NOT NULL,
    "fromAccount" TEXT NOT NULL,
    "toAccount" TEXT NOT NULL,
    "amount" DECIMAL(14,2) NOT NULL,
    "type" "public"."TransactionType" NOT NULL,
    "referenceId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LedgerEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Trade" (
    "id" TEXT NOT NULL,
    "marketId" TEXT NOT NULL,
    "makerOrderId" TEXT NOT NULL,
    "takerOrderId" TEXT NOT NULL,
    "makerId" TEXT NOT NULL,
    "takerId" TEXT NOT NULL,
    "stockType" "public"."StockType" NOT NULL,
    "takerAction" "public"."OrderType" NOT NULL,
    "price" DECIMAL(14,2) NOT NULL,
    "quantity" INTEGER NOT NULL,
    "matchType" "public"."MatchType" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Trade_pkey" PRIMARY KEY ("id","createdAt")
);

-- CreateTable
CREATE TABLE "public"."Watchlist" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "marketId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Watchlist_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Trade_marketId_createdAt_idx" ON "public"."Trade"("marketId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "Trade_makerId_createdAt_idx" ON "public"."Trade"("makerId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "Trade_takerId_createdAt_idx" ON "public"."Trade"("takerId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "Trade_makerOrderId_idx" ON "public"."Trade"("makerOrderId");

-- CreateIndex
CREATE INDEX "Trade_takerOrderId_idx" ON "public"."Trade"("takerOrderId");

-- CreateIndex
CREATE UNIQUE INDEX "Watchlist_userId_marketId_key" ON "public"."Watchlist"("userId", "marketId");

-- AddForeignKey
ALTER TABLE "public"."Trade" ADD CONSTRAINT "Trade_marketId_fkey" FOREIGN KEY ("marketId") REFERENCES "public"."Market"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Trade" ADD CONSTRAINT "Trade_makerOrderId_fkey" FOREIGN KEY ("makerOrderId") REFERENCES "public"."Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Trade" ADD CONSTRAINT "Trade_takerOrderId_fkey" FOREIGN KEY ("takerOrderId") REFERENCES "public"."Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Trade" ADD CONSTRAINT "Trade_makerId_fkey" FOREIGN KEY ("makerId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Trade" ADD CONSTRAINT "Trade_takerId_fkey" FOREIGN KEY ("takerId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Watchlist" ADD CONSTRAINT "Watchlist_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Watchlist" ADD CONSTRAINT "Watchlist_marketId_fkey" FOREIGN KEY ("marketId") REFERENCES "public"."Market"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Setup TimescaleDB Hypertable
SELECT create_hypertable('"public"."Trade"', by_range('createdAt'));

-- Enable Compression
ALTER TABLE "public"."Trade" SET (
    timescaledb.compress,
    timescaledb.compress_segmentby = '"marketId"'
);
SELECT add_compression_policy('"public"."Trade"', INTERVAL '7 days');

-- Create Continuous Aggregate (1m Candles)
CREATE MATERIALIZED VIEW "public"."trade_candles_1m"
WITH (timescaledb.continuous) AS
SELECT
    time_bucket('1 minute', "createdAt") AS bucket,
    "marketId",
    first(price, "createdAt") AS open,
    max(price) AS high,
    min(price) AS low,
    last(price, "createdAt") AS close,
    sum(quantity) AS volume
FROM "public"."Trade"
GROUP BY bucket, "marketId";

-- Add Refresh Policy for Continuous Aggregate
SELECT add_continuous_aggregate_policy('trade_candles_1m',
    start_offset => INTERVAL '3 days',
    end_offset => INTERVAL '1 minute',
    schedule_interval => INTERVAL '1 minute');
