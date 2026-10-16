/*
  Warnings:

  - You are about to drop the column `count` on the `apiKey` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "User" ADD COLUMN     "count" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "apiKey" DROP COLUMN "count";
