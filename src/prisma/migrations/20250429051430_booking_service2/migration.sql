/*
  Warnings:

  - You are about to drop the column `actualEndTime` on the `Booking` table. All the data in the column will be lost.
  - You are about to drop the column `discountAmount` on the `Booking` table. All the data in the column will be lost.
  - You are about to drop the column `dropAddress` on the `Booking` table. All the data in the column will be lost.
  - You are about to drop the column `estimatedEndTime` on the `Booking` table. All the data in the column will be lost.
  - You are about to drop the column `finalAmount` on the `Booking` table. All the data in the column will be lost.
  - You are about to drop the column `pickupAddress` on the `Booking` table. All the data in the column will be lost.
  - You are about to drop the column `pickupDropRequired` on the `Booking` table. All the data in the column will be lost.
  - You are about to drop the column `pickupFee` on the `Booking` table. All the data in the column will be lost.
  - You are about to drop the column `refundAmount` on the `Booking` table. All the data in the column will be lost.
  - You are about to drop the column `refundReason` on the `Booking` table. All the data in the column will be lost.
  - You are about to drop the column `refundedAt` on the `Booking` table. All the data in the column will be lost.
  - You are about to drop the column `scheduledDateTime` on the `Booking` table. All the data in the column will be lost.
  - You are about to drop the column `specialInstructions` on the `Booking` table. All the data in the column will be lost.
  - You are about to drop the column `taxAmount` on the `Booking` table. All the data in the column will be lost.
  - You are about to drop the column `discountAmount` on the `BookingService` table. All the data in the column will be lost.
  - You are about to drop the column `packageOfferingId` on the `BookingService` table. All the data in the column will be lost.
  - You are about to drop the column `quantity` on the `BookingService` table. All the data in the column will be lost.
  - You are about to drop the column `serviceEndTime` on the `BookingService` table. All the data in the column will be lost.
  - You are about to drop the column `serviceStartTime` on the `BookingService` table. All the data in the column will be lost.
  - You are about to drop the column `staffAssigned` on the `BookingService` table. All the data in the column will be lost.
  - You are about to drop the column `unitPrice` on the `BookingService` table. All the data in the column will be lost.
  - You are about to drop the column `insuranceId` on the `Vehicle` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "PaymentMode" AS ENUM ('CASH', 'INSURANCE');

-- DropIndex
DROP INDEX "BookingService_packageOfferingId_idx";

-- DropIndex
DROP INDEX "BookingService_staffAssigned_idx";

-- AlterTable
ALTER TABLE "Booking" DROP COLUMN "actualEndTime",
DROP COLUMN "discountAmount",
DROP COLUMN "dropAddress",
DROP COLUMN "estimatedEndTime",
DROP COLUMN "finalAmount",
DROP COLUMN "pickupAddress",
DROP COLUMN "pickupDropRequired",
DROP COLUMN "pickupFee",
DROP COLUMN "refundAmount",
DROP COLUMN "refundReason",
DROP COLUMN "refundedAt",
DROP COLUMN "scheduledDateTime",
DROP COLUMN "specialInstructions",
DROP COLUMN "taxAmount",
ADD COLUMN     "paymentMode" "PaymentMode" NOT NULL DEFAULT 'CASH',
ADD COLUMN     "vehicleImages" TEXT[];

-- AlterTable
ALTER TABLE "BookingService" DROP COLUMN "discountAmount",
DROP COLUMN "packageOfferingId",
DROP COLUMN "quantity",
DROP COLUMN "serviceEndTime",
DROP COLUMN "serviceStartTime",
DROP COLUMN "staffAssigned",
DROP COLUMN "unitPrice";

-- AlterTable
ALTER TABLE "Vehicle" DROP COLUMN "insuranceId";
