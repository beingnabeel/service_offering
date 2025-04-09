-- CreateEnum
CREATE TYPE "ServiceCenterStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'MAINTENANCE', 'CLOSED', 'COMING_SOON');

-- CreateEnum
CREATE TYPE "StaffStatus" AS ENUM ('ACTIVE', 'ON_LEAVE', 'TERMINATED', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "VehicleType" AS ENUM ('CAR', 'BIKE', 'NONE');

-- CreateEnum
CREATE TYPE "ServiceStatus" AS ENUM ('ACTIVE', 'PENDING', 'TEMPORARILY_UNAVAILABLE', 'COMING_SOON');

-- CreateEnum
CREATE TYPE "ServicePriority" AS ENUM ('NORMAL', 'EXPRESS', 'PREMIUM');

-- CreateEnum
CREATE TYPE "PackageType" AS ENUM ('ONE_TIME', 'SUBSCRIPTION', 'MEMBERSHIP');

-- CreateEnum
CREATE TYPE "PaymentPolicy" AS ENUM ('PAYMENT_BEFORE_SERVICE', 'PAYMENT_AFTER_SERVICE', 'PARTIAL_PAYMENT', 'FREE_DIAGNOSTIC');

-- CreateTable
CREATE TABLE "Brand" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "logo" TEXT,
    "description" TEXT,
    "vehicleType" "VehicleType" NOT NULL,
    "website" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Brand_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Model" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "brandId" TEXT NOT NULL,
    "vehicleType" "VehicleType" NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "imageUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Model_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Address" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "street" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "postalCode" TEXT NOT NULL,
    "landmark" TEXT,
    "additionalInfo" TEXT,
    "longitude" DOUBLE PRECISION NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Address_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServiceCenter" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "brandId" TEXT NOT NULL,
    "addressId" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "alternatePhone" TEXT,
    "email" TEXT,
    "website" TEXT,
    "status" "ServiceCenterStatus" NOT NULL DEFAULT 'ACTIVE',
    "rating" DOUBLE PRECISION DEFAULT 0,
    "totalRatings" INTEGER NOT NULL DEFAULT 0,
    "capacity" INTEGER NOT NULL DEFAULT 5,
    "description" TEXT,
    "images" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ServiceCenter_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OperatingHours" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "serviceCenterId" TEXT NOT NULL,
    "openTime" TIMESTAMP(3) NOT NULL,
    "closeTime" TIMESTAMP(3) NOT NULL,
    "isClosed" BOOLEAN NOT NULL DEFAULT false,
    "isHoliday" BOOLEAN NOT NULL DEFAULT false,
    "holidayReason" TEXT,

    CONSTRAINT "OperatingHours_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Slot" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "serviceCenterId" TEXT NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3) NOT NULL,
    "isAvailable" BOOLEAN NOT NULL DEFAULT true,
    "slotCapacity" INTEGER NOT NULL DEFAULT 1,
    "bookedCapacity" INTEGER NOT NULL DEFAULT 0,
    "isBlocked" BOOLEAN NOT NULL DEFAULT false,
    "blockReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "externalBookingIds" TEXT[],

    CONSTRAINT "Slot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "service_category" (
    "service_category_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(255) NOT NULL,
    "description" VARCHAR(255),
    "vehicleType" "VehicleType" NOT NULL DEFAULT 'CAR',
    "icon" TEXT,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "isPopular" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "service_category_pkey" PRIMARY KEY ("service_category_id")
);

-- CreateTable
CREATE TABLE "service_type" (
    "service_type_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(255) NOT NULL,
    "description" VARCHAR(255),
    "long_description" TEXT,
    "estimated_duration" INTEGER NOT NULL,
    "display_image" TEXT,
    "category_id" UUID NOT NULL,
    "recommended_frequency" TEXT,
    "warning_threshold" INTEGER,
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "is_popular" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "service_type_pkey" PRIMARY KEY ("service_type_id")
);

-- CreateTable
CREATE TABLE "service_component" (
    "service_component_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(255) NOT NULL,
    "description" VARCHAR(255),
    "estimated_duration" INTEGER,
    "vehicle_type" "VehicleType" DEFAULT 'NONE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "service_component_pkey" PRIMARY KEY ("service_component_id")
);

-- CreateTable
CREATE TABLE "service_type_component" (
    "service_type_component_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "service_type_id" UUID NOT NULL,
    "service_component_id" UUID NOT NULL,
    "is_default" BOOLEAN NOT NULL DEFAULT true,
    "is_required" BOOLEAN NOT NULL DEFAULT false,
    "additional_price" DECIMAL(10,2),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "service_type_component_pkey" PRIMARY KEY ("service_type_component_id")
);

-- CreateTable
CREATE TABLE "service_center_offering" (
    "service_center_offering_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "service_center_id" TEXT NOT NULL,
    "service_type_id" UUID NOT NULL,
    "status" "ServiceStatus" NOT NULL DEFAULT 'ACTIVE',
    "base_price" DECIMAL(10,2) NOT NULL,
    "discount_percentage" DECIMAL(5,2),
    "discount_absolute" DECIMAL(10,2),
    "discount_valid_until" TIMESTAMP(3),
    "time_to_complete" INTEGER,
    "available_priorities" "ServicePriority"[] DEFAULT ARRAY['NORMAL']::"ServicePriority"[],
    "priority_prices" JSONB,
    "minimum_advance_booking" INTEGER,
    "terms_and_conditions" TEXT,
    "payment_policy" "PaymentPolicy" NOT NULL DEFAULT 'PAYMENT_AFTER_SERVICE',
    "warranty_days" INTEGER,
    "warranty_kilometers" INTEGER,
    "is_highlighted" BOOLEAN NOT NULL DEFAULT false,
    "has_pickup_drop_service" BOOLEAN NOT NULL DEFAULT false,
    "pickup_drop_fee" DECIMAL(10,2),
    "has_emergency_service" BOOLEAN NOT NULL DEFAULT false,
    "emergency_service_fee" DECIMAL(10,2),
    "rating" DECIMAL(3,2),
    "review_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "service_center_offering_pkey" PRIMARY KEY ("service_center_offering_id")
);

-- CreateTable
CREATE TABLE "vehicle_brand_service_offering" (
    "vehicle_brand_service_offering_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "offering_id" UUID NOT NULL,
    "brand_id" TEXT NOT NULL,
    "model_id" TEXT,
    "manufacture_year_start" INTEGER,
    "manufacture_year_end" INTEGER,
    "fuel_type" TEXT,
    "status" "ServiceStatus" NOT NULL DEFAULT 'ACTIVE',
    "price" DECIMAL(10,2),
    "discount_percentage" DECIMAL(5,2),
    "time_to_complete" INTEGER,
    "special_notes" TEXT,
    "parts_included" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vehicle_brand_service_offering_pkey" PRIMARY KEY ("vehicle_brand_service_offering_id")
);

-- CreateTable
CREATE TABLE "additional_feature" (
    "additional_feature_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "offering_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "is_complimentary" BOOLEAN NOT NULL DEFAULT false,
    "price" DECIMAL(10,2),
    "display_icon" TEXT,
    "is_popular" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "additional_feature_pkey" PRIMARY KEY ("additional_feature_id")
);

-- CreateTable
CREATE TABLE "service_package" (
    "service_package_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "description" TEXT,
    "long_description" TEXT,
    "package_type" "PackageType" NOT NULL DEFAULT 'ONE_TIME',
    "duration_days" INTEGER,
    "vehicle_type" "VehicleType" NOT NULL,
    "display_image" TEXT,
    "is_popular" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "service_package_pkey" PRIMARY KEY ("service_package_id")
);

-- CreateTable
CREATE TABLE "service_package_item" (
    "service_package_item_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "package_id" UUID NOT NULL,
    "service_type_id" UUID NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "is_required" BOOLEAN NOT NULL DEFAULT true,
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "service_package_item_pkey" PRIMARY KEY ("service_package_item_id")
);

-- CreateTable
CREATE TABLE "service_package_offering" (
    "service_package_offering_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "package_id" UUID NOT NULL,
    "service_center_id" TEXT NOT NULL,
    "offering_id" UUID NOT NULL,
    "status" "ServiceStatus" NOT NULL DEFAULT 'ACTIVE',
    "base_price" DECIMAL(10,2) NOT NULL,
    "discount_percentage" DECIMAL(5,2),
    "discount_valid_until" TIMESTAMP(3),
    "terms_and_conditions" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "service_package_offering_pkey" PRIMARY KEY ("service_package_offering_id")
);

-- CreateTable
CREATE TABLE "seasonal_discount" (
    "seasonal_discount_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "description" TEXT,
    "offering_id" UUID NOT NULL,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3) NOT NULL,
    "discount_percentage" DECIMAL(5,2),
    "discount_absolute" DECIMAL(10,2),
    "promo_code" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "seasonal_discount_pkey" PRIMARY KEY ("seasonal_discount_id")
);

-- CreateTable
CREATE TABLE "service_offering_tax" (
    "service_offering_tax_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "offering_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "percentage" DECIMAL(5,2) NOT NULL,
    "description" TEXT,
    "is_included" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "service_offering_tax_pkey" PRIMARY KEY ("service_offering_tax_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Brand_name_key" ON "Brand"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Model_brandId_name_vehicleType_key" ON "Model"("brandId", "name", "vehicleType");

-- CreateIndex
CREATE UNIQUE INDEX "ServiceCenter_addressId_key" ON "ServiceCenter"("addressId");

-- CreateIndex
CREATE UNIQUE INDEX "OperatingHours_serviceCenterId_key" ON "OperatingHours"("serviceCenterId");

-- CreateIndex
CREATE INDEX "service_category_vehicleType_isPopular_idx" ON "service_category"("vehicleType", "isPopular");

-- CreateIndex
CREATE UNIQUE INDEX "service_category_name_vehicleType_key" ON "service_category"("name", "vehicleType");

-- CreateIndex
CREATE INDEX "service_type_category_id_is_popular_idx" ON "service_type"("category_id", "is_popular");

-- CreateIndex
CREATE UNIQUE INDEX "service_type_name_category_id_key" ON "service_type"("name", "category_id");

-- CreateIndex
CREATE UNIQUE INDEX "service_component_name_key" ON "service_component"("name");

-- CreateIndex
CREATE UNIQUE INDEX "service_type_component_service_type_id_service_component_id_key" ON "service_type_component"("service_type_id", "service_component_id");

-- CreateIndex
CREATE INDEX "service_center_offering_status_service_type_id_idx" ON "service_center_offering"("status", "service_type_id");

-- CreateIndex
CREATE INDEX "service_center_offering_has_emergency_service_status_idx" ON "service_center_offering"("has_emergency_service", "status");

-- CreateIndex
CREATE INDEX "service_center_offering_has_pickup_drop_service_status_idx" ON "service_center_offering"("has_pickup_drop_service", "status");

-- CreateIndex
CREATE UNIQUE INDEX "service_center_offering_service_center_id_service_type_id_key" ON "service_center_offering"("service_center_id", "service_type_id");

-- CreateIndex
CREATE INDEX "vehicle_brand_service_offering_brand_id_model_id_status_idx" ON "vehicle_brand_service_offering"("brand_id", "model_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "vehicle_brand_service_offering_offering_id_brand_id_model_i_key" ON "vehicle_brand_service_offering"("offering_id", "brand_id", "model_id", "fuel_type");

-- CreateIndex
CREATE UNIQUE INDEX "additional_feature_offering_id_name_key" ON "additional_feature"("offering_id", "name");

-- CreateIndex
CREATE UNIQUE INDEX "service_package_name_vehicle_type_package_type_key" ON "service_package"("name", "vehicle_type", "package_type");

-- CreateIndex
CREATE UNIQUE INDEX "service_package_item_package_id_service_type_id_key" ON "service_package_item"("package_id", "service_type_id");

-- CreateIndex
CREATE UNIQUE INDEX "service_package_offering_package_id_service_center_id_key" ON "service_package_offering"("package_id", "service_center_id");

-- CreateIndex
CREATE INDEX "seasonal_discount_start_date_end_date_is_active_idx" ON "seasonal_discount"("start_date", "end_date", "is_active");

-- CreateIndex
CREATE UNIQUE INDEX "service_offering_tax_offering_id_name_key" ON "service_offering_tax"("offering_id", "name");

-- AddForeignKey
ALTER TABLE "Model" ADD CONSTRAINT "Model_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceCenter" ADD CONSTRAINT "ServiceCenter_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceCenter" ADD CONSTRAINT "ServiceCenter_addressId_fkey" FOREIGN KEY ("addressId") REFERENCES "Address"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OperatingHours" ADD CONSTRAINT "OperatingHours_serviceCenterId_fkey" FOREIGN KEY ("serviceCenterId") REFERENCES "ServiceCenter"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Slot" ADD CONSTRAINT "Slot_serviceCenterId_fkey" FOREIGN KEY ("serviceCenterId") REFERENCES "ServiceCenter"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_type" ADD CONSTRAINT "service_type_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "service_category"("service_category_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_type_component" ADD CONSTRAINT "service_type_component_service_type_id_fkey" FOREIGN KEY ("service_type_id") REFERENCES "service_type"("service_type_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_type_component" ADD CONSTRAINT "service_type_component_service_component_id_fkey" FOREIGN KEY ("service_component_id") REFERENCES "service_component"("service_component_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_center_offering" ADD CONSTRAINT "service_center_offering_service_center_id_fkey" FOREIGN KEY ("service_center_id") REFERENCES "ServiceCenter"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_center_offering" ADD CONSTRAINT "service_center_offering_service_type_id_fkey" FOREIGN KEY ("service_type_id") REFERENCES "service_type"("service_type_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicle_brand_service_offering" ADD CONSTRAINT "vehicle_brand_service_offering_offering_id_fkey" FOREIGN KEY ("offering_id") REFERENCES "service_center_offering"("service_center_offering_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicle_brand_service_offering" ADD CONSTRAINT "vehicle_brand_service_offering_brand_id_fkey" FOREIGN KEY ("brand_id") REFERENCES "Brand"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicle_brand_service_offering" ADD CONSTRAINT "vehicle_brand_service_offering_model_id_fkey" FOREIGN KEY ("model_id") REFERENCES "Model"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "additional_feature" ADD CONSTRAINT "additional_feature_offering_id_fkey" FOREIGN KEY ("offering_id") REFERENCES "service_center_offering"("service_center_offering_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_package_item" ADD CONSTRAINT "service_package_item_package_id_fkey" FOREIGN KEY ("package_id") REFERENCES "service_package"("service_package_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_package_item" ADD CONSTRAINT "service_package_item_service_type_id_fkey" FOREIGN KEY ("service_type_id") REFERENCES "service_type"("service_type_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_package_offering" ADD CONSTRAINT "service_package_offering_package_id_fkey" FOREIGN KEY ("package_id") REFERENCES "service_package"("service_package_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_package_offering" ADD CONSTRAINT "service_package_offering_offering_id_fkey" FOREIGN KEY ("offering_id") REFERENCES "service_center_offering"("service_center_offering_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "seasonal_discount" ADD CONSTRAINT "seasonal_discount_offering_id_fkey" FOREIGN KEY ("offering_id") REFERENCES "service_center_offering"("service_center_offering_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_offering_tax" ADD CONSTRAINT "service_offering_tax_offering_id_fkey" FOREIGN KEY ("offering_id") REFERENCES "service_center_offering"("service_center_offering_id") ON DELETE CASCADE ON UPDATE CASCADE;
