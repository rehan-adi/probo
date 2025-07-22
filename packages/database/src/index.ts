import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';

const queryClient = postgres(Bun.env.DATABASE_URL!, {
	max: 20,
	idle_timeout: 30,
	connect_timeout: 5,
	prepare: true,
});

export const db = drizzle(queryClient);
