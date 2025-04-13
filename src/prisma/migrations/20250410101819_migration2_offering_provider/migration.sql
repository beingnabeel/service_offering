/*
  Warnings:

  - You are about to drop the column `addressId` on the `ServiceCenter` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[serviceCenterId]` on the table `Address` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `serviceCenterId` to the `Address` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "ServiceCenter" DROP CONSTRAINT "ServiceCenter_addressId_fkey";

-- DropIndex
DROP INDEX "ServiceCenter_addressId_key";

-- AlterTable
ALTER TABLE "Address" ADD COLUMN     "serviceCenterId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "ServiceCenter" DROP COLUMN "addressId";

-- CreateIndex
CREATE UNIQUE INDEX "Address_serviceCenterId_key" ON "Address"("serviceCenterId");

-- AddForeignKey
ALTER TABLE "Address" ADD CONSTRAINT "Address_serviceCenterId_fkey" FOREIGN KEY ("serviceCenterId") REFERENCES "ServiceCenter"("id") ON DELETE CASCADE ON UPDATE CASCADE;
