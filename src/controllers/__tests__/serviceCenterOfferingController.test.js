// src/controllers/__tests__/serviceCenterOfferingController.test.js
const serviceCenterOfferingController = require('../serviceCenterOfferingController');
const serviceCenterOfferingService = require('../../services/serviceCenterOfferingService');
const { formatSuccess } = require('../../utils/responseFormatter');

// Mock dependencies
jest.mock('../../services/serviceCenterOfferingService');
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

describe('serviceCenterOfferingController', () => {
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
      headers: {
        authorization: 'Bearer test-token',
      },
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

  describe('createServiceCenterOffering', () => {
    it('should create a service center offering', async () => {
      // Set up request parameters
      req.params = { serviceCenterId: '12345678-1234-1234-1234-123456789012' };
      req.body = {
        serviceTypeId: '98765432-9876-9876-9876-987654321098',
        price: 150.99,
        isActive: true,
        notes: 'Test offering notes',
      };

      // Mock service response
      const mockOffering = {
        serviceCenterOfferingId: 'offering-id-123',
        serviceCenterId: '12345678-1234-1234-1234-123456789012',
        serviceTypeId: '98765432-9876-9876-9876-987654321098',
        price: 150.99,
        isActive: true,
        notes: 'Test offering notes',
      };

      serviceCenterOfferingService.createServiceCenterOffering.mockResolvedValue(
        mockOffering,
      );

      // Call the controller method
      await serviceCenterOfferingController.createServiceCenterOffering(
        req,
        res,
        next,
      );

      // Assertions
      expect(
        serviceCenterOfferingService.createServiceCenterOffering,
      ).toHaveBeenCalledWith(
        '12345678-1234-1234-1234-123456789012',
        {
          ...req.body,
          serviceCenterId: '12345678-1234-1234-1234-123456789012',
        },
        req,
      );
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalled();
      expect(formatSuccess).toHaveBeenCalledWith(mockOffering);
    });

    it('should return an error if service center ID is invalid', async () => {
      // Set up request parameters with invalid UUID
      req.params = { serviceCenterId: 'invalid-id' };

      // Call the controller method
      await serviceCenterOfferingController.createServiceCenterOffering(
        req,
        res,
        next,
      );

      // Assertions
      expect(next).toHaveBeenCalled();
      expect(next.mock.calls[0][0].statusCode).toBe(400);
      expect(next.mock.calls[0][0].message).toBe(
        'Invalid service center ID format',
      );
      expect(
        serviceCenterOfferingService.createServiceCenterOffering,
      ).not.toHaveBeenCalled();
    });

    it('should pass service errors to the next middleware', async () => {
      // Set up request parameters
      req.params = { serviceCenterId: '12345678-1234-1234-1234-123456789012' };
      req.body = { serviceTypeId: '98765432-9876-9876-9876-987654321098' };

      // Mock service throwing an error
      const error = new Error('Service error');
      serviceCenterOfferingService.createServiceCenterOffering.mockRejectedValue(
        error,
      );

      // Call the controller method
      await serviceCenterOfferingController.createServiceCenterOffering(
        req,
        res,
        next,
      );

      // Assertions
      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('getServiceCenterOfferings', () => {
    it('should get all service center offerings', async () => {
      // Set up request parameters
      req.params = { serviceCenterId: '12345678-1234-1234-1234-123456789012' };
      req.query = { isActive: 'true', page: '1', limit: '10' };

      // Mock service response
      const mockOfferings = {
        data: [
          {
            serviceCenterOfferingId: 'offering-id-1',
            serviceCenterId: '12345678-1234-1234-1234-123456789012',
            serviceTypeId: '98765432-9876-9876-9876-987654321098',
            price: 150.99,
          },
          {
            serviceCenterOfferingId: 'offering-id-2',
            serviceCenterId: '12345678-1234-1234-1234-123456789012',
            serviceTypeId: '11111111-1111-1111-1111-111111111111',
            price: 200.5,
          },
        ],
        meta: { total: 2, page: 1, limit: 10 },
      };

      serviceCenterOfferingService.getServiceCenterOfferings.mockResolvedValue(
        mockOfferings,
      );

      // Call the controller method
      await serviceCenterOfferingController.getServiceCenterOfferings(
        req,
        res,
        next,
      );

      // Assertions
      expect(
        serviceCenterOfferingService.getServiceCenterOfferings,
      ).toHaveBeenCalledWith('12345678-1234-1234-1234-123456789012', req.query);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalled();
      expect(formatSuccess).toHaveBeenCalledWith(mockOfferings);
    });

    it('should return an error if service center ID is invalid', async () => {
      // Set up request parameters with invalid UUID
      req.params = { serviceCenterId: 'invalid-id' };

      // Call the controller method
      await serviceCenterOfferingController.getServiceCenterOfferings(
        req,
        res,
        next,
      );

      // Assertions
      expect(next).toHaveBeenCalled();
      expect(next.mock.calls[0][0].statusCode).toBe(400);
      expect(next.mock.calls[0][0].message).toBe(
        'Invalid service center ID format',
      );
      expect(
        serviceCenterOfferingService.getServiceCenterOfferings,
      ).not.toHaveBeenCalled();
    });

    it('should pass service errors to the next middleware', async () => {
      // Set up request parameters
      req.params = { serviceCenterId: '12345678-1234-1234-1234-123456789012' };

      // Mock service throwing an error
      const error = new Error('Service error');
      serviceCenterOfferingService.getServiceCenterOfferings.mockRejectedValue(
        error,
      );

      // Call the controller method
      await serviceCenterOfferingController.getServiceCenterOfferings(
        req,
        res,
        next,
      );

      // Assertions
      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('getServiceCenterOffering', () => {
    it('should get a service center offering by ID', async () => {
      // Set up request parameters
      req.params = {
        serviceCenterId: '12345678-1234-1234-1234-123456789012',
        serviceCenterOfferingId: '98765432-9876-9876-9876-987654321098',
      };

      // Mock service response
      const mockOffering = {
        serviceCenterOfferingId: '98765432-9876-9876-9876-987654321098',
        serviceCenterId: '12345678-1234-1234-1234-123456789012',
        serviceTypeId: '11111111-1111-1111-1111-111111111111',
        price: 150.99,
        isActive: true,
      };

      serviceCenterOfferingService.getServiceCenterOffering.mockResolvedValue(
        mockOffering,
      );

      // Call the controller method
      await serviceCenterOfferingController.getServiceCenterOffering(
        req,
        res,
        next,
      );

      // Assertions
      expect(
        serviceCenterOfferingService.getServiceCenterOffering,
      ).toHaveBeenCalledWith(
        '12345678-1234-1234-1234-123456789012',
        '98765432-9876-9876-9876-987654321098',
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalled();
      expect(formatSuccess).toHaveBeenCalledWith(mockOffering);
    });

    it('should return an error if service center ID is invalid', async () => {
      // Set up request parameters with invalid service center ID
      req.params = {
        serviceCenterId: 'invalid-id',
        serviceCenterOfferingId: '98765432-9876-9876-9876-987654321098',
      };

      // Call the controller method
      await serviceCenterOfferingController.getServiceCenterOffering(
        req,
        res,
        next,
      );

      // Assertions
      expect(next).toHaveBeenCalled();
      expect(next.mock.calls[0][0].statusCode).toBe(400);
      expect(next.mock.calls[0][0].message).toBe(
        'Invalid service center ID format',
      );
    });

    it('should return an error if service center offering ID is invalid', async () => {
      // Set up request parameters with invalid offering ID
      req.params = {
        serviceCenterId: '12345678-1234-1234-1234-123456789012',
        serviceCenterOfferingId: 'invalid-offering-id',
      };

      // Call the controller method
      await serviceCenterOfferingController.getServiceCenterOffering(
        req,
        res,
        next,
      );

      // Assertions
      expect(next).toHaveBeenCalled();
      expect(next.mock.calls[0][0].statusCode).toBe(400);
      expect(next.mock.calls[0][0].message).toBe(
        'Invalid service center offering ID format',
      );
    });

    it('should handle not found errors', async () => {
      // Set up request parameters
      req.params = {
        serviceCenterId: '12345678-1234-1234-1234-123456789012',
        serviceCenterOfferingId: '98765432-9876-9876-9876-987654321098',
      };

      // Mock service returning null (not found case)
      serviceCenterOfferingService.getServiceCenterOffering.mockResolvedValue(
        null,
      );

      // Call the controller method
      await serviceCenterOfferingController.getServiceCenterOffering(
        req,
        res,
        next,
      );

      // Assertions
      expect(next).toHaveBeenCalled();
      expect(next.mock.calls[0][0].statusCode).toBe(404);
      expect(next.mock.calls[0][0].message).toContain('not found');
    });

    it('should pass service errors to the next middleware', async () => {
      // Set up request parameters
      req.params = {
        serviceCenterId: '12345678-1234-1234-1234-123456789012',
        serviceCenterOfferingId: '98765432-9876-9876-9876-987654321098',
      };

      // Mock service throwing an error
      const error = new Error('Service error');
      serviceCenterOfferingService.getServiceCenterOffering.mockRejectedValue(
        error,
      );

      // Call the controller method
      await serviceCenterOfferingController.getServiceCenterOffering(
        req,
        res,
        next,
      );

      // Assertions
      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('updateServiceCenterOffering', () => {
    it('should update a service center offering', async () => {
      // Set up request parameters
      req.params = {
        serviceCenterId: '12345678-1234-1234-1234-123456789012',
        serviceCenterOfferingId: '98765432-9876-9876-9876-987654321098',
      };
      req.body = {
        price: 175.99,
        isActive: false,
        notes: 'Updated notes',
      };

      // Mock service response
      const mockUpdatedOffering = {
        serviceCenterOfferingId: '98765432-9876-9876-9876-987654321098',
        serviceCenterId: '12345678-1234-1234-1234-123456789012',
        serviceTypeId: '11111111-1111-1111-1111-111111111111',
        price: 175.99,
        isActive: false,
        notes: 'Updated notes',
      };

      serviceCenterOfferingService.updateServiceCenterOffering.mockResolvedValue(
        mockUpdatedOffering,
      );

      // Call the controller method
      await serviceCenterOfferingController.updateServiceCenterOffering(
        req,
        res,
        next,
      );

      // Assertions
      expect(
        serviceCenterOfferingService.updateServiceCenterOffering,
      ).toHaveBeenCalledWith(
        '12345678-1234-1234-1234-123456789012',
        '98765432-9876-9876-9876-987654321098',
        req.body,
        req,
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalled();
      expect(formatSuccess).toHaveBeenCalledWith(mockUpdatedOffering);
    });

    it('should return an error if service center ID is invalid', async () => {
      // Set up request parameters with invalid service center ID
      req.params = {
        serviceCenterId: 'invalid-id',
        serviceCenterOfferingId: '98765432-9876-9876-9876-987654321098',
      };

      // Call the controller method
      await serviceCenterOfferingController.updateServiceCenterOffering(
        req,
        res,
        next,
      );

      // Assertions
      expect(next).toHaveBeenCalled();
      expect(next.mock.calls[0][0].statusCode).toBe(400);
      expect(next.mock.calls[0][0].message).toBe(
        'Invalid service center ID format',
      );
    });

    it('should return an error if service center offering ID is invalid', async () => {
      // Set up request parameters with invalid offering ID
      req.params = {
        serviceCenterId: '12345678-1234-1234-1234-123456789012',
        serviceCenterOfferingId: 'invalid-offering-id',
      };

      // Call the controller method
      await serviceCenterOfferingController.updateServiceCenterOffering(
        req,
        res,
        next,
      );

      // Assertions
      expect(next).toHaveBeenCalled();
      expect(next.mock.calls[0][0].statusCode).toBe(400);
      expect(next.mock.calls[0][0].message).toBe(
        'Invalid service center offering ID format',
      );
    });

    it('should handle not found errors', async () => {
      // Set up request parameters
      req.params = {
        serviceCenterId: '12345678-1234-1234-1234-123456789012',
        serviceCenterOfferingId: '98765432-9876-9876-9876-987654321098',
      };
      req.body = { price: 175.99 };

      // Mock service returning null (not found case)
      serviceCenterOfferingService.updateServiceCenterOffering.mockResolvedValue(
        null,
      );

      // Call the controller method
      await serviceCenterOfferingController.updateServiceCenterOffering(
        req,
        res,
        next,
      );

      // Assertions
      expect(next).toHaveBeenCalled();
      expect(next.mock.calls[0][0].statusCode).toBe(404);
      expect(next.mock.calls[0][0].message).toContain('not found');
    });

    it('should pass service errors to the next middleware', async () => {
      // Set up request parameters
      req.params = {
        serviceCenterId: '12345678-1234-1234-1234-123456789012',
        serviceCenterOfferingId: '98765432-9876-9876-9876-987654321098',
      };
      req.body = { price: 175.99 };

      // Mock service throwing an error
      const error = new Error('Service error');
      serviceCenterOfferingService.updateServiceCenterOffering.mockRejectedValue(
        error,
      );

      // Call the controller method
      await serviceCenterOfferingController.updateServiceCenterOffering(
        req,
        res,
        next,
      );

      // Assertions
      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('getServiceCenterOfferingWithComponents', () => {
    it('should get a service center offering with components', async () => {
      // Set up request parameters
      req.params = {
        serviceCenterId: '12345678-1234-1234-1234-123456789012',
        serviceCenterOfferingId: '98765432-9876-9876-9876-987654321098',
      };
      req.query = { includeComponents: 'true' };

      // Mock service response
      const mockOfferingWithComponents = {
        offering: {
          serviceCenterOfferingId: '98765432-9876-9876-9876-987654321098',
          serviceCenterId: '12345678-1234-1234-1234-123456789012',
          serviceTypeId: '11111111-1111-1111-1111-111111111111',
          price: 150.99,
          isActive: true,
        },
        components: [
          {
            serviceComponentId: 'comp-id-1',
            name: 'Component 1',
            price: 50.99,
          },
          {
            serviceComponentId: 'comp-id-2',
            name: 'Component 2',
            price: 25.99,
          },
        ],
      };

      serviceCenterOfferingService.getServiceCenterOfferingWithComponents.mockResolvedValue(
        mockOfferingWithComponents,
      );

      // Call the controller method
      await serviceCenterOfferingController.getServiceCenterOfferingWithComponents(
        req,
        res,
        next,
      );

      // Assertions
      expect(
        serviceCenterOfferingService.getServiceCenterOfferingWithComponents,
      ).toHaveBeenCalledWith(
        '12345678-1234-1234-1234-123456789012',
        '98765432-9876-9876-9876-987654321098',
        req.query,
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalled();
      expect(formatSuccess).toHaveBeenCalledWith(
        mockOfferingWithComponents,
        'Service center offering with components retrieved successfully',
        200,
      );
    });

    it('should return an error if service center ID is invalid', async () => {
      // Set up request parameters with invalid service center ID
      req.params = {
        serviceCenterId: 'invalid-id',
        serviceCenterOfferingId: '98765432-9876-9876-9876-987654321098',
      };

      // Call the controller method
      await serviceCenterOfferingController.getServiceCenterOfferingWithComponents(
        req,
        res,
        next,
      );

      // Assertions
      expect(next).toHaveBeenCalled();
      expect(next.mock.calls[0][0].statusCode).toBe(400);
      expect(next.mock.calls[0][0].message).toBe(
        'Invalid service center ID format',
      );
    });

    it('should return an error if service center offering ID is invalid', async () => {
      // Set up request parameters with invalid offering ID
      req.params = {
        serviceCenterId: '12345678-1234-1234-1234-123456789012',
        serviceCenterOfferingId: 'invalid-offering-id',
      };

      // Call the controller method
      await serviceCenterOfferingController.getServiceCenterOfferingWithComponents(
        req,
        res,
        next,
      );

      // Assertions
      expect(next).toHaveBeenCalled();
      expect(next.mock.calls[0][0].statusCode).toBe(400);
      expect(next.mock.calls[0][0].message).toBe(
        'Invalid service center offering ID format',
      );
    });

    it('should handle not found errors', async () => {
      // Set up request parameters
      req.params = {
        serviceCenterId: '12345678-1234-1234-1234-123456789012',
        serviceCenterOfferingId: '98765432-9876-9876-9876-987654321098',
      };

      // Mock service returning null (not found case)
      serviceCenterOfferingService.getServiceCenterOfferingWithComponents.mockResolvedValue(
        null,
      );

      // Call the controller method
      await serviceCenterOfferingController.getServiceCenterOfferingWithComponents(
        req,
        res,
        next,
      );

      // Assertions
      expect(next).toHaveBeenCalled();
      expect(next.mock.calls[0][0].statusCode).toBe(404);
      expect(next.mock.calls[0][0].message).toContain('not found');
    });

    it('should pass service errors to the next middleware', async () => {
      // Set up request parameters
      req.params = {
        serviceCenterId: '12345678-1234-1234-1234-123456789012',
        serviceCenterOfferingId: '98765432-9876-9876-9876-987654321098',
      };

      // Mock service throwing an error
      const error = new Error('Service error');
      serviceCenterOfferingService.getServiceCenterOfferingWithComponents.mockRejectedValue(
        error,
      );

      // Call the controller method
      await serviceCenterOfferingController.getServiceCenterOfferingWithComponents(
        req,
        res,
        next,
      );

      // Assertions
      expect(next).toHaveBeenCalledWith(error);
    });
  });
});
