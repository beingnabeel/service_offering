// src/middlewares/__tests__/requestIdMiddleware.test.js
const requestIdMiddleware = require('../requestIdMiddleware');

// Use a more direct mocking approach
jest.mock('uuid', () => {
  return {
    v4: () => 'mocked-uuid-v4',
  };
});

// Alternative approach in case the above doesn't work
// jest.spyOn(require('uuid'), 'v4').mockReturnValue('mocked-uuid-v4');

// Mock console.log
const originalConsoleLog = console.log;
console.log = jest.fn();

describe('requestIdMiddleware', () => {
  let req;
  let res;
  let next;
  let finishCallback;

  beforeEach(() => {
    // Reset global requestId
    global.requestId = undefined;

    // Mock request and response objects
    req = {
      method: 'GET',
      originalUrl: '/test',
    };

    finishCallback = null;
    res = {
      setHeader: jest.fn(),
      on: jest.fn().mockImplementation((event, callback) => {
        if (event === 'finish') {
          finishCallback = callback;
        }
      }),
    };

    next = jest.fn();

    // Clear mocks
    jest.clearAllMocks();
  });

  afterAll(() => {
    // Restore console.log
    console.log = originalConsoleLog;
  });

  it('should generate a unique request ID and attach it to the request', () => {
    // Let's log the actual value just to debug
    const originalUuid = require('uuid');
    console.log('Debug: UUID mock value:', originalUuid.v4());

    requestIdMiddleware(req, res, next);

    // Debug output
    console.log('Debug: req.requestId =', req.requestId);
    console.log('Debug: global.requestId =', global.requestId);

    expect(req.requestId).toBe('mocked-uuid-v4');
    expect(global.requestId).toBe('mocked-uuid-v4');
    expect(res.setHeader).toHaveBeenCalledWith(
      'X-Request-ID',
      'mocked-uuid-v4',
    );
    expect(console.log).toHaveBeenCalledWith('[mocked-uuid-v4] GET /test');
    expect(next).toHaveBeenCalled();
  });

  it('should clean up global requestId after response finishes', () => {
    requestIdMiddleware(req, res, next);

    // Simulate response finish event
    if (finishCallback) {
      finishCallback();
    }

    expect(global.requestId).toBeNull();
  });
});
