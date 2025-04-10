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

/**
 * Get all service categories with filtering, sorting, pagination and field selection
 * @param {Object} queryOptions - Query parameters for filtering and pagination
 * @returns {Promise<Object>} Service categories with pagination metadata
 */
const getAllServiceCategories = async (queryOptions) => {
  try {
    // Parse pagination parameters upfront
    const page = parseInt(queryOptions.page, 10) || 1;
    const limit = parseInt(queryOptions.limit, 10) || 100;
    const skip = (page - 1) * limit;
    
    // Build the where conditions for filtering
    let whereConditions = {};
    
    // Clone queryOptions and remove non-filter fields
    const filterOptions = { ...queryOptions };
    const excludedFields = ['page', 'sort', 'limit', 'fields', 'search'];
    excludedFields.forEach(field => delete filterOptions[field]);
    
    // Process standard filters
    Object.keys(filterOptions).forEach(key => {
      const value = filterOptions[key];
      
      // Handle operators (gt, lt, etc.)
      if (typeof value === 'object' && value !== null) {
        Object.keys(value).forEach(operator => {
          const operatorValue = value[operator];
          
          switch(operator) {
            case 'gt': 
              whereConditions[key] = { ...whereConditions[key], gt: operatorValue };
              break;
            case 'gte': 
              whereConditions[key] = { ...whereConditions[key], gte: operatorValue };
              break;
            case 'lt': 
              whereConditions[key] = { ...whereConditions[key], lt: operatorValue };
              break;
            case 'lte': 
              whereConditions[key] = { ...whereConditions[key], lte: operatorValue };
              break;
            case 'contains': 
              whereConditions[key] = { ...whereConditions[key], contains: operatorValue, mode: 'insensitive' };
              break;
            default:
              // Ignore unknown operators
              break;
          }
        });
      } else {
        // Convert data types based on field name
        if (key === 'isPopular') {
          // Convert string to boolean
          whereConditions[key] = value === 'true' || (value === true);
        } else if (key === 'createdAt' || key === 'updatedAt') {
          // Handle date fields
          if (typeof value === 'object' && value !== null) {
            // Process operators for date fields
            const dateConditions = {};
            Object.keys(value).forEach(operator => {
              let dateValue = value[operator];
              
              // Ensure proper ISO format for date strings
              if (typeof dateValue === 'string') {
                // If only date is provided (YYYY-MM-DD), convert to full ISO string
                if (dateValue.match(/^\d{4}-\d{2}-\d{2}$/)) {
                  try {
                    const date = new Date(dateValue + 'T00:00:00Z');
                    if (!isNaN(date.getTime())) {
                      dateValue = date.toISOString();
                      console.log('Service: Converted date:', dateValue, 'to ISO format:', date.toISOString());
                    }
                  } catch (error) {
                    console.error(`Error converting date: ${dateValue}`, error);
                  }
                }
              }
              
              dateConditions[operator] = dateValue;
            });
            whereConditions[key] = dateConditions;
          } else if (typeof value === 'string') {
            // Direct date assignment
            if (value.match(/^\d{4}-\d{2}-\d{2}$/)) {
              // If only date is provided (YYYY-MM-DD), convert to full ISO string
              try {
                whereConditions[key] = new Date(value + 'T00:00:00Z').toISOString();
              } catch (error) {
                console.error(`Error converting date: ${value}`, error);
                whereConditions[key] = value;
              }
            } else {
              whereConditions[key] = value;
            }
          } else {
            whereConditions[key] = value;
          }
        } else if (key.includes('Id') || key === 'displayOrder') {
          // Try to convert numeric IDs and orders to numbers
          if (!isNaN(value)) {
            whereConditions[key] = parseInt(value, 10);
          } else {
            whereConditions[key] = value;
          }
        } else {
          // Keep original value for other fields
          whereConditions[key] = value;
        }
      }
    });
    
    // Handle search if provided
    if (queryOptions.search) {
      const searchTerm = queryOptions.search;
      // Add search conditions (search in name and description)
      whereConditions = {
        ...whereConditions,
        OR: [
          { name: { contains: searchTerm, mode: 'insensitive' } },
          { description: { contains: searchTerm, mode: 'insensitive' } }
        ]
      };
    }
    
    // Process date fields in where conditions before executing queries
    // to ensure ISO format is properly applied
    if (whereConditions.createdAt && whereConditions.createdAt.gte && typeof whereConditions.createdAt.gte === 'string') {
      try {
        // Handle createdAt.gte as direct ISO string if it's a valid date
        const date = new Date(whereConditions.createdAt.gte);
        if (!isNaN(date.getTime())) {
          whereConditions.createdAt.gte = date.toISOString();
          console.log('Fixed date for count query:', whereConditions.createdAt.gte);
        }
      } catch (error) {
        console.error('Error converting date for count query:', error);
      }
    }
    
    // Get total count before pagination for metadata
    const totalCount = await prisma.serviceCategory.count({
      where: whereConditions
    });
    
    // Prepare sorting options
    let orderBy = [{ createdAt: 'desc' }]; // Default sort
    
    if (queryOptions.sort) {
      orderBy = [];
      const sortFields = queryOptions.sort.split(',');
      
      sortFields.forEach(field => {
        if (field.startsWith('-')) {
          orderBy.push({ [field.substring(1)]: 'desc' });
        } else {
          orderBy.push({ [field]: 'asc' });
        }
      });
    }
    
    // Prepare field selection
    let select = undefined;
    if (queryOptions.fields) {
      select = {};
      const requestedFields = queryOptions.fields.split(',');
      
      requestedFields.forEach(field => {
        if (field.startsWith('-')) {
          select[field.substring(1)] = false;
        } else {
          select[field] = true;
        }
      });
      
      // Always include ID if not explicitly excluded
      if (select.id !== false && !Object.keys(select).some(k => select[k] === true)) {
        select.id = true;
      }
    }
    
    // Build and execute final query with all options
    const serviceCategories = await prisma.serviceCategory.findMany({
      where: whereConditions,
      orderBy,
      ...(select && { select }),
      skip,
      take: limit
    });
    
    const totalPages = Math.ceil(totalCount / limit);
    
    logger.info({
      message: 'Retrieved service categories',
      metadata: { count: serviceCategories.length, totalCount }
    });
    
    // Return data with pagination metadata
    return {
      data: serviceCategories,
      meta: {
        total: totalCount,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    };
  } catch (error) {
    logger.error({
      message: 'Error retrieving service categories',
      metadata: { error: error.message, stack: error.stack }
    });
    throw error;
  }
};

module.exports = {
  createServiceCategory,
  getAllServiceCategories
};
