// const prisma = require('../models/index');
const { prisma } = require('../../../injestion_service/src/models');
const AppError = require('../utils/appError');
const {
  createNotFoundError,
  createInternalError,
  createDuplicateError,
} = require('../controllers/errorController');
// const ApiFeatures = require('../utils/apiFeatures');
const { logger } = require('../utils/logger');
const axios = require('axios');
const INJECTION_SERVICE_URL =
  process.env.INJECTION_SERVICE_URL || 'http://localhost:5001';

const createServiceType = async (typeData) => {
  try {
    logger.info({
      message: 'Forwarding service type creation to Injection Service',
      metadata: { serviceName: typeData.name },
    });
    const response = await axios.post(
      `${INJECTION_SERVICE_URL}/api/v1/types`,
      typeData,
    );
    const serviceType = response.data.data;

    logger.info({
      message: 'Service type created successfully via Injection Service',
      metadata: { serviceTypeId: serviceType.serviceTypeId },
    });

    return serviceType;
  } catch (error) {
    logger.error({
      message: 'Error creating service type via Injection Service',
      metadata: {
        error: error.response?.data?.message || error.message,
        stack: error.stack,
      },
    });

    if (error.response?.status === 409) {
      throw createDuplicateError('name', typeData.name, 'service type');
    }

    throw createInternalError(
      error.response?.data?.message || 'Failed to create service type',
    );
  }
};

const getServiceTypeById = async (id) => {
  try {
    logger.info({
      message: 'Fetching service type by ID',
      metadata: { serviceTypeId: id },
    });
    const serviceType = await prisma.serviceType.findUnique({
      where: { serviceTypeId: id },
    });
    if (!serviceType) {
      logger.warn({
        message: 'Service type not found',
        metadata: { serviceTypeId: id },
      });
      // Throw specific 404 AppError using factory function
      throw createNotFoundError(id, 'service type');
    }
    logger.info({
      message: 'Service type fetched successfully',
      metadata: { serviceTypeId: serviceType.serviceTypeId },
    });
    return serviceType;
  } catch (error) {
    // If it's already an AppError (like our 404), re-throw it
    if (error instanceof AppError) {
      throw error;
    }

    // Log unexpected errors
    logger.error({
      message: 'Error fetching service type by ID',
      metadata: { serviceTypeId: id, error: error.message, stack: error.stack },
    });

    // Wrap unexpected errors in a generic 500 AppError using factory function
    throw createInternalError(`Failed to fetch service type with ID: ${id}`);
  }
};

const updateServiceType = async (id, updateData) => {
  try {
    logger.info({
      message: 'Forwarding service type update to Injection Service',
      metadata: { serviceTypeId: id, updateData },
    });
    const response = await axios.patch(
      `${INJECTION_SERVICE_URL}/api/v1/types/${id}`,
      updateData,
    );
    const updatedType = response.data.data;
    logger.info({
      message: 'Service type updated successfully via Injection Service',
      metadata: { serviceTypeId: id, updatedType },
    });
    return updatedType;
  } catch (error) {
    logger.error({
      message: 'Error updating service type via Injection Service',
      metadata: {
        serviceTypeId: id,
        error: error.response?.data?.message || error.message,
        stack: error.stack,
      },
    });

    if (error.response?.status === 404) {
      throw createNotFoundError(id, 'service type');
    }

    throw createInternalError(
      error.response?.data?.message ||
        `Failed to update service type with ID: ${id}`,
    );
  }
};

/**
 * Get all service types for a specific category ID
 * @param {string} categoryId - Category ID to filter types by
 * @param {Object} queryOptions - Query parameters for filtering and pagination
 * @returns {Promise<Object>} Service types with pagination metadata
 */
const getServiceTypesByCategoryId = async (categoryId, queryOptions) => {
  try {
    // Import the APIFeatures class
    const APIFeatures = require('../utils/apiFeatures');

    // Define allowed filter fields for service types
    const allowedFilterFields = [
      'name',
      'description',
      'estimatedDuration',
      'isPopular',
      'recommendedFrequency',
      'displayOrder',
      'createdAt',
      'updatedAt',
    ];

    // Define allowed sort fields
    const allowedSortFields = [
      'name',
      'estimatedDuration',
      'displayOrder',
      'createdAt',
      'updatedAt',
    ];

    // Define searchable fields
    const searchableFields = ['name', 'description', 'longDescription'];

    logger.info({
      message: 'Fetching service types by category ID',
      metadata: { categoryId, queryOptions },
    });

    // First, check if the category exists
    const categoryExists = await prisma.serviceCategory.findUnique({
      where: { serviceCategoryId: categoryId },
      select: { serviceCategoryId: true },
    });

    if (!categoryExists) {
      throw createNotFoundError(categoryId, 'service category');
    }

    // Create a query builder adapter for Prisma
    const queryBuilder = {
      where: { categoryId }, // Base condition to filter by category ID
      orderBy: {},
      select: undefined,
      skip: 0,
      take: 10, // Default limit

      // Methods required by APIFeatures
      findMany: async function () {
        try {
          return await prisma.serviceType.findMany({
            where: this.where,
            orderBy: this.orderBy,
            ...(this.select && { select: this.select }),
            skip: this.skip,
            take: this.take,
          });
        } catch (error) {
          logger.error({
            message: 'Error executing Prisma query',
            metadata: { error: error.message, stack: error.stack },
          });
          throw error;
        }
      },

      count: async function () {
        try {
          return await prisma.serviceType.count({
            where: this.where,
          });
        } catch (error) {
          logger.error({
            message: 'Error counting service types',
            metadata: { error: error.message, stack: error.stack },
          });
          throw error;
        }
      },
    };

    // Apply the query builder adapter with APIFeatures
    const features = new APIFeatures(queryBuilder, queryOptions)
      .filter(allowedFilterFields)
      .search(searchableFields)
      .sort(allowedSortFields)
      .limitFields()
      .paginate();

    // Execute the query to get service types
    const types = await features.query.findMany();
    const total = await features.query.count();

    // Prepare pagination metadata
    const page = parseInt(queryOptions.page, 10) || 1;
    const limit = parseInt(queryOptions.limit, 10) || 10;
    const totalPages = Math.ceil(total / limit);

    // Create result object with data and metadata
    const result = {
      data: types,
      meta: {
        total,
        page,
        limit,
        totalPages,
      },
    };

    logger.info({
      message: 'Service types fetched successfully by category ID',
      metadata: {
        categoryId,
        count: types.length,
        total,
      },
    });

    return result;
  } catch (error) {
    logger.error({
      message: 'Error fetching service types by category ID',
      metadata: {
        categoryId,
        error: error.message,
        stack: error.stack,
      },
    });

    // AppError instances are already properly formatted
    if (error instanceof AppError) {
      throw error;
    }

    // Handle Prisma-specific errors
    if (error.code && error.code.startsWith('P')) {
      // This is a Prisma error
      logger.error({
        message: 'Prisma error while fetching service types',
        metadata: { code: error.code, clientVersion: error.clientVersion },
      });
      throw createInternalError(
        `Database error while fetching service types: ${error.message}`,
      );
    }

    // Generic error handling
    throw createInternalError(
      `Failed to fetch service types for category: ${categoryId}`,
    );
  }
};

const deleteServiceType = async (id) => {
  try {
    logger.info({
      message: 'Forwarding category deletion to injection Service',
      metadata: { serviceTypeId: id },
    });
    await axios.delete(`${INJECTION_SERVICE_URL}/api/v1/types/${id}`);
    logger.info({
      message: 'Service type deleted successfully via Injection Service',
      metadata: { serviceTypeId: id },
    });
    return true;
  } catch (error) {
    logger.error({
      message: 'Error deleting service type via Injection Service',
      metadata: {
        serviceTypeId: id,
        error: error.response?.data?.message || error.message,
        stack: error.stack,
      },
    });
    if (error.response?.status === 404) {
      throw createNotFoundError(id, 'service type');
    } else if (error.response?.status === 400) {
      const validationError = new AppError(
        'Cannot delete category with associated service type',
        400,
      );
      validationError.code = 'DPENDENT_RESOURCE_EXIST';
      validationError.details = {
        message: 'This service type is associated with some service requests',
        serviceTypeId: id,
      };
      throw validationError;
    }
    throw createInternalError(
      error.response?.data?.message ||
        `Failed to delete service type with ID: ${id}`,
    );
  }
};

module.exports = {
  createServiceType,
  getServiceTypeById,
  updateServiceType,
  getServiceTypesByCategoryId,
  deleteServiceType,
};
