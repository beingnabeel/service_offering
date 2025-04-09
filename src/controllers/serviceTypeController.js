const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const serviceTypeService = require("../services/serviceTypeService");
const { formatSuccess, formatError } = require("../utils/responseFormatter");
const { logger } = require("../utils/logger");

const createType = catchAsync(async (req, res, next) => {
  const typeData = {
    name: req.body.name,
    description: req.body.description,
    longDescription: req.body.longDescription,
    estimatedDuration: req.body.estimatedDuration,
    categoryId: req.body.categoryId,
    recommendedFrequency: req.body.recommendedFrequency,
    warningThreshold: req.body.warningThreshold,
    displayOrder: req.body.displayOrder,
    isPopular: req.body.isPopular,
  };

  if (req.fileData) {
    typeData.displayImage = req.fileData.location;
    logger.info({
      message: "Service type display image uploaded",
      metadata: {
        fileName: req.fileData.originalName,
        fileUrl: req.fileData.location,
      },
    });
  }

  const serviceType = await serviceTypeService.createServiceType(typeData);
  res
    .status(201)
    .json(formatSuccess(serviceType, "Service type created successfully", 201));
});

module.exports = {
  createType,
};
