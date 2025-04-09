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
    timestamp: new Date().toISOString()
  };
};

/**
 * Format an error response
 * @param {string} message - Error message
 * @param {number} statusCode - HTTP status code
 * @param {Object} errors - Detailed errors (optional)
 * @returns {Object} Formatted error response
 */
const formatError = (message = 'An error occurred', statusCode = 500, errors = null) => {
  return {
    success: false,
    message,
    statusCode,
    errors,
    timestamp: new Date().toISOString()
  };
};

/**
 * Format a validation error response
 * @param {Object} errors - Validation errors
 * @param {string} message - Error message
 * @returns {Object} Formatted validation error response
 */
const formatValidationError = (errors, message = 'Validation failed') => {
  return formatError(message, 400, errors);
};

module.exports = {
  formatSuccess,
  formatError,
  formatValidationError
};
