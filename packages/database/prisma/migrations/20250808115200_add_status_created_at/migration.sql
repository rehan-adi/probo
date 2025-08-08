-- CreateEnum
CREATE TYPE "MarketStatus" AS ENUM ('OPEN', 'CLOSED');

-- AlterTable
ALTER TABLE "Market" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "status" "MarketStatus" NOT NULL DEFAULT 'OPEN';
