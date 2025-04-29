const axios = require('axios');
const prisma = require('../models/index.js');
const { logger } = require('../utils/logger.js');
const {
  createNotFoundError,
  createInternalError,
} = require('../controllers/errorController');
const AppError = require('../utils/appError');

// Get the injection service URL from environment variables or use default
const INJECTION_SERVICE_URL =
  process.env.INJECTION_SERVICE_URL || 'http://localhost:5001';

/**
 * Create a new service center offering by forwarding the request to the injection service
 * @param {string} serviceCenterId - The ID of the service center
 * @param {Object} offeringData - The data for the new service center offering
 * @returns {Promise<Object>} - The created service center offering
 */
const createServiceCenterOffering = async (
  serviceCenterId,
  offeringData,
  req,
) => {
  try {
    // Note: We're not validating the service type locally anymore
    // That validation will be performed by the injection service

    logger.info({
      message:
        'Forwarding service center offering creation request to injection service',
      metadata: { serviceCenterId, serviceTypeId: offeringData.serviceTypeId },
    });

    // Make a copy of offeringData without serviceCenterId to avoid duplication
    const { serviceCenterId: _, ...offeringDataToSend } = offeringData;

    // Forward to injection service for the actual creation
    logger.info({
      message: 'Making request to injection service',
      metadata: {
        url: `${INJECTION_SERVICE_URL}/api/v1/service-centers/${serviceCenterId}/offerings`,
        data: offeringDataToSend,
      },
    });
    const authToken = req.headers.authorization;
    const response = await axios.post(
      `${INJECTION_SERVICE_URL}/api/v1/service-centers/${serviceCenterId}/offerings`,
      offeringDataToSend,
      {
        // Add timeout and headers for better debugging
        timeout: 5000,
        headers: {
          'Content-Type': 'application/json',
          Authorization: authToken,
        },
      },
    );

    logger.info({
      message: 'Service center offering created successfully',
      metadata: { serviceCenterId, serviceTypeId: offeringData.serviceTypeId },
    });

    return response.data.data;
  } catch (error) {
    // More detailed error logging to troubleshoot API communication issues
    logger.error({
      message: 'Error creating service center offering',
      metadata: {
        serviceCenterId,
        serviceTypeId: offeringData?.serviceTypeId,
        errorMessage: error.message,
        errorName: error.name,
        errorResponse: error.response
          ? {
              status: error.response.status,
              statusText: error.response.statusText,
              data: error.response.data,
            }
          : null,
        errorRequest: error.request
          ? 'Request was made but no response received'
          : null,
        errorConfig: error.config
          ? {
              url: error.config.url,
              method: error.config.method,
              data: error.config.data,
            }
          : null,
        stack: error.stack,
      },
    });

    // Handle specific error types
    if (error.code === 'ECONNREFUSED') {
      throw createInternalError(
        'Unable to connect to injection service. Is it running?',
      );
    }

    if (error.response?.status === 404) {
      throw createNotFoundError(serviceCenterId, 'service center');
    }

    throw createInternalError(
      error.response?.data?.message ||
        `Failed to create service center offering: ${error.message}`,
    );
  }
};

/**
 * Get all service offerings for a specific service center
 * @param {string} serviceCenterId - The ID of the service center
 * @param {Object} queryOptions - Query options for filtering, sorting, and pagination
 * @returns {Promise<Object>} - List of service center offerings with pagination metadata
 */
const getServiceCenterOfferings = async (
  serviceCenterId,
  queryOptions = {},
) => {
  const {
    limit = 10,
    page = 1,
    sort,
    status,
    serviceTypeId,
    hasPickupDropService,
    hasEmergencyService,
    minPrice,
    maxPrice,
  } = queryOptions;

  // Calculate pagination
  const skip = (parseInt(page) - 1) * parseInt(limit);
  const take = parseInt(limit);

  // Build filter conditions
  const where = { serviceCenterId };

  // Add optional filters
  if (status) {
    where.status = status;
  }

  if (serviceTypeId) {
    where.serviceTypeId = serviceTypeId;
  }

  if (hasPickupDropService !== undefined) {
    where.hasPickupDropService = hasPickupDropService === 'true';
  }

  if (hasEmergencyService !== undefined) {
    where.hasEmergencyService = hasEmergencyService === 'true';
  }

  // Handle price range filters
  if (minPrice || maxPrice) {
    where.basePrice = {};
    if (minPrice) {
      where.basePrice.gte = parseFloat(minPrice);
    }
    if (maxPrice) {
      where.basePrice.lte = parseFloat(maxPrice);
    }
  }

  // Build ordering
  let orderBy = [];
  if (sort) {
    const sortParams = sort.split(',');
    sortParams.forEach((param) => {
      const order = param.startsWith('-') ? 'desc' : 'asc';
      const field = param.startsWith('-') ? param.substring(1) : param;
      orderBy.push({ [field]: order });
    });
  } else {
    // Default sorting
    orderBy.push({ createdAt: 'desc' });
  }

  try {
    // Query for total count
    const totalItems = await prisma.serviceCenterOffering.count({ where });
    const totalPages = Math.ceil(totalItems / take);

    // Query for data with pagination
    const offerings = await prisma.serviceCenterOffering.findMany({
      where,
      orderBy,
      skip,
      take,
      include: {
        // Include related data
        serviceType: true,
        // additionalFeatures: true,
        // serviceTaxes: true,
      },
    });

    // Return both the data and pagination metadata
    return {
      data: offerings,
      pagination: {
        total: totalItems,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages,
      },
    };
  } catch (error) {
    logger.error({
      message: 'Error fetching service center offerings',
      metadata: {
        serviceCenterId,
        error: error.message,
        stack: error.stack,
      },
    });
    throw createInternalError(
      `Failed to fetch service center offerings: ${error.message}`,
    );
  }
};

/**
 * Get a specific service offering by ID for a specific service center
 * @param {string} serviceCenterId - The ID of the service center
 * @param {string} serviceCenterOfferingId - The ID of the service center offering
 * @returns {Promise<Object>} - The service center offering
 */
const getServiceCenterOffering = async (
  serviceCenterId,
  serviceCenterOfferingId,
) => {
  try {
    const offering = await prisma.serviceCenterOffering.findUnique({
      where: {
        serviceCenterOfferingId,
        serviceCenterId,
      },
      include: {
        // Include related data
        serviceType: true,
        // additionalFeatures: true,
        // serviceTaxes: true,
        // vehicleBrandServiceOfferings: {
        //   include: {
        //     brand: true,
        //     model: true,
        //   },
        // },
      },
    });

    return offering;
  } catch (error) {
    logger.error({
      message: 'Error fetching service center offering',
      metadata: {
        serviceCenterId,
        serviceCenterOfferingId,
        error: error.message,
        stack: error.stack,
      },
    });
    throw createInternalError(
      `Failed to fetch service center offering: ${error.message}`,
    );
  }
};

/**
 * Update a service center offering by forwarding the request to the injection service
 * @param {string} serviceCenterId - The ID of the service center
 * @param {string} serviceCenterOfferingId - The ID of the service center offering
 * @param {Object} updateData - The data to update in the service center offering
 * @returns {Promise<Object>} - The updated service center offering
 */
const updateServiceCenterOffering = async (
  serviceCenterId,
  serviceCenterOfferingId,
  updateData,
) => {
  try {
    logger.info({
      message:
        'Forwarding service center offering update request to injection service',
      metadata: { serviceCenterId, serviceCenterOfferingId },
    });

    // Forward to injection service for the actual update
    logger.info({
      message: 'Making update request to injection service',
      metadata: {
        url: `${INJECTION_SERVICE_URL}/api/v1/service-centers/${serviceCenterId}/offerings/${serviceCenterOfferingId}`,
        data: updateData,
      },
    });

    const response = await axios.patch(
      `${INJECTION_SERVICE_URL}/api/v1/service-centers/${serviceCenterId}/offerings/${serviceCenterOfferingId}`,
      updateData,
      {
        // Add timeout and headers for better debugging
        timeout: 5000,
        headers: {
          'Content-Type': 'application/json',
        },
      },
    );

    logger.info({
      message: 'Service center offering updated successfully',
      metadata: { serviceCenterId, serviceCenterOfferingId },
    });

    return response.data.data;
  } catch (error) {
    // Detailed error logging to troubleshoot API communication issues
    logger.error({
      message: 'Error updating service center offering',
      metadata: {
        serviceCenterId,
        serviceCenterOfferingId,
        errorMessage: error.message,
        errorName: error.name,
        errorResponse: error.response
          ? {
              status: error.response.status,
              statusText: error.response.statusText,
              data: error.response.data,
            }
          : null,
        errorRequest: error.request
          ? 'Request was made but no response received'
          : null,
        errorConfig: error.config
          ? {
              url: error.config.url,
              method: error.config.method,
              data: error.config.data,
            }
          : null,
        stack: error.stack,
      },
    });

    // Handle specific error types
    if (error.code === 'ECONNREFUSED') {
      throw createInternalError(
        'Unable to connect to injection service. Is it running?',
      );
    }

    if (error.response?.status === 404) {
      if (error.response?.data?.message?.includes('service center')) {
        throw createNotFoundError(serviceCenterId, 'service center');
      } else {
        throw createNotFoundError(
          serviceCenterOfferingId,
          'service center offering',
        );
      }
    }

    throw createInternalError(
      error.response?.data?.message ||
        `Failed to update service center offering: ${error.message}`,
    );
  }
};
/**
 * Get a specific service offering with its components for a specific service center
 * @param {string} serviceCenterId - The ID of the service center
 * @param {string} serviceCenterOfferingId - The ID of the service center offering
 * @param {Object} queryOptions - Query options for fetching components (optional)
 * @returns {Promise<Object>} - The service center offering with its service type components
 */
// const getServiceCenterOfferingWithComponents = async (
//   serviceCenterId,
//   serviceCenterOfferingId,
//   queryOptions = {},
// ) => {
//   try {
//     logger.info({
//       message: 'Fetching service center offering with components',
//       metadata: { serviceCenterId, serviceCenterOfferingId },
//     });

//     // First, get the service center offering
//     const offering = await getServiceCenterOffering(
//       serviceCenterId,
//       serviceCenterOfferingId,
//     );

//     if (!offering) {
//       throw createNotFoundError(
//         serviceCenterOfferingId,
//         'service center offering',
//       );
//     }

//     // Get the service type ID from the offering
//     const serviceTypeId = offering.serviceTypeId;

//     // Import the service type service to use the getComponentsByTypeId method
//     const serviceTypeService = require('./serviceTypeService');

//     // Fetch the components for this service type
//     const components = await serviceTypeService.getComponentsByTypeId(
//       serviceTypeId,
//       queryOptions,
//     );

//     // Combine the offering with its components
//     const result = {
//       ...offering,
//       components: components.data || [],
//       componentsMeta: components.meta || {
//         total: 0,
//         page: 1,
//         limit: 100,
//         totalPages: 0,
//         hasNextPage: false,
//         hasPrevPage: false,
//       },
//     };

//     logger.info({
//       message: 'Successfully fetched service center offering with components',
//       metadata: {
//         serviceCenterId,
//         serviceCenterOfferingId,
//         serviceTypeId,
//         componentsCount: components.data ? components.data.length : 0,
//       },
//     });

//     return result;
//   } catch (error) {
//     logger.error({
//       message: 'Error fetching service center offering with components',
//       metadata: {
//         serviceCenterId,
//         serviceCenterOfferingId,
//         error: error.message,
//         stack: error.stack,
//       },
//     });

//     // If it's already an AppError (like our 404), re-throw it
//     if (error.statusCode) {
//       throw error;
//     }

//     throw createInternalError(
//       `Failed to fetch service center offering with components: ${error.message}`,
//     );
//   }
// };

// modified one
const getServiceCenterOfferingWithComponents = async (
  serviceCenterId,
  serviceCenterOfferingId,
  queryOptions = {},
) => {
  try {
    logger.info({
      message: 'Fetching service center offering with components',
      metadata: { serviceCenterId, serviceCenterOfferingId, queryOptions },
    });

    // First, get the service center offering
    const offering = await getServiceCenterOffering(
      serviceCenterId,
      serviceCenterOfferingId,
    );

    if (!offering) {
      throw createNotFoundError(
        serviceCenterOfferingId,
        'service center offering',
      );
    }

    // Get the service type ID from the offering
    const serviceTypeId = offering.serviceTypeId;

    // Import the service type service to use the getComponentsByTypeId method
    const serviceTypeService = require('./serviceTypeService');

    // Extract query parameters specific to components
    // This allows filtering, sorting, and pagination for the components
    const componentQueryOptions = {
      ...queryOptions,
      // Add specific filters for component fetching if needed
      ...(queryOptions.isRequired && { isRequired: queryOptions.isRequired }),
      ...(queryOptions.isDefault && { isDefault: queryOptions.isDefault }),
    };

    // Fetch the components for this service type with all API features
    const components = await serviceTypeService.getComponentsByTypeId(
      serviceTypeId,
      componentQueryOptions,
    );

    // Combine the offering with its components
    const result = {
      ...offering,
      components: components.data || [],
      componentsMeta: components.meta || {
        total: 0,
        page: 1,
        limit: 100,
        totalPages: 0,
        hasNextPage: false,
        hasPrevPage: false,
      },
    };

    logger.info({
      message: 'Successfully fetched service center offering with components',
      metadata: {
        serviceCenterId,
        serviceCenterOfferingId,
        serviceTypeId,
        componentsCount: components.data ? components.data.length : 0,
        totalComponentsCount: components.meta ? components.meta.total : 0,
      },
    });

    return result;
  } catch (error) {
    logger.error({
      message: 'Error fetching service center offering with components',
      metadata: {
        serviceCenterId,
        serviceCenterOfferingId,
        error: error.message,
        stack: error.stack,
      },
    });

    // If it's already an AppError (like our 404), re-throw it
    if (error.statusCode) {
      throw error;
    }

    // Convert Prisma errors to AppErrors if not already done
    if (
      error.code &&
      error.code.startsWith('P') &&
      !(error instanceof AppError)
    ) {
      throw AppError.fromPrismaError(error);
    }

    throw createInternalError(
      `Failed to fetch service center offering with components: ${error.message}`,
    );
  }
};

module.exports = {
  createServiceCenterOffering,
  getServiceCenterOfferings,
  getServiceCenterOffering,
  updateServiceCenterOffering,
  getServiceCenterOfferingWithComponents,
};
