// src/utils/__tests__/responseFormatter.test.js
const {
  formatSuccess,
  formatError,
  formatAppError,
  formatPrismaError,
  formatJoiError,
} = require('../responseFormatter');
const AppError = require('../appError');
const { Prisma } = require('@prisma/client');

// Mock AppError.fromPrismaError
jest.mock('../appError', () => {
  const originalModule = jest.requireActual('../appError');
  return {
    ...originalModule,
    fromPrismaError: jest.fn().mockImplementation(() => {
      // Return a proper AppError instance instead of an incomplete object
      return new originalModule('Mocked Prisma Error', 400, 'DB_ERROR');
    }),
  };
});

describe('responseFormatter', () => {
  beforeEach(() => {
    global.requestId = 'test-request-id';
    jest.clearAllMocks();
  });

  describe('formatSuccess', () => {
    it('should format a success response with default values', () => {
      const response = formatSuccess();

      expect(response).toEqual({
        success: true,
        message: 'Success',
        statusCode: 200,
        data: {},
        timestamp: expect.any(String),
        requestId: 'test-request-id',
      });
    });

    it('should format a success response with custom values', () => {
      const data = { id: 1, name: 'Test' };
      const response = formatSuccess(data, 'Custom message', 201);

      expect(response).toEqual({
        success: true,
        message: 'Custom message',
        statusCode: 201,
        data,
        timestamp: expect.any(String),
        requestId: 'test-request-id',
      });
    });
  });

  describe('formatError', () => {
    it('should format an error response with default values', () => {
      const response = formatError();

      expect(response).toEqual({
        success: false,
        message: 'An error occurred',
        statusCode: 500,
        code: 'INTERNAL_ERROR',
        details: null,
        timestamp: expect.any(String),
        requestId: 'test-request-id',
      });
    });

    it('should format an error response with custom values', () => {
      const details = { field: 'Invalid value' };
      const response = formatError(
        'Custom error',
        400,
        'CUSTOM_ERROR',
        details,
      );

      expect(response).toEqual({
        success: false,
        message: 'Custom error',
        statusCode: 400,
        code: 'CUSTOM_ERROR',
        details,
        timestamp: expect.any(String),
        requestId: 'test-request-id',
      });
    });
  });

  describe('formatAppError', () => {
    it('should format an AppError instance', () => {
      // Don't use the mocked AppError directly - create a plain object with the same shape
      const appError = {
        message: 'App error',
        statusCode: 403,
        code: 'FORBIDDEN',
        details: { reason: 'Unauthorized' },
        requestId: 'app-error-id',
      };

      const response = formatAppError(appError);

      expect(response).toEqual({
        success: false,
        message: 'App error',
        statusCode: 403,
        code: 'FORBIDDEN',
        details: { reason: 'Unauthorized' },
        timestamp: expect.any(String),
        requestId: 'test-request-id',
      });
    });
  });

  describe('formatPrismaError', () => {
    it('should convert a Prisma error to an AppError and format it', () => {
      const prismaError = new Prisma.PrismaClientKnownRequestError(
        'Unique constraint failed',
        { code: 'P2002', meta: { target: ['name'] }, clientVersion: '2.0.0' },
      );

      // Create a realistic mock return value for fromPrismaError
      AppError.fromPrismaError.mockReturnValue({
        message: 'Mocked Prisma Error',
        statusCode: 400,
        code: 'DB_ERROR',
        details: null,
      });

      const response = formatPrismaError(prismaError);

      expect(AppError.fromPrismaError).toHaveBeenCalledWith(prismaError);
      expect(response).toEqual({
        success: false,
        message: 'Mocked Prisma Error',
        statusCode: 400,
        code: 'DB_ERROR',
        details: null,
        timestamp: expect.any(String),
        requestId: 'test-request-id',
      });
    });
  });

  describe('formatJoiError', () => {
    it('should format a Joi validation error', () => {
      const joiError = {
        details: [
          {
            message: 'Field is required',
            path: ['field1'],
            type: 'any.required',
          },
          {
            message: 'Field is invalid',
            path: ['field2'],
            type: 'string.pattern',
          },
        ],
      };

      const response = formatJoiError(joiError);

      expect(response).toEqual({
        success: false,
        message: 'Validation failed',
        statusCode: 422,
        code: 'VALIDATION_ERROR',
        details: [
          {
            message: 'Field is required',
            path: ['field1'],
            type: 'any.required',
          },
          {
            message: 'Field is invalid',
            path: ['field2'],
            type: 'string.pattern',
          },
        ],
        timestamp: expect.any(String),
        requestId: 'test-request-id',
      });
    });

    it('should handle Joi errors without details', () => {
      const joiError = {};

      const response = formatJoiError(joiError);

      expect(response).toEqual({
        success: false,
        message: 'Validation failed',
        statusCode: 422,
        code: 'VALIDATION_ERROR',
        details: null,
        timestamp: expect.any(String),
        requestId: 'test-request-id',
      });
    });
  });
});
