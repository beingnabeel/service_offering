-- DropForeignKey
ALTER TABLE "ServiceCenter" DROP CONSTRAINT "ServiceCenter_brandId_fkey";

-- AddForeignKey
ALTER TABLE "ServiceCenter" ADD CONSTRAINT "ServiceCenter_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE CASCADE ON UPDATE CASCADE;
