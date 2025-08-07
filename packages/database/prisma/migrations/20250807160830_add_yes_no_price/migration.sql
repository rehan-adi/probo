/*
  Warnings:

  - Added the required column `NoPrice` to the `Market` table without a default value. This is not possible if the table is not empty.
  - Added the required column `yesPrice` to the `Market` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Market" ADD COLUMN     "NoPrice" DECIMAL(14,2) NOT NULL,
ADD COLUMN     "yesPrice" DECIMAL(14,2) NOT NULL;
