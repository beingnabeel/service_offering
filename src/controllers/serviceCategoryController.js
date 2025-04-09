const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const serviceCategoryService = require("../services/serviceCategoryService");
const { formatSuccess, formatError } = require("../utils/responseFormatter");
const { logger } = require('../utils/logger');

/**
 * Create a new service category
 */
const createCategory = catchAsync(async (req, res, next) => {
  // Extract data from the request body
  const categoryData = {
    name: req.body.name,
    description: req.body.description,
    vehicleType: req.body.vehicleType,
    displayOrder: req.body.displayOrder,
    isPopular: req.body.isPopular
  };
  
  // If file data is available from the middleware, add the file URL to categoryData and log
  if (req.fileData) {
    categoryData.icon = req.fileData.location;
    
    // Log successful file upload
    logger.info({
      message: 'Service category icon uploaded',
      metadata: {
        fileName: req.fileData.originalName,
        fileUrl: req.fileData.location
      }
    });
  }

  // Create the service category using the service layer
  const serviceCategory = await serviceCategoryService.createServiceCategory(categoryData);
  
  // Return success response
  res.status(201).json(
    formatSuccess(
      serviceCategory, 
      'Service category created successfully', 
      201
    )
  );
});

module.exports = {
  createCategory
};
