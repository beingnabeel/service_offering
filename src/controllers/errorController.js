/**
 * Global Error Handler Controller
 * Centralized error handling with specific handlers for different error types
 */

// Import Prisma error types from the correct location based on version compatibility
const { Prisma } = require('@prisma/client');
const PrismaClientKnownRequestError = Prisma.PrismaClientKnownRequestError;
const PrismaClientValidationError = Prisma.PrismaClientValidationError;
const AppError = require('../utils/appError');
const {
  formatError,
  formatAppError,
  formatPrismaError,
  formatJoiError,
} = require('../utils/responseFormatter');
const { logger } = require('../utils/logger');

/**
 * -----------------------------------------------
 * ERROR FACTORY FUNCTIONS
 * -----------------------------------------------
 * These functions create standardized error objects for common scenarios.
 * Use these throughout the application instead of creating AppError instances directly.
 */

/**
 * Create an invalid ID format error (400 Bad Request)
 * @param {string} id - The invalid ID that was provided
 * @param {string} resourceType - The type of resource (e.g., 'service type', 'category')
 * @returns {AppError} AppError instance with proper details
 */
const createInvalidIdError = (id, resourceType = 'resource') => {
  const error = new AppError(`Invalid ${resourceType} ID format`, 400);
  error.code = 'INVALID_ID_FORMAT';
  error.details = {
    id: 'ID must be a valid UUID',
    providedValue: id,
  };
  return error;
};

/**
 * Create a resource not found error (404 Not Found)
 * @param {string} id - The ID that was not found
 * @param {string} resourceType - The type of resource not found (e.g., 'service type', 'category')
 * @returns {AppError} AppError instance with proper details
 */
const createNotFoundError = (id, resourceType = 'resource') => {
  const error = new AppError(`${resourceType} not found`, 404);
  error.code = 'RESOURCE_NOT_FOUND';
  error.details = {
    id: `No ${resourceType} exists with ID: ${id}`,
  };
  return error;
};

/**
 * Create an unauthorized access error (401 Unauthorized)
 * @param {string} message - Optional custom message
 * @returns {AppError} AppError instance with proper details
 */
const createUnauthorizedError = (message = 'Unauthorized access') => {
  const error = new AppError(message, 401);
  error.code = 'UNAUTHORIZED';
  return error;
};

/**
 * Create a forbidden access error (403 Forbidden)
 * @param {string} message - Optional custom message
 * @returns {AppError} AppError instance with proper details
 */
const createForbiddenError = (message = 'Forbidden access') => {
  const error = new AppError(message, 403);
  error.code = 'FORBIDDEN';
  return error;
};

/**
 * Create a validation error for invalid input data (422 Unprocessable Entity)
 * @param {Object} validationErrors - Object containing field-specific validation errors
 * @returns {AppError} AppError instance with proper details
 */
const createValidationError = (validationErrors) => {
  const error = new AppError('Validation failed', 422);
  error.code = 'VALIDATION_ERROR';
  error.details = validationErrors;
  return error;
};

/**
 * Create a duplicate resource error (409 Conflict)
 * @param {string} field - The field that caused the conflict
 * @param {string} value - The value that already exists
 * @param {string} resourceType - The type of resource (e.g., 'service type', 'category')
 * @returns {AppError} AppError instance with proper details
 */
const createDuplicateError = (field, value, resourceType = 'resource') => {
  const error = new AppError(
    `${resourceType} already exists with this ${field}`,
    409,
  );
  error.code = 'DUPLICATE_RESOURCE';
  error.details = {
    [field]: `A ${resourceType} with ${field} '${value}' already exists`,
  };
  return error;
};

/**
 * Create a rate limit exceeded error (429 Too Many Requests)
 * @param {string} message - Optional custom message
 * @returns {AppError} AppError instance with proper details
 */
const createRateLimitError = (message = 'Rate limit exceeded') => {
  const error = new AppError(message, 429);
  error.code = 'RATE_LIMIT_EXCEEDED';
  return error;
};

/**
 * Create a generic internal server error (500 Internal Server Error)
 * @param {string} message - Optional custom message
 * @returns {AppError} AppError instance with proper details
 */
const createInternalError = (message = 'Internal server error') => {
  const error = new AppError(message, 500);
  error.code = 'INTERNAL_ERROR';
  return error;
};

/**
 * Handle errors from the Prisma ORM
 * @param {Error} err - The Prisma error
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const handlePrismaError = (err, req, res) => {
  logger.error({
    message: 'Prisma error occurred',
    metadata: {
      error: {
        name: err.name,
        code: err.code,
        message: err.message,
        stack: err.stack,
        meta: err.meta,
      },
      request: {
        method: req.method,
        url: req.originalUrl,
        query: req.query,
        params: req.params,
        requestId: req.requestId,
      },
    },
  });

  // Format and send the response
  res
    .status(err instanceof PrismaClientValidationError ? 400 : 500)
    .json(formatPrismaError(err));
};

/**
 * Handle validation errors from Joi
 * @param {Error} err - Joi validation error
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const handleJoiValidationError = (err, req, res) => {
  logger.error({
    message: 'Validation error occurred',
    metadata: {
      error: {
        name: err.name,
        details: err.details,
        message: err.message,
        stack: err.stack,
      },
      request: {
        method: req.method,
        url: req.originalUrl,
        body: req.body,
        requestId: req.requestId,
      },
    },
  });

  // Format and send the response
  res.status(422).json(formatJoiError(err));
};

/**
 * Handle JWT errors
 * @param {Error} err - JWT error
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const handleJWTError = (err, req, res) => {
  logger.error({
    message: 'JWT error occurred',
    metadata: {
      error: {
        name: err.name,
        message: err.message,
        stack: err.stack,
      },
      request: {
        method: req.method,
        url: req.originalUrl,
        requestId: req.requestId,
      },
    },
  });

  // Format and send the response
  res
    .status(401)
    .json(
      formatError('Invalid token. Please log in again!', 401, 'INVALID_TOKEN'),
    );
};

/**
 * Handle JWT expiration errors
 * @param {Error} err - JWT expiration error
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const handleJWTExpiredError = (err, req, res) => {
  logger.error({
    message: 'JWT expired error occurred',
    metadata: {
      error: {
        name: err.name,
        message: err.message,
        stack: err.stack,
        expiredAt: err.expiredAt,
      },
      request: {
        method: req.method,
        url: req.originalUrl,
        requestId: req.requestId,
      },
    },
  });

  // Format and send the response
  res
    .status(401)
    .json(
      formatError(
        'Your token has expired. Please log in again.',
        401,
        'EXPIRED_TOKEN',
      ),
    );
};

/**
 * Handle known operational errors (AppError instances)
 * @param {AppError} err - AppError instance
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const handleAppError = (err, req, res) => {
  logger.error({
    message: 'Application error occurred',
    metadata: {
      error: {
        name: err.name,
        message: err.message,
        statusCode: err.statusCode,
        status: err.status,
        code: err.code,
        details: err.details,
        stack: err.stack,
        isOperational: err.isOperational,
      },
      request: {
        method: req.method,
        url: req.originalUrl,
        query: req.query,
        params: req.params,
        body: req.method !== 'GET' ? req.body : undefined,
        requestId: req.requestId,
      },
    },
  });

  // Format and send the response
  res.status(err.statusCode).json(formatAppError(err));
};

/**
 * Handle unknown errors (developmental vs production handling)
 * @param {Error} err - Unknown error
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const handleUnknownError = (err, req, res) => {
  logger.error({
    message: 'Unknown error occurred',
    metadata: {
      error: {
        name: err.name,
        message: err.message,
        stack: err.stack,
      },
      request: {
        method: req.method,
        url: req.originalUrl,
        query: req.query,
        params: req.params,
        body: req.method !== 'GET' ? req.body : undefined,
        requestId: req.requestId,
      },
    },
  });

  // In development, send detailed error
  if (process.env.NODE_ENV === 'development') {
    res.status(500).json({
      success: false,
      message: err.message,
      stack: err.stack,
      error: err,
      timestamp: new Date().toISOString(),
      requestId: req.requestId,
    });
  } else {
    // In production, send generic error
    res
      .status(500)
      .json(formatError('Something went wrong', 500, 'INTERNAL_ERROR'));
  }
};

/**
 * Global error handling middleware for Express
 */
// Export the error handler as the default export
const globalErrorHandler = (err, req, res, next) => {
  // Make sure the response status is set
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  // Store requestId in the error if available
  if (req.requestId && !err.requestId) {
    err.requestId = req.requestId;
  }

  // Based on the error type, delegate to appropriate handler
  if (err instanceof AppError) {
    // Custom application error
    handleAppError(err, req, res);
  } else if (
    err instanceof PrismaClientKnownRequestError ||
    err instanceof PrismaClientValidationError
  ) {
    // Prisma database errors
    handlePrismaError(err, req, res);
  } else if (err.isJoi) {
    // Joi validation errors
    handleJoiValidationError(err, req, res);
  } else if (err.name === 'JsonWebTokenError') {
    // JWT errors
    handleJWTError(err, req, res);
  } else if (err.name === 'TokenExpiredError') {
    // JWT expiry errors
    handleJWTExpiredError(err, req, res);
  } else {
    // Unknown errors
    handleUnknownError(err, req, res);
  }
};

// Export the error handler and factory functions
module.exports = {
  // Main error handler middleware
  handler: globalErrorHandler,

  // Error factory functions
  createInvalidIdError,
  createNotFoundError,
  createUnauthorizedError,
  createForbiddenError,
  createValidationError,
  createDuplicateError,
  createRateLimitError,
  createInternalError,
};
