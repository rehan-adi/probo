#!/bin/bash

echo "Stopping all running processes for probstreet........"

pkill -f "make run"
pkill -f "bot_trading.ts"

echo "Freeing up ports for probstreet......."

lsof -ti :3000 | xargs kill -9 2>/dev/null || true
lsof -ti :5173 | xargs kill -9 2>/dev/null || true
lsof -ti :1000 | xargs kill -9 2>/dev/null || true

echo "Killing specific service binaries..."

pkill -9 -f "matching-engine" || true
pkill -9 -f "exe/cmd" || true
pkill -9 -f "go-build.*/cmd" || true
pkill -9 -f "src/server.ts" || true
pkill -9 -f "processor-service" || true
pkill -9 -f "stream-service" || true
pm2 stop all 2>/dev/null || true

echo "Clearing Redis........"
cd services/api-service && bun -e "import { Redis } from 'ioredis'; const r = new Redis('redis://localhost:6380'); r.flushall().then(() => r.disconnect());" && cd ../..

echo "Resetting PostgreSQL database........"
cd packages/database && bunx prisma db push --force-reset && cd ../..

echo "Configuring TimescaleDB (Hypertables & Continuous Aggregates)........"
psql "postgres://probstreet:probstreetadmin@localhost:5432/primary-database" -f packages/database/prisma/timescale_setup.sql

echo "Environment completely reset with TimescaleDB configured."
echo ""
echo "--- STARTUP WORKFLOW INSTRUCTIONS ---"
echo "To start the application, open 4 separate terminals and run these commands IN ORDER:"
echo ""
echo "Terminal 1: Start Matching Engine"
echo "cd services/matching-engine && go run cmd/main.go"
echo ""
echo "Terminal 2: Start API Service"
echo "cd services/api-service && bun run dev"
echo ""
echo "Terminal 3: Start Processor Service"
echo "cd services/processor-service && bun run dev"
echo ""
echo "Terminal 4: Start Web App"
echo "cd apps/web-app && bun run dev"
echo ""
echo "Once all 4 are running without errors, you can run the bot seeder:"
echo "cd services/api-service && bun run src/scripts/bot_trading.ts"
echo "---------------------------------------"
