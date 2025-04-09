const prisma = require("../models/index");
const AppError = require("../utils/appError");
const ApiFeatures = require("../utils/apiFeatures");
const { logger } = require("../utils/logger");

const createServiceType = async (typeData) => {
  try {
    logger.info({
      message: "Creating new service type",
      metadata: { serviceName: typeData.name },
    });

    const serviceType = await prisma.serviceType.create({
      data: {
        name: typeData.name,
        description: typeData.description,
        longDescription: typeData.longDescription,
        estimatedDuration: parseInt(typeData.estimatedDuration, 10),
        displayImage: typeData.displayImage,
        categoryId: typeData.categoryId,
        recommendedFrequency: typeData.recommendedFrequency,
        warningThreshold: parseInt(typeData.warningThreshold, 10),
        displayOrder:
          typeData.displayOrder !== undefined
            ? parseInt(typeData.displayOrder)
            : 0,
        isPopular: typeData.isPopular === "true" || typeData.isPopular === true,
      },
    });

    logger.info({
      message: "Service type created successfully",
      metadata: { serviceTypeId: serviceType.serviceTypeId },
    });

    return serviceType;
  } catch (error) {
    logger.error({
      message: "Error creating service type",
      metadata: { error: error.message, stack: error.stack },
    });
    if (error.code === "P2002") {
      throw new AppError(
        "A service type with this name and category already exists",
        409
      );
    }
    throw error;
  }
};

module.exports = {
  createServiceType,
};
