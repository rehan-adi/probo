/*
  Warnings:

  - You are about to drop the column `description` on the `Market` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Market" DROP COLUMN "description",
ADD COLUMN     "eos" TEXT,
ADD COLUMN     "rules" TEXT;
