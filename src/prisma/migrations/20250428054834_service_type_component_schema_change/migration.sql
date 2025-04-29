/*
  Warnings:

  - You are about to drop the column `additional_price` on the `service_type_component` table. All the data in the column will be lost.
  - You are about to drop the column `is_default` on the `service_type_component` table. All the data in the column will be lost.
  - You are about to drop the column `is_required` on the `service_type_component` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "service_type_component" DROP COLUMN "additional_price",
DROP COLUMN "is_default",
DROP COLUMN "is_required";
