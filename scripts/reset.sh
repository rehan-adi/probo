#!/bin/bash

echo "Stopping all running processes..."

pkill -f "make run"
pkill -f "bot_trading.ts"

echo "Freeing up ports..."
# Kill any processes using the API (3000), Frontend (5173), and Stream (1000) ports
lsof -ti :3000 | xargs kill -9 2>/dev/null || true
lsof -ti :5173 | xargs kill -9 2>/dev/null || true
lsof -ti :1000 | xargs kill -9 2>/dev/null || true

echo "Killing specific service binaries..."
pkill -9 -f "matching-engine" || true
pkill -9 -f "src/server.ts" || true
pkill -9 -f "processor-service" || true
pkill -9 -f "stream-service" || true
pm2 stop all 2>/dev/null || true

echo "Clearing Redis..."
cd services/api-service && bun -e "import { Redis } from 'ioredis'; const r = new Redis('redis://localhost:6380'); r.flushall().then(() => r.disconnect());" && cd ../..

echo "Resetting PostgreSQL database..."
cd packages/database && bunx prisma db push --force-reset && cd ../..

echo "Environment completely reset."
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
