import app from '@/app';
import { ENV } from '@/config/env';

Bun.serve({
	fetch: app.fetch,
	port: ENV.PORT,
});

console.log(`🚀 API service running → http://localhost:${ENV.PORT}`);
