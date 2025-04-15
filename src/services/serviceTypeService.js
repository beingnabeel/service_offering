// const prisma = require('../models/index');
const AppError = require('../utils/appError');
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
      throw new AppError(
        'A service type with this name and category already exists',
        409,
      );
    }

    throw new AppError(
      error.response?.data?.message || 'Failed to create service type',
      error.response?.status || 500,
    );
  }
};

module.exports = {
  createServiceType,
};
