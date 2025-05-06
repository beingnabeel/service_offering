// src/controllers/__tests__/serviceTypeController.test.js
const serviceTypeController = require('../serviceTypeController');
const serviceTypeService = require('../../services/serviceTypeService');
const { logger } = require('../../utils/logger');
const { formatSuccess } = require('../../utils/responseFormatter');

// Mock dependencies
jest.mock('../../services/serviceTypeService');
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

describe('serviceTypeController', () => {
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

  describe('createType', () => {
    it('should create a service type', async () => {
      // Set up request data
      req.body = {
        name: 'Test Type',
        description: 'Test Description',
        longDescription: 'Long test description',
        estimatedDuration: 60,
        categoryId: '12345678-1234-1234-1234-123456789012',
        recommendedFrequency: 30,
        warningThreshold: 45,
        displayOrder: 1,
        isPopular: true,
      };

      req.fileData = {
        location: 'https://example.com/image.png',
        originalName: 'image.png',
      };

      // Mock service response
      const mockType = {
        serviceTypeId: 'test-id',
        ...req.body,
        displayImage: req.fileData.location,
      };

      serviceTypeService.createServiceType.mockResolvedValue(mockType);

      // Call the controller method
      await serviceTypeController.createType(req, res, next);

      // Assertions
      expect(serviceTypeService.createServiceType).toHaveBeenCalledWith({
        name: 'Test Type',
        description: 'Test Description',
        longDescription: 'Long test description',
        estimatedDuration: 60,
        categoryId: '12345678-1234-1234-1234-123456789012',
        recommendedFrequency: 30,
        warningThreshold: 45,
        displayOrder: 1,
        isPopular: true,
        displayImage: 'https://example.com/image.png',
      });

      expect(logger.info).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalled();
      expect(formatSuccess).toHaveBeenCalledWith(
        mockType,
        'Service type created successfully',
        201,
      );
    });

    it('should handle case when no image is uploaded', async () => {
      // Set up request data without fileData
      req.body = {
        name: 'Test Type',
        description: 'Test Description',
        categoryId: '12345678-1234-1234-1234-123456789012',
      };

      // Mock service response
      const mockType = {
        serviceTypeId: 'test-id',
        ...req.body,
      };

      serviceTypeService.createServiceType.mockResolvedValue(mockType);

      // Call the controller method
      await serviceTypeController.createType(req, res, next);

      // Assertions
      expect(serviceTypeService.createServiceType).toHaveBeenCalledWith({
        name: 'Test Type',
        description: 'Test Description',
        categoryId: '12345678-1234-1234-1234-123456789012',
      });

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalled();
      expect(formatSuccess).toHaveBeenCalledWith(
        mockType,
        'Service type created successfully',
        201,
      );
    });

    it('should handle service errors', async () => {
      req.body = {
        name: 'Test Type',
        description: 'Test Description',
      };

      // Mock service returning null (failure case)
      serviceTypeService.createServiceType.mockResolvedValue(null);

      // Call the controller method
      await serviceTypeController.createType(req, res, next);

      // Assertions
      expect(next).toHaveBeenCalled();
      expect(next.mock.calls[0][0].statusCode).toBe(500);
      expect(next.mock.calls[0][0].message).toBe(
        'Failed to create service type',
      );
    });

    it('should pass errors to the next middleware', async () => {
      // Mock service throwing an error
      const error = new Error('Service error');
      serviceTypeService.createServiceType.mockRejectedValue(error);

      // Call the controller method
      await serviceTypeController.createType(req, res, next);

      // Assertions
      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('getTypeById', () => {
    it('should get a service type by ID', async () => {
      // Set up request parameters with a valid UUID format
      req.params = { id: '12345678-1234-1234-1234-123456789012' };

      // Mock service response
      const mockType = {
        serviceTypeId: '12345678-1234-1234-1234-123456789012',
        name: 'Test Type',
        description: 'Test Description',
      };

      serviceTypeService.getServiceTypeById.mockResolvedValue(mockType);

      // Call the controller method
      await serviceTypeController.getTypeById(req, res, next);

      // Assertions
      expect(serviceTypeService.getServiceTypeById).toHaveBeenCalledWith(
        '12345678-1234-1234-1234-123456789012',
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalled();
      expect(formatSuccess).toHaveBeenCalledWith(
        mockType,
        'Service type retrieved successfully',
        200,
      );
    });

    it('should return an error if ID is not provided', async () => {
      // Call the controller method without an ID
      await serviceTypeController.getTypeById(req, res, next);

      // Assertions
      expect(next).toHaveBeenCalled();
      expect(next.mock.calls[0][0].statusCode).toBe(400);
      expect(next.mock.calls[0][0].message).toBe('Invalid service type ID format');
    });

    it('should pass service errors to the next middleware', async () => {
      // Set up request parameters with a valid UUID format
      req.params = { id: '12345678-1234-1234-1234-123456789012' };

      // Mock service throwing an error
      const error = new Error('Service error');
      serviceTypeService.getServiceTypeById.mockRejectedValue(error);

      // Call the controller method
      await serviceTypeController.getTypeById(req, res, next);

      // Assertions
      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('updateType', () => {
    it('should update a service type', async () => {
      // Set up request parameters
      req.params = { id: '12345678-1234-1234-1234-123456789012' };
      req.body = {
        name: 'Updated Type',
        description: 'Updated Description',
        longDescription: 'Updated long description',
      };

      req.fileData = {
        location: 'https://example.com/updated-image.png',
        originalName: 'updated-image.png',
      };

      // Mock service response
      const mockUpdatedType = {
        serviceTypeId: '12345678-1234-1234-1234-123456789012',
        name: 'Updated Type',
        description: 'Updated Description',
        longDescription: 'Updated long description',
        displayImage: 'https://example.com/updated-image.png',
      };

      serviceTypeService.updateServiceType.mockResolvedValue(mockUpdatedType);

      // Call the controller method
      await serviceTypeController.updateType(req, res, next);

      // Assertions
      expect(serviceTypeService.updateServiceType).toHaveBeenCalledWith(
        '12345678-1234-1234-1234-123456789012',
        {
          name: 'Updated Type',
          description: 'Updated Description',
          longDescription: 'Updated long description',
          displayImage: 'https://example.com/updated-image.png',
        },
      );

      expect(logger.info).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalled();
      expect(formatSuccess).toHaveBeenCalledWith(
        mockUpdatedType,
        'Service type updated successfully',
        200,
      );
    });

    it('should handle case when no image is uploaded', async () => {
      // Set up request parameters
      req.params = { id: '12345678-1234-1234-1234-123456789012' };
      req.body = {
        name: 'Updated Type',
        description: 'Updated Description',
      };

      // Mock service response
      const mockUpdatedType = {
        serviceTypeId: '12345678-1234-1234-1234-123456789012',
        name: 'Updated Type',
        description: 'Updated Description',
      };

      serviceTypeService.updateServiceType.mockResolvedValue(mockUpdatedType);

      // Call the controller method
      await serviceTypeController.updateType(req, res, next);

      // Assertions
      expect(serviceTypeService.updateServiceType).toHaveBeenCalledWith(
        '12345678-1234-1234-1234-123456789012',
        {
          name: 'Updated Type',
          description: 'Updated Description',
        },
      );

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalled();
      expect(formatSuccess).toHaveBeenCalledWith(
        mockUpdatedType,
        'Service type updated successfully',
        200,
      );
    });

    it('should return an error if ID is not provided', async () => {
      // Call the controller method without an ID
      await serviceTypeController.updateType(req, res, next);

      // Assertions
      expect(next).toHaveBeenCalled();
      expect(next.mock.calls[0][0].statusCode).toBe(400);
      expect(next.mock.calls[0][0].message).toBe('Invalid service type ID format');
    });

    it('should pass service errors to the next middleware', async () => {
      // Set up request parameters
      req.params = { id: '12345678-1234-1234-1234-123456789012' };
      req.body = { name: 'Updated Type' };

      // Mock service throwing an error
      const error = new Error('Service error');
      serviceTypeService.updateServiceType.mockRejectedValue(error);

      // Call the controller method
      await serviceTypeController.updateType(req, res, next);

      // Assertions
      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('getTypesByCategoryId', () => {
    it('should get all service types for a category', async () => {
      // Set up request parameters
      req.params = { id: '12345678-1234-1234-1234-123456789012' };
      req.query = { isPopular: 'true', page: '1', limit: '10' };

      // Mock service response
      const mockResult = {
        data: [
          { 
            serviceTypeId: '1',
            name: 'Type 1',
            categoryId: '12345678-1234-1234-1234-123456789012',
          },
          { 
            serviceTypeId: '2',
            name: 'Type 2',
            categoryId: '12345678-1234-1234-1234-123456789012',
          },
        ],
        meta: { total: 2, page: 1, limit: 10 },
      };

      serviceTypeService.getServiceTypesByCategoryId.mockResolvedValue(mockResult);

      // Call the controller method
      await serviceTypeController.getTypesByCategoryId(req, res, next);

      // Assertions
      expect(
        serviceTypeService.getServiceTypesByCategoryId,
      ).toHaveBeenCalledWith('12345678-1234-1234-1234-123456789012', req.query);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalled();
      expect(formatSuccess).toHaveBeenCalledWith(
        mockResult,
      
        'Service types retrieved successfully',
        200,
      );
    });

    it('should handle empty result', async () => {
      // Set up request parameters
      req.params = { id: '12345678-1234-1234-1234-123456789012' };

      // Mock service response with empty data
      const mockResult = {
        data: [],
        meta: { total: 0, page: 1, limit: 10 },
      };

      serviceTypeService.getServiceTypesByCategoryId.mockResolvedValue(mockResult);

      // Call the controller method
      await serviceTypeController.getTypesByCategoryId(req, res, next);

      // Assertions
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalled();
      // Updated to match the actual implementation which adds totalPages
      expect(formatSuccess).toHaveBeenCalledWith(
        { 
          data: [], 
          meta: { ...mockResult.meta, totalPages: 0 } 
        },
        'No service types found for this category',
        200,
      );
    });

    it('should return an error if category ID is not provided', async () => {
      // Call the controller method without a category ID
      await serviceTypeController.getTypesByCategoryId(req, res, next);

      // Assertions
      expect(next).toHaveBeenCalled();
      expect(next.mock.calls[0][0].statusCode).toBe(400);
      expect(next.mock.calls[0][0].message).toBe(
        'Invalid service category ID format',
      );
    });

    it('should pass errors to the next middleware', async () => {
      // Set up request parameters
      req.params = { id: '12345678-1234-1234-1234-123456789012' };

      // Mock service throwing an error
      const error = new Error('Service error');
      serviceTypeService.getServiceTypesByCategoryId.mockRejectedValue(error);

      // Call the controller method
      await serviceTypeController.getTypesByCategoryId(req, res, next);

      // Assertions
      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('deleteType', () => {
    it('should delete a service type', async () => {
      // Set up request parameters
      req.params = { id: '12345678-1234-1234-1234-123456789012' };

      // Mock service response
      const mockDeletedType = {
        serviceTypeId: '12345678-1234-1234-1234-123456789012',
        name: 'Deleted Type',
      };

      serviceTypeService.deleteServiceType.mockResolvedValue(mockDeletedType);

      // Call the controller method
      await serviceTypeController.deleteType(req, res, next);

      // Assertions
      expect(serviceTypeService.deleteServiceType).toHaveBeenCalledWith(
        '12345678-1234-1234-1234-123456789012',
      );
      expect(res.status).toHaveBeenCalledWith(204);
      expect(res.send).toHaveBeenCalled();
    });

    it('should return an error if ID is not provided', async () => {
      // Call the controller method without an ID
      await serviceTypeController.deleteType(req, res, next);

      // Assertions
      expect(next).toHaveBeenCalled();
      expect(next.mock.calls[0][0].statusCode).toBe(400);
      expect(next.mock.calls[0][0].message).toBe('Invalid service type ID format');
    });

    it('should pass service errors to the next middleware', async () => {
      // Set up request parameters
      req.params = { id: '12345678-1234-1234-1234-123456789012' };

      // Mock service throwing an error
      const error = new Error('Service error');
      serviceTypeService.deleteServiceType.mockRejectedValue(error);

      // Call the controller method
      await serviceTypeController.deleteType(req, res, next);

      // Assertions
      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('associateComponentWithType', () => {
    it('should associate a component with a service type', async () => {
      // Set up request parameters
      req.params = { id: '12345678-1234-1234-1234-123456789012' };
      req.body = {
        serviceComponentId: '98765432-9876-9876-9876-987654321098',
        cost: 50.99,
        isRequired: true,
      };

      // Mock service response
      const mockTypeComponent = {
        serviceTypeId: '12345678-1234-1234-1234-123456789012',
        serviceComponentId: '98765432-9876-9876-9876-987654321098',
        cost: 50.99,
        isRequired: true,
      };

      // The controller wraps this in a try-catch, which we need to simulate
      // by resolving the mock properly
      serviceTypeService.associateComponentWithType.mockResolvedValue(mockTypeComponent);

      // Call the controller method
      await serviceTypeController.associateComponentWithType(req, res, next);

      // Check that service was called with correct parameters
      expect(serviceTypeService.associateComponentWithType).toHaveBeenCalledWith(
        '12345678-1234-1234-1234-123456789012',
        req.body
      );
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalled();
      expect(formatSuccess).toHaveBeenCalledWith(
        mockTypeComponent,
      
        'Component associated with service type successfully',
        201,
      );
    });

    it('should return an error if service type ID is not provided', async () => {
      // Call the controller method without a service type ID
      await serviceTypeController.associateComponentWithType(req, res, next);

      // Assertions
      expect(next).toHaveBeenCalled();
      expect(next.mock.calls[0][0].statusCode).toBe(400);
      expect(next.mock.calls[0][0].message).toBe('Invalid service type ID format');
    });

    it('should pass service errors to the next middleware', async () => {
      // Set up request parameters
      req.params = { id: '12345678-1234-1234-1234-123456789012' };
      // Body without required component data to trigger validation error
      req.body = {};

      // Call the controller method
      await serviceTypeController.associateComponentWithType(req, res, next);

      // Assertions - expect a specific error message for missing component ID
      expect(next).toHaveBeenCalled();
      expect(next.mock.calls[0][0].message).toBe('Service component ID is required');
    });
  });

  describe('getTypeComponents', () => {
    it('should get all components for a service type with pagination', async () => {
      // Set up request parameters
      req.params = { id: '12345678-1234-1234-1234-123456789012' };
      req.query = { page: '1', limit: '10' };

      // Mock service response with transformed data structure
      const mockResult = {
        data: [
          { serviceComponent: { componentId: '1', name: 'Component 1' } },
          { serviceComponent: { componentId: '2', name: 'Component 2' } },
        ],
        meta: { total: 2, page: 1, limit: 10 },
      };

      serviceTypeService.getComponentsByTypeId.mockResolvedValue(mockResult);

      // Call the controller method
      await serviceTypeController.getTypeComponents(req, res, next);

      // Assertions
      expect(serviceTypeService.getComponentsByTypeId).toHaveBeenCalledWith(
        '12345678-1234-1234-1234-123456789012',
        req.query,
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalled();
      expect(formatSuccess).toHaveBeenCalledWith(
        {
          ServiceTypeComponents: [
            { componentId: '1', name: 'Component 1' },
            { componentId: '2', name: 'Component 2' },
          ],
          meta: mockResult.meta,
        },
        'Components retrieved successfully',
        200,
      );
    });

    it('should handle empty result for components', async () => {
      // Set up request parameters
      req.params = { id: '12345678-1234-1234-1234-123456789012' };

      // Mock service response with empty data
      const mockResult = {
        data: [],
        meta: { total: 0, page: 1, limit: 10 },
      };

      serviceTypeService.getComponentsByTypeId.mockResolvedValue(mockResult);

      // Call the controller method
      await serviceTypeController.getTypeComponents(req, res, next);

      // Assertions
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalled();
      expect(formatSuccess).toHaveBeenCalledWith(
        {
          data: [],
          meta: mockResult.meta || {
            total: 0,
            page: 1,
            limit: 10,
            totalPages: 0,
          },
        },
        'No components found for this service type',
        200,
      );
    });

    it('should return an error if service type ID is not provided', async () => {
      // Call the controller method without a service type ID
      await serviceTypeController.getTypeComponents(req, res, next);

      // Assertions
      expect(next).toHaveBeenCalled();
      expect(next.mock.calls[0][0].statusCode).toBe(400);
      expect(next.mock.calls[0][0].message).toBe('Invalid service type ID format');
    });

    it('should pass service errors to the next middleware', async () => {
      // Set up request parameters
      req.params = { id: '12345678-1234-1234-1234-123456789012' };

      // Mock service throwing an error
      const error = new Error('Service error');
      serviceTypeService.getComponentsByTypeId.mockRejectedValue(error);

      // Call the controller method
      await serviceTypeController.getTypeComponents(req, res, next);

      // Assertions
      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('removeTypeComponent', () => {
    it('should remove a component from a service type', async () => {
      // Set up request parameters
      req.params = { 
        id: '12345678-1234-1234-1234-123456789012',
        componentId: '98765432-9876-9876-9876-987654321098'
      };

      // Mock service response (successful deletion returns nothing)
      serviceTypeService.removeComponentFromType.mockResolvedValue(undefined);

      // Call the controller method
      await serviceTypeController.removeTypeComponent(req, res, next);

      // Assertions
      expect(serviceTypeService.removeComponentFromType).toHaveBeenCalledWith(
        '12345678-1234-1234-1234-123456789012',
        '98765432-9876-9876-9876-987654321098',
      );
      expect(res.status).toHaveBeenCalledWith(204);
      expect(res.send).toHaveBeenCalled();
    });

    it('should return an error if service type ID is not provided', async () => {
      // Setup with only componentId
      req.params = { componentId: '98765432-9876-9876-9876-987654321098' };

      // Call the controller method without a service type ID
      await serviceTypeController.removeTypeComponent(req, res, next);

      // Assertions
      expect(next).toHaveBeenCalled();
      expect(next.mock.calls[0][0].statusCode).toBe(400);
      expect(next.mock.calls[0][0].message).toBe('Invalid service type ID format');
    });

    it('should return an error if component ID is not provided', async () => {
      // Setup with only service type ID
      req.params = { id: '12345678-1234-1234-1234-123456789012' };

      // Call the controller method without a component ID
      await serviceTypeController.removeTypeComponent(req, res, next);

      // Assertions
      expect(next).toHaveBeenCalled();
      expect(next.mock.calls[0][0].statusCode).toBe(400);
      expect(next.mock.calls[0][0].message).toBe(
        'Invalid service component ID format',
      );
    });

    it('should pass service errors to the next middleware', async () => {
      // Set up request parameters
      req.params = { 
        id: '12345678-1234-1234-1234-123456789012',
        componentId: '98765432-9876-9876-9876-987654321098'
      };

      // Mock service throwing an error
      const error = new Error('Service error');
      serviceTypeService.removeComponentFromType.mockRejectedValue(error);

      // Call the controller method
      await serviceTypeController.removeTypeComponent(req, res, next);

      // Assertions
      expect(next).toHaveBeenCalledWith(error);
    });
  });
});
