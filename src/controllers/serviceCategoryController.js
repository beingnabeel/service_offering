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

/**
 * Get all service categories
 */
const getAllCategories = catchAsync(async (req, res, next) => {
  // Use a simpler approach to handle query parameters
  const queryOptions = { ...req.query };
  
  // Handle name contains filter - convert to proper Prisma format
  if (req.query['name[contains]']) {
    queryOptions.name = { contains: req.query['name[contains]'] };
    delete queryOptions['name[contains]'];
  }
  
  // Handle date filtering - convert date strings to ISO format for Prisma
  if (req.query['createdAt[gte]']) {
    if (!queryOptions.createdAt) queryOptions.createdAt = {};
    const dateStr = req.query['createdAt[gte]'];
    
    // Convert YYYY-MM-DD to full ISO string
    try {
      // Make sure we have a full ISO date with time component
      if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
        // If only date is provided (YYYY-MM-DD), add time part (start of day UTC)
        const date = new Date(dateStr + 'T00:00:00Z');
        if (!isNaN(date.getTime())) {
          queryOptions.createdAt.gte = date.toISOString();
          console.log('Converted date:', dateStr, 'to ISO format:', date.toISOString());
        }
      } else {
        // For other date formats, let JavaScript try to parse it
        const date = new Date(dateStr);
        if (!isNaN(date.getTime())) {
          queryOptions.createdAt.gte = date.toISOString();
        }
      }
    } catch (error) {
      console.error(`Error parsing date: ${dateStr}`, error);
    }
    
    delete queryOptions['createdAt[gte]'];
  }
  
  // Handle other possible date filters
  if (req.query['createdAt[lte]']) {
    if (!queryOptions.createdAt) queryOptions.createdAt = {};
    const dateStr = req.query['createdAt[lte]'];
    
    try {
      const date = new Date(dateStr);
      if (!isNaN(date.getTime())) {
        queryOptions.createdAt.lte = date.toISOString();
      }
    } catch (error) {
      console.error(`Error parsing date: ${dateStr}`, error);
    }
    
    delete queryOptions['createdAt[lte]'];
  }
  
  // Get all service categories with pagination and filtering
  const result = await serviceCategoryService.getAllServiceCategories(queryOptions);
  
  // Return success response
  res.status(200).json(
    formatSuccess(
      result, 
      'Service categories retrieved successfully', 
      200
    )
  );
});

module.exports = {
  createCategory,
  getAllCategories
};
