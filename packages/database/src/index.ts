import postgres from 'postgres';
import * as schema from '@/db/schema';
import { drizzle } from 'drizzle-orm/postgres-js';

const queryClient = postgres(Bun.env.DATABASE_URL!, {
	max: 20,
	idle_timeout: 30,
	connect_timeout: 5,
	prepare: true,
});

export const db = drizzle(queryClient, { schema });

export const {
	// models
	users,
	kycs,
	paymentMethods,
	orders,
	markets,
	referralRewards,
	companyEarnings,
	categories,
	inrBalances,
	stockBalances,
	transactionHistory,

	// enums
	feeTypeEnum,
	kycStatusEnum,
	orderStatusEnum,
	orderTypeEnum,
	paymentStatusEnum,
	paymentTypeEnum,
	stockTypeEnum,
	txnStatusEnum,
	txnTypeEnum,
	userRoleEnum,
} = schema;
