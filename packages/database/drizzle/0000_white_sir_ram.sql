CREATE TYPE "public"."FeeType" AS ENUM('TRADE_FEE', 'WITHDRAWAL_FEE', 'REFERRAL_BONUS');--> statement-breakpoint
CREATE TYPE "public"."kyc_status" AS ENUM('NOT_VERIFIED', 'PENDING', 'VERIFIED', 'REJECTED');--> statement-breakpoint
CREATE TYPE "public"."order_status" AS ENUM('PENDING', 'PARTIAL', 'COMPLETED');--> statement-breakpoint
CREATE TYPE "public"."order_type" AS ENUM('BUY', 'SELL');--> statement-breakpoint
CREATE TYPE "public"."payment_status" AS ENUM('NOT_VERIFIED', 'PENDING', 'VERIFIED', 'REJECTED');--> statement-breakpoint
CREATE TYPE "public"."payment_type" AS ENUM('BANK', 'UPI');--> statement-breakpoint
CREATE TYPE "public"."stock_type" AS ENUM('YES', 'NO');--> statement-breakpoint
CREATE TYPE "public"."transaction_status" AS ENUM('PENDING', 'SUCCESS', 'FAILED');--> statement-breakpoint
CREATE TYPE "public"."transaction_type" AS ENUM('DEPOSIT', 'WITHDRAWAL', 'BET', 'WINNINGS', 'REFUND', 'REFERRAL_REWARD');--> statement-breakpoint
CREATE TYPE "public"."role" AS ENUM('USER', 'ADMIN');--> statement-breakpoint
CREATE TABLE "categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"category_name" varchar(100) NOT NULL,
	"icon" text
);
--> statement-breakpoint
CREATE TABLE "company_earnings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"market_id" uuid,
	"trade_id" uuid,
	"amount" real NOT NULL,
	"type" "FeeType" NOT NULL,
	"remarks" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "inr_balances" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"balance" numeric(14, 2) DEFAULT '0.00' NOT NULL,
	"locked" numeric(14, 2) DEFAULT '0.00' NOT NULL,
	CONSTRAINT "inr_balances_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "kyc" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"pan_name" varchar(50) NOT NULL,
	"pan_number" varchar(10) NOT NULL,
	"dob" varchar(10) NOT NULL,
	"status" "kyc_status" DEFAULT 'NOT_VERIFIED' NOT NULL,
	"remarks" text,
	"submitted_at" timestamp with time zone DEFAULT now() NOT NULL,
	"reviewed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "markets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" varchar(255) NOT NULL,
	"symbol" varchar(50) NOT NULL,
	"description" text,
	"start_time" timestamp with time zone NOT NULL,
	"end_time" timestamp with time zone NOT NULL,
	"result" varchar(10),
	"thumbnail" varchar(2048),
	"category_id" uuid NOT NULL,
	"source_of_truth" text DEFAULT '' NOT NULL,
	"number_of_traders" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "markets_symbol_unique" UNIQUE("symbol")
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"stock_symbol" varchar(50) NOT NULL,
	"stock_type" "stock_type" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"user_id" uuid NOT NULL,
	"quantity" integer NOT NULL,
	"price" real NOT NULL,
	"order_type" "order_type" NOT NULL,
	"total_price" real NOT NULL,
	"status" "order_status" DEFAULT 'PENDING' NOT NULL,
	"traded_quantity" integer DEFAULT 0 NOT NULL,
	"market_id" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payment_methods" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"type" "payment_type" NOT NULL,
	"upiNumber" varchar(50) NOT NULL,
	"accountNumber" varchar(20),
	"ifscCode" varchar(11),
	"status" "payment_status" DEFAULT 'NOT_VERIFIED' NOT NULL,
	"remarks" text,
	"submitted_at" timestamp with time zone DEFAULT now() NOT NULL,
	"reviewed_at" timestamp with time zone,
	CONSTRAINT "payment_methods_upiNumber_unique" UNIQUE("upiNumber")
);
--> statement-breakpoint
CREATE TABLE "referral_rewards" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"referrer_id" uuid NOT NULL,
	"reward_to_ref" real DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "stock_balances" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"market_id" uuid NOT NULL,
	"yes_quantity" integer DEFAULT 0 NOT NULL,
	"yes_locked" integer DEFAULT 0 NOT NULL,
	"no_quantity" integer DEFAULT 0 NOT NULL,
	"no_locked" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "transaction_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"market_id" uuid,
	"transaction_type" "transaction_type" NOT NULL,
	"amount" numeric(14, 2) NOT NULL,
	"transaction_status" "transaction_status" DEFAULT 'PENDING' NOT NULL,
	"remarks" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"phone" varchar(10) NOT NULL,
	"email" varchar(100),
	"is_first_login" boolean DEFAULT true NOT NULL,
	"role" "role" DEFAULT 'USER' NOT NULL,
	"kyc_verification_status" "kyc_status" DEFAULT 'NOT_VERIFIED' NOT NULL,
	"payment_verification_status" "payment_status" DEFAULT 'NOT_VERIFIED' NOT NULL,
	"referral_code" varchar(6) NOT NULL,
	"referrer_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email"),
	CONSTRAINT "users_referral_code_unique" UNIQUE("referral_code")
);
--> statement-breakpoint
ALTER TABLE "company_earnings" ADD CONSTRAINT "company_earnings_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inr_balances" ADD CONSTRAINT "inr_balances_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "kyc" ADD CONSTRAINT "kyc_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "markets" ADD CONSTRAINT "markets_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_market_id_markets_id_fk" FOREIGN KEY ("market_id") REFERENCES "public"."markets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_methods" ADD CONSTRAINT "payment_methods_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "referral_rewards" ADD CONSTRAINT "referral_rewards_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "referral_rewards" ADD CONSTRAINT "referral_rewards_referrer_id_users_id_fk" FOREIGN KEY ("referrer_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_balances" ADD CONSTRAINT "stock_balances_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_balances" ADD CONSTRAINT "stock_balances_market_id_markets_id_fk" FOREIGN KEY ("market_id") REFERENCES "public"."markets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transaction_history" ADD CONSTRAINT "transaction_history_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transaction_history" ADD CONSTRAINT "transaction_history_market_id_markets_id_fk" FOREIGN KEY ("market_id") REFERENCES "public"."markets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "pan_number_index" ON "kyc" USING btree ("pan_number");--> statement-breakpoint
CREATE UNIQUE INDEX "phone_idx" ON "users" USING btree ("phone");