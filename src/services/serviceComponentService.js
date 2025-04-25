const prisma = require('../models/index');
const AppError = require('../utils/appError');
const { logger } = require('../utils/logger');
const axios = require('axios');
const {
  createNotFoundError,
  createInternalError,
  createduplicateError,
} = require('../controllers/errorController');

const INJECTION_SERVICE_URL =
  process.env.INJECTION_SERVICE_URL || 'http://localhost:5001';

const createServiceComponent = async (categoryData) => {
  try {
    logger.info({
      message: 'Forwarding component creation request to injection service',
      metadata: { componentName: categoryData.name },
    });
    const response = await axios.post(
      `${INJECTION_SERVICE_URL}/api/v1/components`,
      categoryData,
    );
    const serviceComponent = response.data.data;
    logger.info({
      message: 'Service component created successfully via Injection Service',
      metadata: { serviceComponentId: serviceComponent.serviceComponentId },
    });
    return serviceComponent;
  } catch (error) {
    logger.error({
      message: 'Error creating service component via Injection Service',
      metadata: {
        error: error.response?.data?.message || error.message,
        stack: error.stack,
      },
    });
    throw createInternalError(
      error.response?.data?.message || 'Failed to create service component',
    );
  }
};

const getAllServiceComponents = async (queryOptions) => {
  try {
    const APIFeatures = require('../utils/apiFeatures');
    const ALLOWED_FILTER_FIELDS = [
      'name',
      'description',
      'estimatedDuration',
      'vehicleType',
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
      model: prisma.serviceComponent,
      whereConditions: {},
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
      skip: function (skipvalue) {
        this.skipValue = skipvalue;
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
    const serviceComponent = await features.query.findMany();
    //implementing pagination
    const page = parseInt(queryOptions.page, 10) || 1;
    const limit = parseInt(queryOptions.limit, 10) || 100;
    const totalPages = Math.ceil(totalCount / limit);
    logger.info({
      message: `Retrieved service components successfully`,
      metadata: { count: serviceComponent.length, totalCount },
    });
    return {
      data: serviceComponent,
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
      message: `Error retrieving service components`,
      metadata: {
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
        `Failed to retrieve service components: ${error.message}`,
      );
    }
    throw error;
  }
};

const getServiceComponentById = async (id) => {
  try {
    logger.info({
      message: 'Fetching service component by id',
      metadata: { componentId: id },
    });
    const serviceComponent = await prisma.serviceComponent.findUnique({
      where: { serviceComponentId: id },
    });
    if (!serviceComponent) {
      logger.warn({
        message: 'Service component not found',
        metadata: { componentId: id },
      });
      throw createNotFoundError(id, 'service component');
    }
    logger.info({
      message: 'Service component fetched successfully',
      metadata: { serviceComponentId: serviceComponent.serviceComponentId },
    });
    return serviceComponent;
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    logger.error({
      message: 'Error fetching service component by id',
      metadata: {
        error: error.message,
        code: error.code,
        stack: error.stack,
      },
    });
    throw createInternalError(
      error.response?.data?.message || 'Failed to fetch service component',
    );
  }
};

const updateServiceComponent = async (id, updateData) => {
  try {
    logger.info({
      message: 'Forwarding component update to injestion service',
      metadata: { componentId: id, updateData },
    });
    const response = await axios.patch(
      `${INJECTION_SERVICE_URL}/api/v1/components/${id}`,
      updateData,
    );
    const updatedComponent = response.data.data;
    logger.info({
      message: 'Service component updated successfully via Injection Service',
      metadata: { serviceComponentId: updatedComponent.serviceComponentId },
    });
    return updatedComponent;
  } catch (error) {
    logger.error({
      message: 'Error updating service component via Injection Service',
      metadata: {
        error: error.response?.data?.message || error.message,
        stack: error.stack,
      },
    });

    if (error.response?.status === 404) {
      throw createNotFoundError(id, 'service component');
    }

    throw createInternalError(
      error.response?.data?.message ||
        `Failed to update service component with ID: ${id}`,
    );
  }
};

const deleteServiceComponent = async (id) => {
  try {
    logger.info({
      message: 'Forwarding component deletion to injection service',
      metadata: { serviceComponentId: id },
    });
    await axios.delete(`${INJECTION_SERVICE_URL}/api/v1/components/${id}`);
    logger.info({
      message: 'Service component deleted successfully via Injection Service',
      metadata: { serviceComponentId: id },
    });
    return true;
  } catch (error) {
    logger.error({
      message: 'Error deleting service component via Injection Service',
      metadata: {
        error: error.response?.data?.message || error.message,
        stack: error.stack,
      },
    });
    if (error.response?.status === 404) {
      throw createNotFoundError(id, 'service component');
    } else if (error.response?.status === 400) {
      const validationError = new AppError(
        'Cannot delete service component with associated service types',
        400,
      );
      validationError.code = 'DEPENDENT_RESOURCES_EXIST';
      validationError.details = {
        message:
          'This service component has service types that must be deleted or reassigned first',
        serviceComponentId: id,
      };
      throw validationError;
    }
    throw createInternalError(
      error.response?.data?.message ||
        `Failed to delete service component with ID: ${id}`,
    );
  }
};

module.exports = {
  createServiceComponent,
  getAllServiceComponents,
  getServiceComponentById,
  updateServiceComponent,
  deleteServiceComponent,
};
