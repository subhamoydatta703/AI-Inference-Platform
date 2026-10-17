/*
  Warnings:

  - A unique constraint covering the columns `[hashedKey]` on the table `apiKey` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "apiKey_hashedKey_key" ON "apiKey"("hashedKey");

-- CreateIndex
CREATE INDEX "apiKey_userId_idx" ON "apiKey"("userId");
