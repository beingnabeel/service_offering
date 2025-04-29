/*
  Warnings:

  - You are about to drop the column `discount_absolute` on the `service_center_offering` table. All the data in the column will be lost.
  - You are about to drop the column `has_pickup_drop_service` on the `service_center_offering` table. All the data in the column will be lost.
  - You are about to drop the column `pickup_drop_fee` on the `service_center_offering` table. All the data in the column will be lost.
  - You are about to drop the `additional_feature` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `seasonal_discount` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `service_offering_tax` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `service_package` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `service_package_item` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `service_package_offering` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `vehicle_brand_service_offering` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "additional_feature" DROP CONSTRAINT "additional_feature_offering_id_fkey";

-- DropForeignKey
ALTER TABLE "seasonal_discount" DROP CONSTRAINT "seasonal_discount_offering_id_fkey";

-- DropForeignKey
ALTER TABLE "service_offering_tax" DROP CONSTRAINT "service_offering_tax_offering_id_fkey";

-- DropForeignKey
ALTER TABLE "service_package_item" DROP CONSTRAINT "service_package_item_package_id_fkey";

-- DropForeignKey
ALTER TABLE "service_package_item" DROP CONSTRAINT "service_package_item_service_type_id_fkey";

-- DropForeignKey
ALTER TABLE "service_package_offering" DROP CONSTRAINT "service_package_offering_offering_id_fkey";

-- DropForeignKey
ALTER TABLE "service_package_offering" DROP CONSTRAINT "service_package_offering_package_id_fkey";

-- DropForeignKey
ALTER TABLE "vehicle_brand_service_offering" DROP CONSTRAINT "vehicle_brand_service_offering_brand_id_fkey";

-- DropForeignKey
ALTER TABLE "vehicle_brand_service_offering" DROP CONSTRAINT "vehicle_brand_service_offering_model_id_fkey";

-- DropForeignKey
ALTER TABLE "vehicle_brand_service_offering" DROP CONSTRAINT "vehicle_brand_service_offering_offering_id_fkey";

-- DropIndex
DROP INDEX "service_center_offering_has_pickup_drop_service_status_idx";

-- AlterTable
ALTER TABLE "service_center_offering" DROP COLUMN "discount_absolute",
DROP COLUMN "has_pickup_drop_service",
DROP COLUMN "pickup_drop_fee";

-- DropTable
DROP TABLE "additional_feature";

-- DropTable
DROP TABLE "seasonal_discount";

-- DropTable
DROP TABLE "service_offering_tax";

-- DropTable
DROP TABLE "service_package";

-- DropTable
DROP TABLE "service_package_item";

-- DropTable
DROP TABLE "service_package_offering";

-- DropTable
DROP TABLE "vehicle_brand_service_offering";
