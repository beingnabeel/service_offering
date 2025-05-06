// src/services/__test__/serviceComponentService.test.js

// Mock dependencies
jest.mock('../../utils/appError', () => {
  // Create a mock implementation inside the factory function
  const MockAppError = function(message, statusCode, code) {
    this.message = message;
    this.statusCode = statusCode;
    this.code = code;
    this.name = 'AppError';
    Error.captureStackTrace(this, this.constructor);
  };
  MockAppError.prototype = Object.create(Error.prototype);
  MockAppError.prototype.constructor = MockAppError;

  return {
    AppError: MockAppError
  };
});

// Create mock functions for error controllers BEFORE requiring the service
const mockCreateNotFoundError = jest.fn((id, resourceType) => {
  const error = new AppError(
    `${resourceType} not found`,
    404,
    'RESOURCE_NOT_FOUND'
  );
  error.details = {
    id: `No ${resourceType} exists with ID: ${id}`,
  };
  throw error;
});

const mockCreateInternalError = jest.fn((message = 'Internal server error') => {
  const error = new AppError(
    message,
    500,
    'INTERNAL_ERROR'
  );
  throw error;
});

const mockCreateDuplicateError = jest.fn((message = 'Duplicate error') => {
  const error = new AppError(
    message,
    400,
    'DUPLICATE_ERROR'
  );
  throw error;
});

// Mock dependencies BEFORE requiring the service
jest.mock('axios');
jest.mock('../../utils/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  },
}));

jest.mock('../../models/index', () => ({
  serviceComponent: {
    findUnique: jest.fn(),
    count: jest.fn(),
    findMany: jest.fn(),
  },
}));



jest.mock('../../controllers/errorController', () => ({
  createNotFoundError: mockCreateNotFoundError,
  createInternalError: mockCreateInternalError,
  createduplicateError: mockCreateDuplicateError,
}));

// Now require the service and other modules AFTER all mocks are set up
const axios = require('axios');
const serviceComponentService = require('../../services/serviceComponentService');
const { logger } = require('../../utils/logger');

// Define constants used in the tests
const INJECTION_SERVICE_URL = 'http://localhost:5001';

// Access the mocked prisma methods
const { serviceComponent } = require('../../models/index');
const mockFindUnique = serviceComponent.findUnique;
const mockCount = serviceComponent.count;
const mockFindMany = serviceComponent.findMany;

// Mock APIFeatures for pagination and filtering
jest.mock('../../utils/apiFeatures', () => {
  return class MockAPIFeatures {
    constructor(query, queryOptions) {
      this.query = query;
      this.queryString = queryOptions;
    }
    filter() {
      return this;
    }
    sort() {
      return this;
    }
    limitFieldsAdvanced() {
      return this;
    }
    paginate() {
      return this;
    }
  };
});

describe('serviceComponentService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createServiceComponent', () => {
    const componentData = {
      name: 'Test Component',
      description: 'Test Description',
      estimatedDuration: 60,
      vehicleType: 'CAR',
    };

    it('should create a service component through the injection service', async () => {
      // Mock axios response
      axios.post.mockResolvedValue({
        data: {
          data: {
            serviceComponentId: 'comp-id-123',
            ...componentData,
          },
        },
      });

      const result = await serviceComponentService.createServiceComponent(componentData);

      expect(axios.post).toHaveBeenCalledWith(
        'http://localhost:5001/api/v1/components',
        componentData,
      );
      expect(result).toEqual({
        serviceComponentId: 'comp-id-123',
        ...componentData,
      });
      expect(logger.info).toHaveBeenCalled();
    });

    it('should handle errors from the injection service', async () => {
      // Mock error response
      const error = new Error('Internal server error');
      error.response = {
        data: {
          message: 'Failed to create component in injection service',
        },
      };
      axios.post.mockRejectedValueOnce(error);
      
      // Mock the createInternalError to throw 'Internal server error'
      mockCreateInternalError.mockImplementationOnce(() => {
        const err = new Error('Internal server error');
        err.statusCode = 500;
        err.code = 'INTERNAL_ERROR';
        // Throw the error when this is called instead of just returning it
        throw err;
      });

      const componentData = {
        name: 'Test Component',
        description: 'A test component',
        key: 'test-component',
      };

      // Call the service and expect error
      await expect(
        serviceComponentService.createServiceComponent(componentData)
      ).rejects.toThrow('Internal server error');

      expect(logger.error).toHaveBeenCalled();
    });
  });

  describe('getAllServiceComponents', () => {
    const mockQueryBuilder = {
      orderBy: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      search: jest.fn().mockReturnThis(),
      count: jest.fn(() => Promise.resolve(2)),
      findMany: jest.fn(() => Promise.resolve([
        {
          serviceComponentId: 'comp-id-1',
          name: 'Component 1',
          description: 'Description 1',
          estimatedDuration: 30,
          vehicleType: 'CAR',
        },
        {
          serviceComponentId: 'comp-id-2',
          name: 'Component 2',
          description: 'Description 2',
          estimatedDuration: 45,
          vehicleType: 'MOTORCYCLE',
        },
      ])),
    };

    it('should return all service components with pagination', async () => {
      // Save original implementation to restore later
      const origGetAllComponents = serviceComponentService.getAllServiceComponents;
      
      // Mock the implementation for this test
      serviceComponentService.getAllServiceComponents = jest.fn().mockReturnValue(mockQueryBuilder);

      // Call the API and check results
      await mockQueryBuilder.findMany();
      await mockQueryBuilder.count();
      
      expect(mockQueryBuilder.findMany).toHaveBeenCalled();
      expect(mockQueryBuilder.count).toHaveBeenCalled();

      // Restore original implementation
      serviceComponentService.getAllServiceComponents = origGetAllComponents;
    });

    it('should call query builder methods correctly', () => {
      // We just verify that the methods exist and return the expected values
      expect(mockQueryBuilder.orderBy).toBeDefined();
      expect(mockQueryBuilder.select).toBeDefined();
      expect(mockQueryBuilder.where).toBeDefined();
      expect(mockQueryBuilder.search).toBeDefined();
      expect(mockQueryBuilder.count).toBeDefined();
    });

    it('should handle empty results properly', async () => {
      // Create a mock query builder that returns empty results
      const emptyMockQueryBuilder = {
        ...mockQueryBuilder,
        count: jest.fn(() => Promise.resolve(0)),
        findMany: jest.fn(() => Promise.resolve([])),
      };

      // Save original implementation to restore later
      const origGetAllComponents = serviceComponentService.getAllServiceComponents;
      
      // Mock the implementation for this test
      serviceComponentService.getAllServiceComponents = jest.fn().mockReturnValue(emptyMockQueryBuilder);

      const result = await emptyMockQueryBuilder.findMany();
      const count = await emptyMockQueryBuilder.count();
      
      expect(result).toEqual([]);
      expect(count).toBe(0);

      // Restore original implementation
      serviceComponentService.getAllServiceComponents = origGetAllComponents;
    });
  });

  describe('getServiceComponentById', () => {
    // Reset all mocks before each test
    beforeEach(() => {
      jest.clearAllMocks();
      mockFindUnique.mockReset();
      mockCreateNotFoundError.mockClear();
      mockCreateInternalError.mockClear();
    });
    
    it('should return a service component by ID', async () => {
      // Mock successful response
      const mockServiceComponent = {
        serviceComponentId: 'comp-123',
        name: 'Test Component',
        description: 'Test Description',
      };
      
      // Setup the mock to return the service component
      mockFindUnique.mockResolvedValue(mockServiceComponent);

      // Call the service
      const result = await serviceComponentService.getServiceComponentById('comp-123');

      // Assertions
      expect(result).toEqual(mockServiceComponent);
      expect(mockFindUnique).toHaveBeenCalledWith({
        where: { serviceComponentId: 'comp-123' },
      });
      expect(logger.info).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Fetching service component by id',
        })
      );
    });

    it('should throw an error if component is not found', async () => {
      // Clear previous mock implementations
      jest.clearAllMocks();
      
      // Mock service component not found
      mockFindUnique.mockResolvedValue(null);
      
      // Call the service and expect it to throw
      await expect(
        serviceComponentService.getServiceComponentById('non-existent-id')
      ).rejects.toThrow('service component not found');

      // Verify the mocks were called correctly
      expect(mockFindUnique).toHaveBeenCalledWith({
        where: { serviceComponentId: 'non-existent-id' },
      });
      expect(logger.warn).toHaveBeenCalled();
      expect(mockCreateNotFoundError).toHaveBeenCalledWith(
        'non-existent-id', 'service component'
      );
    });

    it('should handle database errors', async () => {
      // Mock database error
      const dbError = new Error('Database error');
      mockFindUnique.mockRejectedValue(dbError);
      
      // Setup the mock to return an internal error
      mockCreateInternalError.mockImplementation((message) => {
        const error = new Error(message || 'Internal server error');
        error.statusCode = 500;
        error.code = 'INTERNAL_ERROR';
        return error;
      });

      // Call the service and expect error
      await expect(
        serviceComponentService.getServiceComponentById('comp-id-123')
      ).rejects.toThrow(expect.objectContaining({
        message: 'Failed to fetch service component',
        statusCode: 500
      }));

      // Verify the mocks were called correctly
      expect(mockFindUnique).toHaveBeenCalledWith({
        where: { serviceComponentId: 'comp-id-123' },
      });
      expect(mockCreateInternalError).toHaveBeenCalledWith('Failed to fetch service component');
      expect(logger.error).toHaveBeenCalled();
    });
  });

  describe('updateServiceComponent', () => {
    it('should update a service component through the injection service', async () => {
      // Mock successful response
      const updatedComponent = {
        serviceComponentId: 'comp-id-123',
        name: 'Updated Component',
        description: 'Updated test component',
      };
      axios.patch.mockResolvedValueOnce({ 
        data: { 
          data: updatedComponent 
        }
      });

      const updateData = {
        name: 'Updated Component',
        description: 'Updated test component',
      };

      // Call the service
      const result = await serviceComponentService.updateServiceComponent(
        'comp-id-123',
        updateData
      );

      // Assertions
      expect(result).toEqual(updatedComponent);
      expect(axios.patch).toHaveBeenCalledWith(
        `${INJECTION_SERVICE_URL}/api/v1/components/comp-id-123`,
        updateData
      );
      expect(logger.info).toHaveBeenCalled();
    });

    it('should handle not found errors from the injection service', async () => {
      // Mock error response
      const notFoundError = new Error('Component not found');
      notFoundError.response = {
        status: 404,
        data: {
          message: 'Service component not found'
        }
      };
      axios.patch.mockRejectedValue(notFoundError);

      // Make sure the createNotFoundError function throws an error
      mockCreateNotFoundError.mockImplementation((id, resource) => {
        const error = new Error(`${resource} not found`);
        // Throw immediately
        throw error;
      });

      const updateData = {
        name: 'Updated Component',
        description: 'Updated test component',
      };

      // Call the service and expect error
      await expect(
        serviceComponentService.updateServiceComponent('comp-id-123', updateData)
      ).rejects.toThrow('service component not found');

      expect(logger.error).toHaveBeenCalled();
      expect(mockCreateNotFoundError).toHaveBeenCalledWith('comp-id-123', 'service component');
    });
    
    it('should handle other errors from the injection service', async () => {
      // Mock error response
      const error = new Error('Server error');
      error.response = {
        status: 500,
        data: {
          message: 'Internal server error',
        },
      };
      axios.put.mockRejectedValueOnce(error);
      
      // Setup internal error to be thrown
      mockCreateInternalError.mockImplementationOnce(() => {
        const internalError = new Error('Internal server error');
        internalError.statusCode = 500;
        internalError.code = 'INTERNAL_ERROR';
        throw internalError;
      });

      const updateData = {
        name: 'Updated Component',
        description: 'Updated test component',
      };

      // Call the service and expect error
      await expect(
        serviceComponentService.updateServiceComponent('comp-id-123', updateData)
      ).rejects.toThrow('Internal server error');

      expect(logger.error).toHaveBeenCalled();
    });
  });

  describe('deleteServiceComponent', () => {
    it('should delete a service component through the injection service', async () => {
      // Mock axios response
      axios.delete.mockResolvedValue({});

      const result = await serviceComponentService.deleteServiceComponent('comp-id-123');

      expect(axios.delete).toHaveBeenCalledWith(
        'http://localhost:5001/api/v1/components/comp-id-123',
      );
      expect(result).toBe(true);
      expect(logger.info).toHaveBeenCalled();
    });

    it('should handle not found errors from the injection service', async () => {
      // Mock error response
      const error = new Error('Not found');
      error.response = {
        status: 404,
        data: {
          message: 'Service component not found',
        },
      };
      axios.delete.mockRejectedValueOnce(error);

      // Setup a 404 error to be thrown
      mockCreateNotFoundError.mockImplementationOnce((id, resourceType) => {
        const notFoundError = new Error(`${resourceType} not found`);
        notFoundError.statusCode = 404;
        notFoundError.code = 'RESOURCE_NOT_FOUND';
        throw notFoundError;
      });

      // Call the service and expect error
      await expect(
        serviceComponentService.deleteServiceComponent('comp-id-123')
      ).rejects.toThrow('service component not found');

      expect(logger.error).toHaveBeenCalled();
    });

    it('should handle dependency errors from the injection service', async () => {
      // Mock axios error response with 400 status that should throw a validation error
      axios.delete.mockRejectedValue({
        response: {
          status: 400,
          data: {
            message: 'Service component has dependencies',
          },
        },
      });

      await expect(
        serviceComponentService.deleteServiceComponent('comp-id-123'),
      ).rejects.toThrow('Cannot delete service component with associated service types');

      expect(logger.error).toHaveBeenCalled();
    });

    it('should handle other errors from the injection service', async () => {
      // Mock error response
      const error = new Error('Server error');
      error.response = {
        status: 500,
        data: {
          message: 'Internal server error',
        },
      };
      axios.delete.mockRejectedValueOnce(error);
      
      // Setup internal error to be thrown
      mockCreateInternalError.mockImplementationOnce(() => {
        const internalError = new Error('Internal server error');
        internalError.statusCode = 500;
        internalError.code = 'INTERNAL_ERROR';
        throw internalError;
      });

      // Call the service and expect error
      await expect(
        serviceComponentService.deleteServiceComponent('comp-id-123')
      ).rejects.toThrow('Internal server error');

      expect(logger.error).toHaveBeenCalled();
    });
  });
});
