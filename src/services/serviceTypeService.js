// Fix import to match how prisma is exported in models/index.js
const prisma = require('../models/index');
const AppError = require('../utils/appError');
const {
  createNotFoundError,
  createInternalError,
  createDuplicateError,
} = require('../controllers/errorController');
// const ApiFeatures = require('../utils/apiFeatures');
const { logger } = require('../utils/logger');
const axios = require('axios');
const { query } = require('winston');
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

    // Check if the ID is valid and exists in the database
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

    // Check for Prisma errors
    if (error.name === 'PrismaClientKnownRequestError') {
      logger.error({
        message: 'Prisma database error while fetching service type',
        metadata: {
          serviceTypeId: id,
          errorCode: error.code,
          errorMessage: error.message,
          stack: error.stack,
        },
      });

      if (error.code === 'P2023') {
        // Invalid UUID format
        throw createInvalidIdError(id, 'service type');
      }
    }

    // Log unexpected errors
    logger.error({
      message: 'Error fetching service type by ID',
      metadata: { serviceTypeId: id, error: error.message, stack: error.stack },
    });

    // Wrap unexpected errors in a generic 500 AppError using factory function
    throw createInternalError(
      `Failed to fetch service type with ID: ${id}. Error: ${error.message}`,
    );
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
    const ALLOWED_FILTER_FIELDS = [
      'name',
      'description',
      'estimatedDuration',
      'isPopular',
      'recommendedFrequency',
      'displayOrder',
      'createdAt',
      'updatedAt',
    ];

    const isAllowedField = (field) => {
      if (ALLOWED_FILTER_FIELDS.includes(field)) return true;

      if (field.includes('[') && field.includes(']')) {
        const baseField = field.split('[')[0];
        return ALLOWED_FILTER_FIELDS.includes(baseField);
      }

      if (field.includes('.')) {
        const baseField = field.split('.')[0];
        return ALLOWED_FILTER_FIELDS.includes(baseField);
      }

      return false;
    };

    let baseQuery = {
      model: prisma.serviceType,
      whereConditions: {
        categoryId: categoryId, // Correct field name for the categoryId filter
      },
      orderByConditions: [{ createdAt: 'desc' }],
      selectConditions: undefined,
      skipValue: 0,
      takeValue: 100,
      orderBy: function (orderByParams) {
        this.orderByConditions = orderByParams;
        return this;
      },
      select: function (selectParams) {
        this.selectConditions = selectParams;
        return this;
      },
      where: function (whereParams) {
        const validWhereParams = {};
        Object.keys(whereParams).forEach((key) => {
          if (isAllowedField(key)) {
            validWhereParams[key] = whereParams[key];
          } else {
            logger.warn({
              message: `Ignoring invalid filter field: ${key}`,
              metadata: { value: whereParams[key] },
            });
          }
        });
        this.whereConditions = { ...this.whereConditions, ...validWhereParams };
        return this;
      },
      skip: function (skipValue) {
        this.skipValue = skipValue;
        return this;
      },
      limit: function (limitValue) {
        this.takeValue = limitValue;
        return this;
      },
      search: function (searchTerm) {
        if (searchTerm) {
          this.whereConditions = {
            ...this.whereConditions,
            OR: [
              { name: { contains: searchTerm, mode: 'insensitive' } },
              { description: { contains: searchTerm, mode: 'insensitive' } },
              {
                longDescription: { contains: searchTerm, mode: 'insensitive' },
              },
            ],
          };
        }
        return this;
      },
      count: async function () {
        try {
          return await this.model.count({
            where: this.whereConditions,
          });
        } catch (error) {
          if (error.code && error.code.startsWith('P')) {
            throw AppError.fromPrismaError(error);
          }
          logger.error({
            message: 'Error counting service types',
            metadata: { error: error.message, stack: error.stack },
          });
          throw error;
        }
      },
      findMany: async function () {
        try {
          return await this.model.findMany({
            where: this.whereConditions,
            orderBy: this.orderByConditions,
            ...(this.selectConditions && { select: this.selectConditions }),
            skip: this.skipValue,
            take: this.takeValue,
          });
        } catch (error) {
          if (error.code && error.code.startsWith('P')) {
            throw AppError.fromPrismaError(error);
          }
          logger.error({
            message: 'Error fetching service types',
            metadata: { error: error.message, stack: error.stack },
          });
          throw error;
        }
      },
    };

    const features = new APIFeatures(baseQuery, queryOptions);
    features.filter();

    if (queryOptions.search) {
      baseQuery.search(queryOptions.search);
    }

    features.sort().limitFieldsAdvanced();
    const countQuery = { ...features.query };
    features.paginate();
    const totalCount = await countQuery.count();
    const serviceTypes = await features.query.findMany();

    const page = parseInt(queryOptions.page, 10) || 1;
    const limit = parseInt(queryOptions.limit, 10) || 10;
    const totalPages = Math.ceil(totalCount / limit);

    logger.info({
      message: `Retrieved service types by category ID ${categoryId}`,
      metadata: { count: serviceTypes.length, totalCount },
    });

    return {
      data: serviceTypes,
      meta: {
        total: totalCount,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    };
  } catch (error) {
    logger.error({
      message: 'Error retrieving service types',
      metadata: {
        categoryId,
        error: error.message,
        code: error.code,
        stack: error.stack,
      },
    });

    if (
      error.code &&
      error.code.startsWith('P') &&
      !(error instanceof AppError)
    ) {
      throw AppError.fromPrismaError(error);
    }

    if (!(error instanceof AppError)) {
      throw AppError.internal(
        `Failed to retrieve service types: ${error.message}`,
      );
    }

    throw error;
  }
};
const deleteServiceType = async (id) => {
  try {
    logger.info({
      message: 'Forwarding service type deletion to Injection Service',
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

// Associate a component with a service type
const associateComponentWithType = async (serviceTypeId, componentData) => {
  try {
    logger.info({
      message: 'Forwarding component association to injection service',
      metadata: { serviceTypeId, componentData },
    });

    const response = await axios.post(
      `${INJECTION_SERVICE_URL}/api/v1/types/${serviceTypeId}/components`,
      componentData,
    );

    const typeComponent = response.data.data.typeComponent;

    logger.info({
      message: 'Component associated with service type successfully',
      metadata: {
        serviceTypeId,
        serviceComponentId: componentData.serviceComponentId,
        typeComponentId: typeComponent.serviceTypeComponentId,
      },
    });

    return typeComponent;
  } catch (error) {
    logger.error({
      message: 'Error associating component with service type',
      metadata: {
        serviceTypeId,
        error: error.response?.data?.message || error.message,
        stack: error.stack,
      },
    });

    if (error.response?.status === 404) {
      throw createNotFoundError(serviceTypeId, 'service type or component');
    }

    throw createInternalError(
      error.response?.data?.message ||
        `Failed to associate component with service type ID: ${serviceTypeId}`,
    );
  }
};

// // Get all components associated with a service type
// const getComponentsByTypeId = async (serviceTypeId) => {
//   try {
//     logger.info({
//       message: 'Fetching components associated with service type',
//       metadata: { serviceTypeId },
//     });

//     // const response = await axios.get(
//     //   `${INJECTION_SERVICE_URL}/api/v1/types/${serviceTypeId}/components`,
//     // );

//     // const components = response.data.data.components;
//     const serviceType = await prisma.serviceType.findUnique({
//       where: { serviceTypeId },
//     });

//     if (!serviceType) {
//       throw new AppError(
//         `No service type found with ID: ${serviceTypeId}`,
//         404,
//       );
//     }

//     // Get all the component associations
//     const typeComponents = await prisma.serviceTypeComponent.findMany({
//       where: { serviceTypeId },
//       include: {
//         serviceComponent: true,
//       },
//     });
//     // const components = typeComponents.map((tc) => tc.serviceComponent);
//     logger.info({
//       message: 'Components fetched successfully',
//       metadata: {
//         serviceTypeId,
//         count: typeComponents.length,
//       },
//     });

//     // return components;
//     // return components;
//     return typeComponents;
//   } catch (error) {
//     logger.error({
//       message: 'Error fetching components for service type',
//       metadata: {
//         serviceTypeId,
//         error: error.response?.data?.message || error.message,
//         stack: error.stack,
//       },
//     });

//     if (error.response?.status === 404) {
//       throw createNotFoundError(serviceTypeId, 'service type');
//     }

//     throw createInternalError(
//       error.response?.data?.message ||
//         `Failed to fetch components for service type ID: ${serviceTypeId}`,
//     );
//   }
// };

//  the above one is working fine
const getComponentsByTypeId = async (serviceTypeId, queryOptions = {}) => {
  try {
    const APIFeatures = require('../utils/apiFeatures');

    logger.info({
      message: 'Fetching components associated with service type',
      metadata: { serviceTypeId, queryOptions },
    });

    // Validate service type exists
    const serviceType = await prisma.serviceType.findUnique({
      where: { serviceTypeId },
    });

    if (!serviceType) {
      throw new AppError(
        `No service type found with ID: ${serviceTypeId}`,
        404,
      );
    }

    // Define allowed filter fields for components
    const ALLOWED_FILTER_FIELDS = [
      'serviceComponentId',
      'name',
      'description',
      'estimatedDuration',
      'vehicleType',
      'createdAt',
      'updatedAt',
    ];

    const isAllowedField = (field) => {
      if (ALLOWED_FILTER_FIELDS.includes(field)) return true;

      if (field.includes('[') && field.includes(']')) {
        const baseField = field.split('[')[0];
        return ALLOWED_FILTER_FIELDS.includes(baseField);
      }

      if (field.includes('.')) {
        const baseField = field.split('.')[0];
        return ALLOWED_FILTER_FIELDS.includes(baseField);
      }

      return false;
    };

    let baseQuery = {
      model: prisma.serviceTypeComponent,
      whereConditions: {
        serviceTypeId,
      },
      orderByConditions: [{ createdAt: 'desc' }],
      selectConditions: undefined,
      skipValue: 0,
      takeValue: 100,

      orderBy: function (orderByParams) {
        this.orderByConditions = orderByParams;
        return this;
      },

      select: function (selectParams) {
        this.selectConditions = selectParams;
        return this;
      },

      where: function (whereParams) {
        const validWhereParams = {};
        Object.keys(whereParams).forEach((key) => {
          if (isAllowedField(key)) {
            validWhereParams[key] = whereParams[key];
          } else {
            logger.warn({
              message: `Ignoring invalid filter field: ${key}`,
              metadata: { value: whereParams[key] },
            });
          }
        });

        this.whereConditions = { ...this.whereConditions, ...validWhereParams };
        return this;
      },

      skip: function (skipValue) {
        this.skipValue = skipValue;
        return this;
      },

      limit: function (limitValue) {
        this.takeValue = limitValue;
        return this;
      },

      search: function (searchTerm) {
        if (searchTerm) {
          // We need to search in the related serviceComponent fields
          this.whereConditions = {
            ...this.whereConditions,
            serviceComponent: {
              OR: [
                { name: { contains: searchTerm, mode: 'insensitive' } },
                { description: { contains: searchTerm, mode: 'insensitive' } },
              ],
            },
          };
        }
        return this;
      },

      count: async function () {
        try {
          return await this.model.count({
            where: this.whereConditions,
          });
        } catch (error) {
          if (error.code && error.code.startsWith('P')) {
            throw AppError.fromPrismaError(error);
          }
          throw error;
        }
      },

      findMany: async function () {
        try {
          return await this.model.findMany({
            where: this.whereConditions,
            orderBy: this.orderByConditions,
            ...(this.selectConditions && { select: this.selectConditions }),
            skip: this.skipValue,
            take: this.takeValue,
            include: {
              serviceComponent: true,
            },
          });
        } catch (error) {
          if (error.code && error.code.startsWith('P')) {
            throw AppError.fromPrismaError(error);
          }
          throw error;
        }
      },
    };

    // Apply API features
    const features = new APIFeatures(baseQuery, queryOptions);
    features.filter();

    if (queryOptions.search) {
      baseQuery.search(queryOptions.search);
    }

    features.sort().limitFieldsAdvanced();

    // Create a copy for counting before pagination is applied
    const countQuery = { ...features.query };

    // Apply pagination
    features.paginate();

    // Get total count before pagination for metadata
    const totalCount = await countQuery.count();

    // Execute the final query with all options applied
    const typeComponents = await features.query.findMany();

    // Calculate pagination metadata
    const page = parseInt(queryOptions.page, 10) || 1;
    const limit = parseInt(queryOptions.limit, 10) || 100;
    const totalPages = Math.ceil(totalCount / limit);

    logger.info({
      message: 'Components fetched successfully',
      metadata: {
        serviceTypeId,
        count: typeComponents.length,
        totalCount,
      },
    });

    // Return data with pagination metadata
    return {
      data: typeComponents,
      meta: {
        total: totalCount,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    };
  } catch (error) {
    logger.error({
      message: 'Error fetching components for service type',
      metadata: {
        serviceTypeId,
        error: error.response?.data?.message || error.message,
        code: error.code,
        stack: error.stack,
      },
    });

    if (
      error.response?.status === 404 ||
      (error instanceof AppError && error.statusCode === 404)
    ) {
      throw createNotFoundError(serviceTypeId, 'service type');
    }

    // Convert Prisma errors to AppErrors if not already done
    if (
      error.code &&
      error.code.startsWith('P') &&
      !(error instanceof AppError)
    ) {
      throw AppError.fromPrismaError(error);
    }

    // If this is not a known operational error, convert it to an internal server error
    if (!(error instanceof AppError)) {
      throw createInternalError(
        `Failed to fetch components for service type ID: ${serviceTypeId}: ${error.message}`,
      );
    }

    // Otherwise, rethrow the AppError for the global error handler
    throw error;
  }
};
// const getComponentsByTypeId = async (serviceTypeId) => {
//   try {
//     logger.info({
//       message: 'Fetching components associated with service type',
//       metadata: { serviceTypeId },
//     });

//     // Check if the service type exists - but don't throw an error if not found
//     const serviceType = await prisma.serviceType.findUnique({
//       where: { serviceTypeId },
//     });

//     if (!serviceType) {
//       logger.warn({
//         message:
//           'Service type not found in database - returning empty components list',
//         metadata: { serviceTypeId },
//       });
//       // Return empty array instead of throwing an error
//       return [];
//     }

//     // Find all type-component associations with their component details
//     const typeComponents = await prisma.serviceTypeComponent.findMany({
//       where: { serviceTypeId },
//       include: { serviceComponent: true },
//     });

//     logger.info({
//       message: 'Found type components',
//       metadata: { count: typeComponents.length },
//     });

//     if (typeComponents.length === 0) {
//       return [];
//     }

//     // Map the response to the expected format, handling null values safely
//     const components = typeComponents.map((typeComponent) => {
//       // Check if serviceComponent exists before accessing its properties
//       if (!typeComponent.serviceComponent) {
//         return {
//           id: typeComponent.serviceTypeComponentId,
//           serviceTypeId: typeComponent.serviceTypeId,
//           serviceComponentId: typeComponent.serviceComponentId,
//           isDefault: typeComponent.isDefault,
//           isRequired: typeComponent.isRequired,
//           additionalPrice: typeComponent.additionalPrice,
//           component: null,
//         };
//       }

//       return {
//         id: typeComponent.serviceTypeComponentId,
//         serviceTypeId: typeComponent.serviceTypeId,
//         serviceComponentId: typeComponent.serviceComponentId,
//         isDefault: typeComponent.isDefault,
//         isRequired: typeComponent.isRequired,
//         additionalPrice: typeComponent.additionalPrice,
//         component: {
//           id: typeComponent.serviceComponent.serviceComponentId,
//           name: typeComponent.serviceComponent.name,
//           description: typeComponent.serviceComponent.description,
//           estimatedDuration: typeComponent.serviceComponent.estimatedDuration,
//           vehicleType: typeComponent.serviceComponent.vehicleType,
//         },
//       };
//     });

//     return components;
//   } catch (error) {
//     logger.error({
//       message: 'Error fetching components for service type',
//       metadata: {
//         serviceTypeId,
//         error: error.message,
//         stack: error.stack,
//       },
//     });

//     // Return empty array instead of throwing error
//     // This way the API will return 200 with empty data instead of 500
//     return [];
//   }
// };

// Remove a component from a service type

const removeComponentFromType = async (serviceTypeId, serviceComponentId) => {
  try {
    logger.info({
      message: 'Forwarding component removal request to injection service',
      metadata: { serviceTypeId, serviceComponentId },
    });

    await axios.delete(
      `${INJECTION_SERVICE_URL}/api/v1/types/${serviceTypeId}/components/${serviceComponentId}`,
    );

    logger.info({
      message: 'Component successfully removed from service type',
      metadata: { serviceTypeId, serviceComponentId },
    });

    return true;
  } catch (error) {
    logger.error({
      message: 'Error removing component from service type',
      metadata: {
        serviceTypeId,
        serviceComponentId,
        error: error.response?.data?.message || error.message,
        stack: error.stack,
      },
    });

    if (error.response?.status === 404) {
      throw createNotFoundError(
        serviceComponentId,
        `component association with service type ${serviceTypeId}`,
      );
    }

    throw createInternalError(
      error.response?.data?.message ||
        `Failed to remove component ${serviceComponentId} from service type ${serviceTypeId}`,
    );
  }
};

module.exports = {
  createServiceType,
  getServiceTypeById,
  updateServiceType,
  getServiceTypesByCategoryId,
  deleteServiceType,
  associateComponentWithType,
  getComponentsByTypeId,
  removeComponentFromType,
};
