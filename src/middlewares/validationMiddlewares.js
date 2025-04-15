const { validationResult } = require('express-validator');
const AppError = require('../utils/appError');
const { logger } = require('../utils/logger');

/**
 * Middleware to validate requests based on defined validation rules
 * @param {Array} validations - Array of validation rules
 * @returns {Function} Express middleware function
 */
const validate = (validations) => {
  return async (req, res, next) => {
    try {
      // Execute all validations
      await Promise.all(validations.map((validation) => validation.run(req)));

      // Check if there are validation errors
      const errors = validationResult(req);
      if (errors.isEmpty()) {
        return next();
      }

      // Format validation errors
      const formattedErrors = {};
      errors.array().forEach((error) => {
        // Group errors by field
        if (!formattedErrors[error.path]) {
          formattedErrors[error.path] = error.msg;
        } else if (Array.isArray(formattedErrors[error.path])) {
          formattedErrors[error.path].push(error.msg);
        } else {
          formattedErrors[error.path] = [
            formattedErrors[error.path],
            error.msg,
          ];
        }
      });

      // Log validation errors
      logger.warn({
        message: 'Validation error occurred',
        metadata: {
          validationErrors: formattedErrors,
          request: {
            method: req.method,
            url: req.originalUrl,
            body: req.method !== 'GET' ? req.body : undefined,
            requestId: req.requestId || 'unknown',
          },
        },
      });

      // Throw a validation error using our AppError class
      // This will be caught by the global error handler
      throw AppError.validationError('Validation failed', formattedErrors);
    } catch (error) {
      // If it's already an AppError instance, pass it to the next error handler
      if (error instanceof AppError) {
        return next(error);
      }

      // For other errors during validation, convert to an AppError
      logger.error({
        message: 'Error during validation',
        metadata: {
          error: {
            message: error.message,
            stack: error.stack,
          },
          request: {
            method: req.method,
            url: req.originalUrl,
            requestId: req.requestId || 'unknown',
          },
        },
      });

      return next(AppError.internal('Error processing validation'));
    }
  };
};

/**
 * Middleware to validate query parameters
 * @param {Object} schema - Joi schema for validation
 * @returns {Function} Express middleware function
 */
const validateQuery = (schema) => {
  return (req, res, next) => {
    try {
      const { error, value } = schema.validate(req.query, {
        abortEarly: false,
      });

      if (error) {
        const validationErrors = {};
        error.details.forEach((detail) => {
          const key = detail.path.join('.');
          if (!validationErrors[key]) {
            validationErrors[key] = detail.message;
          } else if (Array.isArray(validationErrors[key])) {
            validationErrors[key].push(detail.message);
          } else {
            validationErrors[key] = [validationErrors[key], detail.message];
          }
        });

        logger.warn({
          message: 'Query validation error',
          metadata: {
            validationErrors,
            request: {
              method: req.method,
              url: req.originalUrl,
              query: req.query,
              requestId: req.requestId || 'unknown',
            },
          },
        });

        throw AppError.validationError(
          'Query validation failed',
          validationErrors,
        );
      }

      // Replace req.query with validated and sanitized values
      req.query = value;
      return next();
    } catch (error) {
      // If it's already an AppError instance, pass it to the next error handler
      if (error instanceof AppError) {
        return next(error);
      }

      // For other errors during validation, convert to an AppError
      return next(AppError.internal('Error processing query validation'));
    }
  };
};

module.exports = {
  validate,
  validateQuery,
};
