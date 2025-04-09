const prisma = require("../models/index");
const AppError = require("../utils/appError");
const ApiFeatures = require("../utils/apiFeatures");
const { logger } = require('../utils/logger');

/**
 * Create a new service category
 * @param {Object} categoryData - Service category data
 * @returns {Promise<Object>} Created service category
 */
const createServiceCategory = async (categoryData) => {
  try {
    logger.info({
      message: 'Creating new service category',
      metadata: { categoryName: categoryData.name }
    });
    
    // Create the service category in the database
    const serviceCategory = await prisma.serviceCategory.create({
      data: {
        name: categoryData.name,
        description: categoryData.description,
        vehicleType: categoryData.vehicleType || 'CAR',
        icon: categoryData.icon,
        displayOrder: categoryData.displayOrder !== undefined ? parseInt(categoryData.displayOrder) : 0,
        isPopular: categoryData.isPopular === 'true' || categoryData.isPopular === true
      }
    });
    
    logger.info({
      message: 'Service category created successfully',
      metadata: { serviceCategoryId: serviceCategory.serviceCategoryId }
    });
    
    return serviceCategory;
  } catch (error) {
    logger.error({
      message: 'Error creating service category',
      metadata: { error: error.message, stack: error.stack }
    });
    
    // Check for unique constraint violation
    if (error.code === 'P2002') {
      throw new AppError('A service category with this name and vehicle type already exists', 409);
    }
    
    throw error;
  }
};

module.exports = {
  createServiceCategory
};
