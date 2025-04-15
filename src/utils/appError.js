/**
 * Custom Error Class for Application Errors
 * Provides structured error handling and classification
 */
class AppError extends Error {
  /**
   * Create a new AppError instance
   * @param {string} message - Error message
   * @param {number} statusCode - HTTP status code
   * @param {string|null} errorCode - Custom error code for better identification
   * @param {Object|null} details - Additional error details (e.g., validation errors)
   */
  constructor(message, statusCode = 500, errorCode = null, details = null) {
    super(message);

    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true; // Indicates if this is a known operational error
    this.code = errorCode;
    this.details = details;
    this.timestamp = new Date().toISOString();

    // Add request ID if available for request tracking
    if (global.requestId) {
      this.requestId = global.requestId;
    }

    Error.captureStackTrace(this, this.constructor);
  }

  /**
   * Convert error to JSON format for response
   * @returns {Object} JSON representation of the error
   */
  toJSON() {
    return {
      message: this.message,
      statusCode: this.statusCode,
      status: this.status,
      code: this.code,
      details: this.details,
      timestamp: this.timestamp,
      requestId: this.requestId,
      isOperational: this.isOperational,
    };
  }

  /**
   * Create a 400 Bad Request error
   * @param {string} message - Error message
   * @param {string|null} code - Error code
   * @param {Object|null} details - Error details
   * @returns {AppError} AppError instance
   */
  static badRequest(
    message = 'Bad request',
    code = 'BAD_REQUEST',
    details = null,
  ) {
    return new AppError(message, 400, code, details);
  }

  /**
   * Create a 401 Unauthorized error
   * @param {string} message - Error message
   * @param {string|null} code - Error code
   * @returns {AppError} AppError instance
   */
  static unauthorized(message = 'Unauthorized', code = 'UNAUTHORIZED') {
    return new AppError(message, 401, code);
  }

  /**
   * Create a 403 Forbidden error
   * @param {string} message - Error message
   * @param {string|null} code - Error code
   * @returns {AppError} AppError instance
   */
  static forbidden(message = 'Forbidden', code = 'FORBIDDEN') {
    return new AppError(message, 403, code);
  }

  /**
   * Create a 404 Not Found error
   * @param {string} message - Error message
   * @param {string|null} code - Error code
   * @returns {AppError} AppError instance
   */
  static notFound(message = 'Resource not found', code = 'NOT_FOUND') {
    return new AppError(message, 404, code);
  }

  /**
   * Create a 409 Conflict error
   * @param {string} message - Error message
   * @param {string|null} code - Error code
   * @returns {AppError} AppError instance
   */
  static conflict(message = 'Resource conflict', code = 'CONFLICT') {
    return new AppError(message, 409, code);
  }

  /**
   * Create a 422 Unprocessable Entity error (for validation errors)
   * @param {string} message - Error message
   * @param {Object} errors - Validation errors
   * @returns {AppError} AppError instance
   */
  static validationError(message = 'Validation failed', errors = null) {
    return new AppError(message, 422, 'VALIDATION_ERROR', errors);
  }

  /**
   * Create a 500 Internal Server Error
   * @param {string} message - Error message
   * @param {string|null} code - Error code
   * @returns {AppError} AppError instance
   */
  static internal(message = 'Internal server error', code = 'INTERNAL_ERROR') {
    return new AppError(message, 500, code);
  }

  /**
   * Create an appropriate error from a Prisma error
   * @param {Error} error - Prisma error
   * @returns {AppError} AppError instance
   */
  static fromPrismaError(error) {
    // Default error is internal server error
    let appError = AppError.internal('Database operation failed');

    // Extract error code and message if available
    const prismaErrorCode = error.code;
    const meta = error.meta || {};

    // Handle specific Prisma error codes
    switch (prismaErrorCode) {
      case 'P2002': // Unique constraint violation
        appError = AppError.conflict(
          `A record with this ${meta.target?.join(', ')} already exists`,
          'UNIQUE_CONSTRAINT_VIOLATION',
          { fields: meta.target },
        );
        break;

      case 'P2003': // Foreign key constraint violation
        appError = AppError.badRequest(
          `Invalid relation: ${meta.field_name}`,
          'FOREIGN_KEY_VIOLATION',
          { field: meta.field_name },
        );
        break;

      case 'P2025': // Record not found
        appError = AppError.notFound(
          meta.cause || 'Record not found',
          'RECORD_NOT_FOUND',
        );
        break;

      case 'P2014': // Required relation violation
        appError = AppError.badRequest(
          `Required relation violation: ${meta.relation_name}`,
          'REQUIRED_RELATION_VIOLATION',
          { relation: meta.relation_name },
        );
        break;

      case 'P2021': // Table does not exist
        appError = AppError.internal(
          `Table does not exist: ${meta.table}`,
          'TABLE_NOT_FOUND',
        );
        break;

      case 'P2022': // Column does not exist
        appError = AppError.internal(
          `Column does not exist: ${meta.column}`,
          'COLUMN_NOT_FOUND',
          { column: meta.column },
        );
        break;

      case 'P2023': // Inconsistent column data
        appError = AppError.badRequest(
          `Invalid input data for ${meta.column || 'a column'}`,
          'INVALID_COLUMN_DATA',
          { column: meta.column },
        );
        break;

      // Add more Prisma error codes as needed

      default:
        // For unknown Prisma errors, maintain internal server error status
        appError.message = `Database error: ${error.message}`;
        appError.code = prismaErrorCode || 'DATABASE_ERROR';
        appError.details = meta;
        break;
    }

    return appError;
  }
}

module.exports = AppError;
