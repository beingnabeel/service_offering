// src/utils/__tests__/catchAsync.test.js
const catchAsync = require('../catchAsync');
const { logger } = require('../logger');

// Mock logger
jest.mock('../logger', () => ({
  logger: {
    error: jest.fn(),
  },
}));

describe('catchAsync', () => {
  let req;
  let res;
  let next;

  beforeEach(() => {
    req = {
      method: 'GET',
      originalUrl: '/test',
      params: { id: '123' },
      query: { test: 'value' },
      requestId: 'test-request-id',
    };
    res = {};
    next = jest.fn();
    jest.clearAllMocks();
  });

  it('should call the provided function', async () => {
    const mockFn = jest.fn().mockResolvedValue('result');
    const wrappedFn = catchAsync(mockFn);

    await wrappedFn(req, res, next);

    expect(mockFn).toHaveBeenCalledWith(req, res, next);
    expect(next).not.toHaveBeenCalled();
  });

  it('should catch and log errors and call next with the error', async () => {
    const error = new Error('Test error');
    error.code = 'TEST_ERROR';
    const mockFn = jest.fn().mockRejectedValue(error);
    const wrappedFn = catchAsync(mockFn);

    await wrappedFn(req, res, next);

    expect(mockFn).toHaveBeenCalledWith(req, res, next);
    expect(logger.error).toHaveBeenCalledWith({
      message: 'Caught async error',
      metadata: {
        error: {
          name: 'Error',
          message: 'Test error',
          stack: expect.any(String),
          code: 'TEST_ERROR',
        },
        request: {
          method: 'GET',
          url: '/test',
          params: { id: '123' },
          query: { test: 'value' },
          requestId: 'test-request-id',
        },
      },
    });
    expect(next).toHaveBeenCalledWith(error);
  });
});
