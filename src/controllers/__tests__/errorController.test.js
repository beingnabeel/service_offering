// src/controllers/__tests__/errorController.test.js
const { Prisma } = require('@prisma/client');
const errorController = require('../errorController');
const AppError = require('../../utils/appError');
const responseFormatter = require('../../utils/responseFormatter');
const { logger } = require('../../utils/logger');

// Mock dependencies
jest.mock('../../utils/responseFormatter');
jest.mock('../../utils/logger', () => ({
  logger: {
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
  },
}));

// Mock the Prisma error classes
const mockPrismaError = new Error('Prisma error');
mockPrismaError.code = 'P2002'; // Unique constraint violation
mockPrismaError.meta = { target: ['name'] };

// Create a function to reset all mocks before each test
beforeEach(() => {
  jest.clearAllMocks();
  // Reset formatters
  responseFormatter.formatError.mockImplementation((message, statusCode, code) => ({
    success: false,
    message,
    statusCode,
    code,
  }));
  responseFormatter.formatAppError.mockImplementation((err) => ({
    success: false,
    message: err.message,
    statusCode: err.statusCode,
    code: err.code,
    details: err.details,
  }));
  responseFormatter.formatPrismaError.mockImplementation((err) => ({
    success: false,
    message: 'Database operation failed',
    statusCode: 400,
    code: 'DATABASE_ERROR',
    details: { originalError: err.message },
  }));
  responseFormatter.formatJoiError.mockImplementation((err) => ({
    success: false,
    message: 'Validation failed',
    statusCode: 422,
    code: 'VALIDATION_ERROR',
    details: err.details,
  }));
});

describe('Error Factory Functions', () => {
  describe('createInvalidIdError', () => {
    it('should create an invalid ID error with default resource type', () => {
      const error = errorController.createInvalidIdError('invalid-id');
      
      expect(error).toBeInstanceOf(AppError);
      expect(error.message).toBe('Invalid resource ID format');
      expect(error.statusCode).toBe(400);
      expect(error.code).toBe('INVALID_ID_FORMAT');
      expect(error.details).toEqual({
        id: 'ID must be a valid UUID',
        providedValue: 'invalid-id',
      });
    });

    it('should create an invalid ID error with custom resource type', () => {
      const error = errorController.createInvalidIdError('invalid-id', 'service component');
      
      expect(error).toBeInstanceOf(AppError);
      expect(error.message).toBe('Invalid service component ID format');
      expect(error.statusCode).toBe(400);
      expect(error.code).toBe('INVALID_ID_FORMAT');
    });
  });

  describe('createNotFoundError', () => {
    it('should create a not found error with default resource type', () => {
      const error = errorController.createNotFoundError('12345678-1234-1234-1234-123456789012');
      
      expect(error).toBeInstanceOf(AppError);
      expect(error.message).toBe('resource not found');
      expect(error.statusCode).toBe(404);
      expect(error.code).toBe('RESOURCE_NOT_FOUND');
      expect(error.details).toEqual({
        id: 'No resource exists with ID: 12345678-1234-1234-1234-123456789012',
      });
    });

    it('should create a not found error with custom resource type', () => {
      const error = errorController.createNotFoundError(
        '12345678-1234-1234-1234-123456789012',
        'service type'
      );
      
      expect(error).toBeInstanceOf(AppError);
      expect(error.message).toBe('service type not found');
      expect(error.statusCode).toBe(404);
      expect(error.code).toBe('RESOURCE_NOT_FOUND');
      expect(error.details).toEqual({
        id: 'No service type exists with ID: 12345678-1234-1234-1234-123456789012',
      });
    });
  });

  describe('createUnauthorizedError', () => {
    it('should create an unauthorized error with default message', () => {
      const error = errorController.createUnauthorizedError();
      
      expect(error).toBeInstanceOf(AppError);
      expect(error.message).toBe('Unauthorized access');
      expect(error.statusCode).toBe(401);
      expect(error.code).toBe('UNAUTHORIZED');
    });

    it('should create an unauthorized error with custom message', () => {
      const error = errorController.createUnauthorizedError('Invalid credentials');
      
      expect(error).toBeInstanceOf(AppError);
      expect(error.message).toBe('Invalid credentials');
      expect(error.statusCode).toBe(401);
      expect(error.code).toBe('UNAUTHORIZED');
    });
  });

  describe('createForbiddenError', () => {
    it('should create a forbidden error with default message', () => {
      const error = errorController.createForbiddenError();
      
      expect(error).toBeInstanceOf(AppError);
      expect(error.message).toBe('Forbidden access');
      expect(error.statusCode).toBe(403);
      expect(error.code).toBe('FORBIDDEN');
    });

    it('should create a forbidden error with custom message', () => {
      const error = errorController.createForbiddenError('Insufficient permissions');
      
      expect(error).toBeInstanceOf(AppError);
      expect(error.message).toBe('Insufficient permissions');
      expect(error.statusCode).toBe(403);
      expect(error.code).toBe('FORBIDDEN');
    });
  });

  describe('createValidationError', () => {
    it('should create a validation error with provided details', () => {
      const validationErrors = {
        name: 'Name is required',
        price: 'Price must be a positive number',
      };
      
      const error = errorController.createValidationError(validationErrors);
      
      expect(error).toBeInstanceOf(AppError);
      expect(error.message).toBe('Validation failed');
      expect(error.statusCode).toBe(422);
      expect(error.code).toBe('VALIDATION_ERROR');
      expect(error.details).toEqual(validationErrors);
    });
  });

  describe('createDuplicateError', () => {
    it('should create a duplicate error with default resource type', () => {
      const error = errorController.createDuplicateError('name', 'Test Name');
      
      expect(error).toBeInstanceOf(AppError);
      expect(error.message).toBe('resource already exists with this name');
      expect(error.statusCode).toBe(409);
      expect(error.code).toBe('DUPLICATE_RESOURCE');
      expect(error.details).toEqual({
        name: "A resource with name 'Test Name' already exists",
      });
    });

    it('should create a duplicate error with custom resource type', () => {
      const error = errorController.createDuplicateError('email', 'test@example.com', 'user');
      
      expect(error).toBeInstanceOf(AppError);
      expect(error.message).toBe('user already exists with this email');
      expect(error.statusCode).toBe(409);
      expect(error.code).toBe('DUPLICATE_RESOURCE');
      expect(error.details).toEqual({
        email: "A user with email 'test@example.com' already exists",
      });
    });
  });

  describe('createRateLimitError', () => {
    it('should create a rate limit error with default message', () => {
      const error = errorController.createRateLimitError();
      
      expect(error).toBeInstanceOf(AppError);
      expect(error.message).toBe('Rate limit exceeded');
      expect(error.statusCode).toBe(429);
      expect(error.code).toBe('RATE_LIMIT_EXCEEDED');
    });

    it('should create a rate limit error with custom message', () => {
      const error = errorController.createRateLimitError('Too many requests, please try again later');
      
      expect(error).toBeInstanceOf(AppError);
      expect(error.message).toBe('Too many requests, please try again later');
      expect(error.statusCode).toBe(429);
      expect(error.code).toBe('RATE_LIMIT_EXCEEDED');
    });
  });

  describe('createInternalError', () => {
    it('should create an internal error with default message', () => {
      const error = errorController.createInternalError();
      
      expect(error).toBeInstanceOf(AppError);
      expect(error.message).toBe('Internal server error');
      expect(error.statusCode).toBe(500);
      expect(error.code).toBe('INTERNAL_ERROR');
    });

    it('should create an internal error with custom message', () => {
      const error = errorController.createInternalError('Unexpected database error');
      
      expect(error).toBeInstanceOf(AppError);
      expect(error.message).toBe('Unexpected database error');
      expect(error.statusCode).toBe(500);
      expect(error.code).toBe('INTERNAL_ERROR');
    });
  });
});

describe('Global Error Handler', () => {
  let req;
  let res;
  let next;

  beforeEach(() => {
    req = {
      method: 'GET',
      originalUrl: '/api/v1/test',
      query: { page: '1' },
      params: { id: '123' },
      body: {},
      requestId: 'test-request-id',
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    next = jest.fn();
  });

  it('should handle AppError correctly', () => {
    // Create a custom application error
    const appError = new AppError('Test error', 400);
    appError.code = 'TEST_ERROR';
    appError.details = { field: 'error details' };
    
    // Call the error handler
    errorController.handler(appError, req, res, next);
    
    // Check that the logger was called correctly
    expect(logger.error).toHaveBeenCalled();
    
    // Check that the response was formatted correctly
    expect(res.status).toHaveBeenCalledWith(400);
    expect(responseFormatter.formatAppError).toHaveBeenCalledWith(appError);
    expect(res.json).toHaveBeenCalled();
  });

  it('should handle Prisma errors correctly', () => {
    // Create a Prisma error and ensure it's recognized as one
    const prismaError = new Error('Unique constraint failed');
    prismaError.code = 'P2002';
    prismaError.meta = { target: ['email'] };
    Object.setPrototypeOf(prismaError, Prisma.PrismaClientKnownRequestError.prototype);
    
    // Call the error handler
    errorController.handler(prismaError, req, res, next);
    
    // Check that the logger was called correctly
    expect(logger.error).toHaveBeenCalled();
    
    // Check that the response was formatted correctly
    expect(res.status).toHaveBeenCalledWith(500);  // The actual implementation uses 500 for Prisma errors
    expect(responseFormatter.formatPrismaError).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalled();
  });

  it('should handle Joi validation errors correctly', () => {
    // Create a Joi-like validation error
    const joiError = new Error('Validation failed');
    joiError.isJoi = true;
    joiError.details = [
      { message: 'Field is required', path: ['name'] },
      { message: 'Invalid value', path: ['email'] },
    ];
    
    // Call the error handler
    errorController.handler(joiError, req, res, next);
    
    // Check that the logger was called correctly
    expect(logger.error).toHaveBeenCalled();
    
    // Check that the response was formatted correctly
    expect(res.status).toHaveBeenCalledWith(422);
    expect(responseFormatter.formatJoiError).toHaveBeenCalledWith(joiError);
    expect(res.json).toHaveBeenCalled();
  });

  it('should handle JWT errors correctly', () => {
    // Create a JWT error
    const jwtError = new Error('Invalid token');
    jwtError.name = 'JsonWebTokenError';
    
    // Call the error handler
    errorController.handler(jwtError, req, res, next);
    
    // Check that the logger was called correctly
    expect(logger.error).toHaveBeenCalled();
    
    // Check that the response was formatted correctly
    expect(res.status).toHaveBeenCalledWith(401);
    expect(responseFormatter.formatError).toHaveBeenCalledWith(
      'Invalid token. Please log in again!',
      401,
      'INVALID_TOKEN'
    );
    expect(res.json).toHaveBeenCalled();
  });

  it('should handle JWT expired errors correctly', () => {
    // Create a JWT expired error
    const jwtExpiredError = new Error('Token expired');
    jwtExpiredError.name = 'TokenExpiredError';
    jwtExpiredError.expiredAt = new Date();
    
    // Call the error handler
    errorController.handler(jwtExpiredError, req, res, next);
    
    // Check that the logger was called correctly
    expect(logger.error).toHaveBeenCalled();
    
    // Check that the response was formatted correctly
    expect(res.status).toHaveBeenCalledWith(401);
    expect(responseFormatter.formatError).toHaveBeenCalledWith(
      'Your token has expired. Please log in again.',
      401,
      'EXPIRED_TOKEN'
    );
    expect(res.json).toHaveBeenCalled();
  });

  it('should handle unknown errors in development mode', () => {
    // Save original NODE_ENV and set to development
    const originalNodeEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';
    
    // Create a generic error
    const unknownError = new Error('Something went wrong');
    
    // Call the error handler
    errorController.handler(unknownError, req, res, next);
    
    // Check that the logger was called correctly
    expect(logger.error).toHaveBeenCalled();
    
    // In development, detailed error information should be returned
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalled();
    expect(res.json.mock.calls[0][0]).toHaveProperty('stack');
    expect(res.json.mock.calls[0][0]).toHaveProperty('error');
    
    // Restore original NODE_ENV
    process.env.NODE_ENV = originalNodeEnv;
  });

  it('should handle unknown errors in production mode', () => {
    // Save original NODE_ENV and set to production
    const originalNodeEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';
    
    // Create a generic error
    const unknownError = new Error('Something went wrong');
    
    // Call the error handler
    errorController.handler(unknownError, req, res, next);
    
    // Check that the logger was called correctly
    expect(logger.error).toHaveBeenCalled();
    
    // In production, generic error message should be returned
    expect(res.status).toHaveBeenCalledWith(500);
    expect(responseFormatter.formatError).toHaveBeenCalledWith(
      'Something went wrong',
      500,
      'INTERNAL_ERROR'
    );
    expect(res.json).toHaveBeenCalled();
    
    // Restore original NODE_ENV
    process.env.NODE_ENV = originalNodeEnv;
  });
});
