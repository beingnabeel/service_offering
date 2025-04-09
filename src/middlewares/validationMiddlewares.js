/**
 * Request validation middleware
 */

const { validationResult } = require('express-validator');
const { formatValidationError } = require('../utils/responseFormatter');

/**
 * Middleware to validate requests based on defined validation rules
 * @param {Array} validations - Array of validation rules
 * @returns {Function} Express middleware function
 */
const validate = (validations) => {
  return async (req, res, next) => {
    // Execute all validations
    await Promise.all(validations.map(validation => validation.run(req)));
    
    // Check if there are validation errors
    const errors = validationResult(req);
    if (errors.isEmpty()) {
      return next();
    }
    
    // Format validation errors
    const formattedErrors = {};
    errors.array().forEach(error => {
      formattedErrors[error.path] = error.msg;
    });
    
    // Send formatted validation error response
    return res.status(400).json(
      formatValidationError(formattedErrors, 'Validation failed')
    );
  };
};

module.exports = {
  validate
};
