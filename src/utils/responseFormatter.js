/**
 * Response formatter utility for standardizing API responses
 */

/**
 * Format a success response
 * @param {Object} data - Response data
 * @param {string} message - Success message
 * @param {number} statusCode - HTTP status code
 * @returns {Object} Formatted success response
 */
const formatSuccess = (data = {}, message = 'Success', statusCode = 200) => {
  return {
    success: true,
    message,
    statusCode,
    data,
    timestamp: new Date().toISOString(),
    requestId: global.requestId || null
  };
};

/**
 * Format an error response
 * @param {string} message - Error message
 * @param {number} statusCode - HTTP status code
 * @param {string} errorCode - Error code for better identification
 * @param {Object} details - Detailed error information
 * @returns {Object} Formatted error response
 */
const formatError = (
  message = 'An error occurred', 
  statusCode = 500, 
  errorCode = 'INTERNAL_ERROR',
  details = null
) => {
  return {
    success: false,
    message,
    statusCode,
    code: errorCode,
    details,
    timestamp: new Date().toISOString(),
    requestId: global.requestId || null
  };
};

/**
 * Format a validation error response
 * @param {Object} errors - Validation errors
 * @param {string} message - Error message
 * @returns {Object} Formatted validation error response
 */
const formatValidationError = (errors, message = 'Validation failed') => {
  return formatError(message, 422, 'VALIDATION_ERROR', errors);
};

/**
 * Format an AppError instance for response
 * @param {AppError} error - AppError instance
 * @returns {Object} Formatted error response
 */
const formatAppError = (error) => {
  return formatError(
    error.message,
    error.statusCode,
    error.code,
    error.details
  );
};

/**
 * Format a Prisma error for response
 * @param {Error} error - Prisma error
 * @returns {Object} Formatted error response
 */
const formatPrismaError = (error) => {
  const AppError = require('./appError');
  const appError = AppError.fromPrismaError(error);
  return formatAppError(appError);
};

/**
 * Format a Joi validation error for response
 * @param {Error} error - Joi validation error
 * @returns {Object} Formatted validation error response
 */
const formatJoiError = (error) => {
  const details = error.details ? error.details.map(detail => ({
    message: detail.message,
    path: detail.path,
    type: detail.type
  })) : null;
  
  return formatError(
    'Validation failed', 
    422, 
    'VALIDATION_ERROR',
    details
  );
};

module.exports = {
  formatSuccess,
  formatError,
  formatValidationError,
  formatAppError,
  formatPrismaError,
  formatJoiError
};
