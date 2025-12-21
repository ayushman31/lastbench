/*
  Warnings:

  - You are about to drop the column `access_token` on the `Account` table. All the data in the column will be lost.
  - You are about to drop the column `id_token` on the `Account` table. All the data in the column will be lost.
  - You are about to drop the column `provider` on the `Account` table. All the data in the column will be lost.
  - You are about to drop the column `refresh_token` on the `Account` table. All the data in the column will be lost.
  - You are about to drop the column `expires` on the `Session` table. All the data in the column will be lost.
  - You are about to drop the column `sessionToken` on the `Session` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[providerId,providerAccountId]` on the table `Account` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[token]` on the table `Session` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `providerId` to the `Account` table without a default value. This is not possible if the table is not empty.
  - Added the required column `expiresAt` to the `Session` table without a default value. This is not possible if the table is not empty.
  - Added the required column `token` to the `Session` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "Account_provider_providerAccountId_key";

-- DropIndex
DROP INDEX "Session_sessionToken_key";

-- AlterTable
ALTER TABLE "Account" DROP COLUMN "access_token",
DROP COLUMN "id_token",
DROP COLUMN "provider",
DROP COLUMN "refresh_token",
ADD COLUMN     "accessToken" TEXT,
ADD COLUMN     "idToken" TEXT,
ADD COLUMN     "providerId" TEXT NOT NULL,
ADD COLUMN     "refreshToken" TEXT,
ALTER COLUMN "type" DROP NOT NULL,
ALTER COLUMN "providerAccountId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Session" DROP COLUMN "expires",
DROP COLUMN "sessionToken",
ADD COLUMN     "expiresAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "token" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Account_providerId_providerAccountId_key" ON "Account"("providerId", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_token_key" ON "Session"("token");
