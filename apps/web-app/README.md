# Web App

The React-based frontend application for Probo, built using [Vite](https://vitejs.dev/). It allows users to browse markets, trade on opinions, and see real-time updates of order books and trade executions.

## Setup

1. Make sure you have installed all dependencies from the repository root:
   ```bash
   bun install
   ```
2. Set up your environment variables:

   ```bash
   cp .env.example .env
   ```

   _Ensure `VITE_API_BASE_URL` and `VITE_STREAM_SERVICE_URL` point to your local API and Stream services._

3. Start the development server:
   ```bash
   bun run dev
   ```

## Tech Stack

- **Framework:** React 19
- **Build Tool:** Vite
- **Styling:** Tailwind CSS + Radix UI
- **State Management:** Zustand & TanStack React Query
- **Real-Time:** Socket.io-client
