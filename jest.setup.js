// jest.setup.js

// Set up environment variables for testing
process.env.NODE_ENV = 'test';
process.env.PORT = '5000';
process.env.CORS_ORIGIN = 'http://localhost:8085';
process.env.AWS_ACCESS_KEY_ID = 'test-key-id';
process.env.AWS_SECRET_ACCESS_KEY = 'test-secret-key';
process.env.AWS_REGION = 'test-region';
process.env.AWS_S3_BUCKET_NAME = 'test-bucket';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test_db';
process.env.INJECTION_SERVICE_URL = 'http://localhost:5001';

// Silence console logs during tests
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Mock global.requestId for testing
global.requestId = 'test-request-id';
