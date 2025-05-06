// src/controllers/__tests__/serviceComponentController.test.js
const serviceComponentController = require('../serviceComponentController');
const serviceComponentService = require('../../services/serviceComponentService');
const { logger } = require('../../utils/logger');
const { formatSuccess } = require('../../utils/responseFormatter');

// Mock dependencies
jest.mock('../../services/serviceComponentService');
jest.mock('../../utils/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  },
}));

// Mock formatSuccess to return a predictable object
jest.mock('../../utils/responseFormatter', () => ({
  formatSuccess: jest.fn((data, message, statusCode) => ({
    success: true,
    message,
    statusCode,
    data,
  })),
}));

// Mock catchAsync to invoke the callback directly
jest.mock('../../utils/catchAsync', () => (fn) => async (req, res, next) => {
  try {
    await fn(req, res, next);
  } catch (error) {
    next(error);
  }
});

describe('serviceComponentController', () => {
  let req;
  let res;
  let next;

  beforeEach(() => {
    // Reset global requestId
    global.requestId = undefined;

    // Mock request and response objects
    req = {
      body: {},
      params: {},
      query: {},
      requestId: 'test-request-id',
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
    };

    next = jest.fn();

    // Clear mocks
    jest.clearAllMocks();
  });

  describe('createComponent', () => {
    it('should create a service component', async () => {
      // Set up request data
      req.body = {
        name: 'Test Component',
        description: 'Test Description',
        estimatedDuration: 30,
        vehicleType: 'CAR',
        cost: 50.99,
      };

      // Mock service response
      const mockComponent = {
        serviceComponentId: 'test-id',
        ...req.body,
      };

      serviceComponentService.createServiceComponent.mockResolvedValue(
        mockComponent,
      );

      // Call the controller method
      await serviceComponentController.createComponent(req, res, next);

      // Assertions
      expect(
        serviceComponentService.createServiceComponent,
      ).toHaveBeenCalledWith({
        name: 'Test Component',
        description: 'Test Description',
        estimatedDuration: 30,
        vehicleType: 'CAR',
        cost: 50.99,
      });

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalled();
      expect(formatSuccess).toHaveBeenCalledWith(
        mockComponent,
        'Service component created successfully',
        201,
      );
    });

    it('should handle service errors', async () => {
      // Set up request data
      req.body = {
        name: 'Test Component',
        description: 'Test Description',
      };

      // Mock service returning null (failure case)
      serviceComponentService.createServiceComponent.mockResolvedValue(null);

      // Call the controller method
      await serviceComponentController.createComponent(req, res, next);

      // Assertions
      expect(next).toHaveBeenCalled();
      expect(next.mock.calls[0][0].statusCode).toBe(500);
      expect(next.mock.calls[0][0].message).toBe(
        'Failed to create service component',
      );
    });

    it('should pass errors to the next middleware', async () => {
      // Mock service throwing an error
      const error = new Error('Service error');
      serviceComponentService.createServiceComponent.mockRejectedValue(error);

      // Call the controller method
      await serviceComponentController.createComponent(req, res, next);

      // Assertions
      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('getAllComponents', () => {
    it('should get all service components', async () => {
      // Mock service response
      const mockResult = {
        data: [
          {
            serviceComponentId: '1',
            name: 'Component 1',
          },
          {
            serviceComponentId: '2',
            name: 'Component 2',
          },
        ],
        meta: { total: 2, page: 1, limit: 10 },
      };

      serviceComponentService.getAllServiceComponents.mockResolvedValue(
        mockResult,
      );

      // Call the controller method
      await serviceComponentController.getAllComponents(req, res, next);

      // Assertions
      expect(
        serviceComponentService.getAllServiceComponents,
      ).toHaveBeenCalledWith(req.query);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalled();
      expect(formatSuccess).toHaveBeenCalledWith(
        mockResult,
        'Service components retrieved successfully',
        200,
      );
    });

    it('should handle empty result', async () => {
      // Mock service response with empty data
      const mockResult = {
        data: [],
        meta: { total: 0, page: 1, limit: 10 },
      };

      serviceComponentService.getAllServiceComponents.mockResolvedValue(
        mockResult,
      );

      // Call the controller method
      await serviceComponentController.getAllComponents(req, res, next);

      // Assertions
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalled();
      expect(formatSuccess).toHaveBeenCalledWith(
        { data: [], meta: mockResult.meta },
        'No service components found',
        200,
      );
    });

    it('should pass errors to the next middleware', async () => {
      // Mock service throwing an error
      const error = new Error('Service error');
      serviceComponentService.getAllServiceComponents.mockRejectedValue(error);

      // Call the controller method
      await serviceComponentController.getAllComponents(req, res, next);

      // Assertions
      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('getComponentById', () => {
    it('should get a service component by ID', async () => {
      // Set up request parameters with a valid UUID format
      req.params = { id: '12345678-1234-1234-1234-123456789012' };

      // Mock service response
      const mockComponent = {
        serviceComponentId: '12345678-1234-1234-1234-123456789012',
        name: 'Test Component',
        description: 'Test Description',
      };

      serviceComponentService.getServiceComponentById.mockResolvedValue(
        mockComponent,
      );

      // Call the controller method
      await serviceComponentController.getComponentById(req, res, next);

      // Assertions
      expect(
        serviceComponentService.getServiceComponentById,
      ).toHaveBeenCalledWith('12345678-1234-1234-1234-123456789012');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalled();
      expect(formatSuccess).toHaveBeenCalledWith(
        mockComponent,
        'Service component retrieved successfully',
        200,
      );
    });

    it('should return an error if ID is not provided', async () => {
      // Call the controller method without an ID
      await serviceComponentController.getComponentById(req, res, next);

      // Assertions
      expect(next).toHaveBeenCalled();
      expect(next.mock.calls[0][0].statusCode).toBe(400);
      expect(next.mock.calls[0][0].message).toBe(
        'Invalid service category ID format',
      );
    });

    it('should handle not found errors', async () => {
      // Set up request parameters with a valid UUID format
      req.params = { id: '12345678-1234-1234-1234-123456789012' };

      // Mock service returning null (not found case)
      serviceComponentService.getServiceComponentById.mockResolvedValue(null);

      // Call the controller method
      await serviceComponentController.getComponentById(req, res, next);

      // Assertions
      expect(next).toHaveBeenCalled();
      expect(next.mock.calls[0][0].statusCode).toBe(404);
      expect(next.mock.calls[0][0].message).toBe(
        'Service component not found not found',
      );
    });

    it('should pass service errors to the next middleware', async () => {
      // Set up request parameters with a valid UUID format
      req.params = { id: '12345678-1234-1234-1234-123456789012' };

      // Mock service throwing an error
      const error = new Error('Service error');
      serviceComponentService.getServiceComponentById.mockRejectedValue(error);

      // Call the controller method
      await serviceComponentController.getComponentById(req, res, next);

      // Assertions
      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('updateComponent', () => {
    it('should update a service component', async () => {
      // Set up request parameters
      req.params = { id: '12345678-1234-1234-1234-123456789012' };
      req.body = {
        name: 'Updated Component',
        description: 'Updated Description',
        estimatedDuration: 45,
        cost: 75.99,
        vehicleType: 'SUV',
      };

      // Mock service response
      const mockUpdatedComponent = {
        serviceComponentId: '12345678-1234-1234-1234-123456789012',
        ...req.body,
      };

      serviceComponentService.updateServiceComponent.mockResolvedValue(
        mockUpdatedComponent,
      );

      // Call the controller method
      await serviceComponentController.updateComponent(req, res, next);

      // Assertions
      expect(
        serviceComponentService.updateServiceComponent,
      ).toHaveBeenCalledWith('12345678-1234-1234-1234-123456789012', {
        name: 'Updated Component',
        description: 'Updated Description',
        estimatedDuration: 45,
        cost: 75.99,
        vehicleType: 'SUV',
      });

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalled();
      expect(formatSuccess).toHaveBeenCalledWith(
        mockUpdatedComponent,
        'Service component updated successfully',
        200,
      );
    });

    it('should pass service errors to the next middleware', async () => {
      // Set up request parameters
      req.params = { id: '12345678-1234-1234-1234-123456789012' };
      req.body = { name: 'Updated Component' };

      // Mock service throwing an error
      const error = new Error('Service error');
      serviceComponentService.updateServiceComponent.mockRejectedValue(error);

      // Call the controller method
      await serviceComponentController.updateComponent(req, res, next);

      // Assertions
      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('deleteComponent', () => {
    it('should delete a service component', async () => {
      // Set up request parameters with a valid UUID format
      req.params = { id: '12345678-1234-1234-1234-123456789012' };

      // Mock service response (successful deletion returns undefined)
      serviceComponentService.deleteServiceComponent.mockResolvedValue(
        undefined,
      );

      // Call the controller method
      await serviceComponentController.deleteComponent(req, res, next);

      // Assertions
      expect(
        serviceComponentService.deleteServiceComponent,
      ).toHaveBeenCalledWith('12345678-1234-1234-1234-123456789012');
      expect(res.status).toHaveBeenCalledWith(204);
      expect(res.send).toHaveBeenCalled();
    });

    it('should return an error if ID is not provided', async () => {
      // Call the controller method without an ID
      await serviceComponentController.deleteComponent(req, res, next);

      // Assertions
      expect(next).toHaveBeenCalled();
      expect(next.mock.calls[0][0].statusCode).toBe(400);
      expect(next.mock.calls[0][0].message).toBe(
        'Invalid service component ID format',
      );
    });

    it('should pass service errors to the next middleware', async () => {
      // Set up request parameters with a valid UUID format
      req.params = { id: '12345678-1234-1234-1234-123456789012' };

      // Mock service throwing an error
      const error = new Error('Service error');
      serviceComponentService.deleteServiceComponent.mockRejectedValue(error);

      // Call the controller method
      await serviceComponentController.deleteComponent(req, res, next);

      // Assertions
      expect(next).toHaveBeenCalledWith(error);
    });
  });
});
