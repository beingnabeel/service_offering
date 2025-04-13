/**
 * Global Error Handler Controller
 * Centralized error handling with specific handlers for different error types
 */

// Import Prisma error types from the correct location based on version compatibility
const { Prisma } = require('@prisma/client');
const PrismaClientKnownRequestError = Prisma.PrismaClientKnownRequestError;
const PrismaClientValidationError = Prisma.PrismaClientValidationError;
const AppError = require('../utils/appError');
const { formatError, formatAppError, formatPrismaError, formatJoiError } = require('../utils/responseFormatter');
const { logger } = require('../utils/logger');

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
        meta: err.meta
      },
      request: {
        method: req.method,
        url: req.originalUrl,
        query: req.query,
        params: req.params,
        requestId: req.requestId
      }
    }
  });

  // Format and send the response
  res.status(err instanceof PrismaClientValidationError ? 400 : 500).json(formatPrismaError(err));
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
        stack: err.stack
      },
      request: {
        method: req.method,
        url: req.originalUrl,
        body: req.body,
        requestId: req.requestId
      }
    }
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
        stack: err.stack
      },
      request: {
        method: req.method,
        url: req.originalUrl,
        requestId: req.requestId
      }
    }
  });

  // Format and send the response
  res.status(401).json(
    formatError('Invalid token. Please log in again!', 401, 'INVALID_TOKEN')
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
        expiredAt: err.expiredAt
      },
      request: {
        method: req.method,
        url: req.originalUrl,
        requestId: req.requestId
      }
    }
  });

  // Format and send the response
  res.status(401).json(
    formatError('Your token has expired. Please log in again.', 401, 'EXPIRED_TOKEN')
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
        isOperational: err.isOperational
      },
      request: {
        method: req.method,
        url: req.originalUrl,
        query: req.query,
        params: req.params,
        body: req.method !== 'GET' ? req.body : undefined,
        requestId: req.requestId
      }
    }
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
        stack: err.stack
      },
      request: {
        method: req.method,
        url: req.originalUrl,
        query: req.query,
        params: req.params,
        body: req.method !== 'GET' ? req.body : undefined,
        requestId: req.requestId
      }
    }
  });

  // In development, send detailed error
  if (process.env.NODE_ENV === 'development') {
    res.status(500).json({
      success: false,
      message: err.message,
      stack: err.stack,
      error: err,
      timestamp: new Date().toISOString(),
      requestId: req.requestId
    });
  } else {
    // In production, send generic error
    res.status(500).json(
      formatError('Something went wrong', 500, 'INTERNAL_ERROR')
    );
  }
};

/**
 * Global error handling middleware for Express
 */
module.exports = (err, req, res, next) => {
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
