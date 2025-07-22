import {
	integer,
	numeric,
	pgEnum,
	boolean,
	pgTable,
	real,
	text,
	timestamp,
	uniqueIndex,
	uuid,
	varchar,
} from 'drizzle-orm/pg-core';

// Enums
export const userRoleEnum = pgEnum('role', ['USER', 'ADMIN']);

export const kycStatusEnum = pgEnum('kyc_status', [
	'NOT_VERIFIED',
	'PENDING',
	'VERIFIED',
	'REJECTED',
]);

export const paymentStatusEnum = pgEnum('payment_status', [
	'NOT_VERIFIED',
	'PENDING',
	'VERIFIED',
	'REJECTED',
]);
export const paymentTypeEnum = pgEnum('payment_type', ['BANK', 'UPI']);

export const orderTypeEnum = pgEnum('order_type', ['BUY', 'SELL']);
export const orderStatusEnum = pgEnum('order_status', ['PENDING', 'PARTIAL', 'COMPLETED']);
export const stockTypeEnum = pgEnum('stock_type', ['YES', 'NO']);

export const feeTypeEnum = pgEnum('FeeType', ['TRADE_FEE', 'WITHDRAWAL_FEE', 'REFERRAL_BONUS']);

export const txnTypeEnum = pgEnum('transaction_type', [
	'DEPOSIT',
	'WITHDRAWAL',
	'BET',
	'WINNINGS',
	'REFUND',
	'REFERRAL_REWARD',
]);

export const txnStatusEnum = pgEnum('transaction_status', ['PENDING', 'SUCCESS', 'FAILED']);

// tables
export const users = pgTable(
	'users',
	{
		id: uuid('id').defaultRandom().primaryKey(),
		phone: varchar({ length: 10 }).notNull(),
		email: varchar({ length: 100 }).unique(),

		isFirstLogin: boolean('is_first_login').default(true).notNull(),

		role: userRoleEnum('role').default('USER').notNull(),

		kycVerificationStatus: kycStatusEnum('kyc_verification_status')
			.default('NOT_VERIFIED')
			.notNull(),
		paymentVerificationStatus: paymentStatusEnum('payment_verification_status')
			.default('NOT_VERIFIED')
			.notNull(),

		referralCode: varchar('referral_code', { length: 6 }).unique().notNull(),
		referrerId: uuid('referrer_id'),

		createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
		updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
	},
	(table) => [uniqueIndex('phone_idx').on(table.phone)],
);

export const kycs = pgTable(
	'kyc',
	{
		id: uuid('id').defaultRandom().primaryKey(),
		userId: uuid('user_id')
			.notNull()
			.references(() => users.id),

		panName: varchar('pan_name', { length: 50 }).notNull(),
		panNumber: varchar('pan_number', { length: 10 }).notNull(),
		dob: varchar({ length: 10 }).notNull(),

		status: kycStatusEnum('status').default('NOT_VERIFIED').notNull(),
		remarks: text('remarks'),

		submittedAt: timestamp('submitted_at', { withTimezone: true }).defaultNow().notNull(),
		reviewedAt: timestamp('reviewed_at', { withTimezone: true }),

		createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
		updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
	},
	(table) => [uniqueIndex('pan_number_index').on(table.panNumber)],
);

export const paymentMethods = pgTable('payment_methods', {
	id: uuid('id').defaultRandom().primaryKey(),
	userId: uuid('user_id')
		.notNull()
		.references(() => users.id),

	type: paymentTypeEnum('type').notNull(),

	upiNumber: varchar({ length: 50 }).notNull().unique(),
	accountNumber: varchar({ length: 20 }),
	ifscCode: varchar({ length: 11 }),

	status: paymentStatusEnum('status').default('NOT_VERIFIED').notNull(),
	remarks: text('remarks'),

	submittedAt: timestamp('submitted_at', { withTimezone: true }).defaultNow().notNull(),
	reviewedAt: timestamp('reviewed_at', { withTimezone: true }),
});

export const referralRewards = pgTable('referral_rewards', {
	id: uuid('id').defaultRandom().primaryKey(),
	userId: uuid('user_id')
		.notNull()
		.references(() => users.id),
	referrerId: uuid('referrer_id')
		.notNull()
		.references(() => users.id),
	rewardToRef: real('reward_to_ref').default(0).notNull(),
	createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const inrBalances = pgTable('inr_balances', {
	id: uuid('id').defaultRandom().primaryKey(),
	userId: uuid('user_id')
		.unique()
		.notNull()
		.references(() => users.id),
	balance: numeric('balance', { precision: 14, scale: 2 }).default('0.00').notNull(),
	locked: numeric('locked', { precision: 14, scale: 2 }).default('0.00').notNull(),
});

export const stockBalances = pgTable('stock_balances', {
	id: uuid('id').defaultRandom().primaryKey(),
	userId: uuid('user_id')
		.notNull()
		.references(() => users.id),
	marketId: uuid('market_id')
		.notNull()
		.references(() => markets.id),
	yesQuantity: integer('yes_quantity').default(0).notNull(),
	yesLocked: integer('yes_locked').default(0).notNull(),
	noQuantity: integer('no_quantity').default(0).notNull(),
	noLocked: integer('no_locked').default(0).notNull(),
});

export const transactionHistory = pgTable('transaction_history', {
	id: uuid('id').defaultRandom().primaryKey(),
	userId: uuid('user_id')
		.notNull()
		.references(() => users.id),
	marketId: uuid('market_id').references(() => markets.id),

	type: txnTypeEnum('transaction_type').notNull(),

	amount: numeric('amount', { precision: 14, scale: 2 }).notNull(),
	status: txnStatusEnum('transaction_status').default('PENDING').notNull(),
	remarks: text('remarks'),
	createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const orders = pgTable('orders', {
	id: uuid('id').defaultRandom().primaryKey(),
	stockSymbol: varchar('stock_symbol', { length: 50 }).notNull(),
	stockType: stockTypeEnum('stock_type').notNull(),
	createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
	userId: uuid('user_id')
		.notNull()
		.references(() => users.id),
	quantity: integer('quantity').notNull(),
	price: real('price').notNull(),
	orderType: orderTypeEnum('order_type').notNull(),
	totalPrice: real('total_price').notNull(),
	status: orderStatusEnum('status').default('PENDING').notNull(),
	tradedQuantity: integer('traded_quantity').default(0).notNull(),
	marketId: uuid('market_id')
		.notNull()
		.references(() => markets.id),
});

export const markets = pgTable('markets', {
	id: uuid('id').defaultRandom().primaryKey(),
	title: varchar({ length: 255 }).notNull(),
	symbol: varchar({ length: 50 }).unique().notNull(),
	description: text('description'),
	startTime: timestamp('start_time', { withTimezone: true }).notNull(),
	endTime: timestamp('end_time', { withTimezone: true }).notNull(),
	result: varchar('result', { length: 10 }),
	thumbnail: varchar('thumbnail', { length: 2048 }),
	categoryId: uuid('category_id')
		.notNull()
		.references(() => categories.id),
	sourceOfTruth: text('source_of_truth').default('').notNull(),
	numberOfTraders: integer('number_of_traders').default(0).notNull(),
});

export const categories = pgTable('categories', {
	id: uuid('id').defaultRandom().primaryKey(),
	categoryName: varchar('category_name', { length: 100 }).notNull(),
	icon: text('icon'),
});

export const companyEarnings = pgTable('company_earnings', {
	id: uuid('id').defaultRandom().primaryKey(),
	userId: uuid('user_id')
		.notNull()
		.references(() => users.id),
	marketId: uuid('market_id'),
	tradeId: uuid('trade_id'),
	amount: real('amount').notNull(),
	type: feeTypeEnum('type').notNull(),
	remarks: text('remarks'),
	createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});
