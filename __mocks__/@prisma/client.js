// __mocks__/@prisma/client.js

// Create a mock PrismaClient
const mockPrismaClient = {
  serviceCategory: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  },
  serviceType: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  },
};

// Mock Prisma error types
const PrismaClientKnownRequestError = class PrismaClientKnownRequestError extends Error {
  constructor(message, { code, meta, clientVersion }) {
    super(message);
    this.name = 'PrismaClientKnownRequestError';
    this.code = code;
    this.meta = meta;
    this.clientVersion = clientVersion;
  }
};

const PrismaClientValidationError = class PrismaClientValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'PrismaClientValidationError';
  }
};

// Export mocked Prisma
const Prisma = {
  PrismaClientKnownRequestError,
  PrismaClientValidationError,
};

module.exports = {
  PrismaClient: jest.fn(() => mockPrismaClient),
  Prisma,
};
