// src/controllers/__tests__/serviceCategoryController.test.js
const serviceCategoryController = require('../serviceCategoryController');
const serviceCategoryService = require('../../services/serviceCategoryService');
const AppError = require('../../utils/appError');
const { logger } = require('../../utils/logger');
const { formatSuccess } = require('../../utils/responseFormatter');

// Mock dependencies
jest.mock('../../services/serviceCategoryService');
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

describe('serviceCategoryController', () => {
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

  describe('createCategory', () => {
    it('should create a service category', async () => {
      // Set up request data
      req.body = {
        name: 'Test Category',
        description: 'Test Description',
        vehicleType: 'CAR',
        displayOrder: 1,
        isPopular: true,
      };

      req.fileData = {
        location: 'https://example.com/icon.png',
        originalName: 'icon.png',
      };

      // Mock service response
      const mockCategory = {
        serviceCategoryId: 'test-id',
        ...req.body,
        icon: req.fileData.location,
      };

      serviceCategoryService.createServiceCategory.mockResolvedValue(
        mockCategory,
      );

      // Call the controller method
      await serviceCategoryController.createCategory(req, res, next);

      // Assertions
      expect(serviceCategoryService.createServiceCategory).toHaveBeenCalledWith(
        {
          name: 'Test Category',
          description: 'Test Description',
          vehicleType: 'CAR',
          displayOrder: 1,
          isPopular: true,
          icon: 'https://example.com/icon.png',
        },
      );

      expect(logger.info).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalled();
      expect(formatSuccess).toHaveBeenCalledWith(
        mockCategory,
        'Service category created successfully',
        201,
      );
    });

    it('should handle case when no icon is uploaded', async () => {
      // Set up request data without fileData
      req.body = {
        name: 'Test Category',
        description: 'Test Description',
        vehicleType: 'CAR',
      };

      // Mock service response
      const mockCategory = {
        serviceCategoryId: 'test-id',
        ...req.body,
      };

      serviceCategoryService.createServiceCategory.mockResolvedValue(
        mockCategory,
      );

      // Call the controller method
      await serviceCategoryController.createCategory(req, res, next);

      // Assertions
      expect(serviceCategoryService.createServiceCategory).toHaveBeenCalledWith(
        {
          name: 'Test Category',
          description: 'Test Description',
          vehicleType: 'CAR',
        },
      );

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalled();
      expect(formatSuccess).toHaveBeenCalledWith(
        mockCategory,
        'Service category created successfully',
        201,
      );
    });

    it('should pass errors to the next middleware', async () => {
      // Mock service throwing an error
      const error = new Error('Service error');
      serviceCategoryService.createServiceCategory.mockRejectedValue(error);

      // Call the controller method
      await serviceCategoryController.createCategory(req, res, next);

      // Assertions
      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('getAllCategories', () => {
    it('should get all service categories', async () => {
      // Mock service response
      const mockResult = {
        data: [
          { serviceCategoryId: '1', name: 'Category 1' },
          { serviceCategoryId: '2', name: 'Category 2' },
        ],
        meta: { total: 2, page: 1, limit: 10 },
      };

      serviceCategoryService.getAllServiceCategories.mockResolvedValue(
        mockResult,
      );

      // Call the controller method
      await serviceCategoryController.getAllCategories(req, res, next);

      // Assertions
      expect(
        serviceCategoryService.getAllServiceCategories,
      ).toHaveBeenCalledWith({});
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalled();
      expect(formatSuccess).toHaveBeenCalledWith(
        mockResult,
        'Service categories retrieved successfully',
        200,
      );
    });

    it('should handle empty result', async () => {
      // Mock service response with empty data
      const mockResult = {
        data: [],
        meta: { total: 0, page: 1, limit: 10 },
      };

      serviceCategoryService.getAllServiceCategories.mockResolvedValue(
        mockResult,
      );

      // Call the controller method
      await serviceCategoryController.getAllCategories(req, res, next);

      // Assertions
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalled();
      expect(formatSuccess).toHaveBeenCalledWith(
        { data: [], meta: mockResult.meta },
        'No service categories found matching the criteria',
        200,
      );
    });

    it('should pass query parameters to the service', async () => {
      // Set up request query
      req.query = {
        vehicleType: 'CAR',
        isPopular: 'true',
        page: '2',
        limit: '5',
      };

      // Mock service response
      const mockResult = {
        data: [
          {
            serviceCategoryId: '1',
            name: 'Category 1',
            vehicleType: 'CAR',
            isPopular: true,
          },
        ],
        meta: { total: 1, page: 2, limit: 5 },
      };

      serviceCategoryService.getAllServiceCategories.mockResolvedValue(
        mockResult,
      );

      // Call the controller method
      await serviceCategoryController.getAllCategories(req, res, next);

      // Assertions
      expect(
        serviceCategoryService.getAllServiceCategories,
      ).toHaveBeenCalledWith(req.query);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalled();
      expect(formatSuccess).toHaveBeenCalledWith(
        mockResult,
        'Service categories retrieved successfully',
        200,
      );
    });

    it('should pass errors to the next middleware', async () => {
      // Mock service throwing an error
      const error = new Error('Service error');
      serviceCategoryService.getAllServiceCategories.mockRejectedValue(error);

      // Call the controller method
      await serviceCategoryController.getAllCategories(req, res, next);

      // Assertions
      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('getCategoryById', () => {
    it('should get a service category by ID', async () => {
      // Set up request parameters
      req.params = { id: 'test-id' };

      // Mock service response
      const mockCategory = {
        serviceCategoryId: 'test-id',
        name: 'Test Category',
      };

      serviceCategoryService.getServiceCategoryById.mockResolvedValue(
        mockCategory,
      );

      // Call the controller method
      await serviceCategoryController.getCategoryById(req, res, next);

      // Assertions
      expect(
        serviceCategoryService.getServiceCategoryById,
      ).toHaveBeenCalledWith('test-id');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalled();
      expect(formatSuccess).toHaveBeenCalledWith(
        mockCategory,
        'Service category retrieved successfully',
        200,
      );
    });

    it('should return an error if ID is not provided', async () => {
      // Call the controller method without an ID
      await serviceCategoryController.getCategoryById(req, res, next);

      // Assertions
      expect(next).toHaveBeenCalledWith(expect.any(AppError));
      expect(next.mock.calls[0][0].statusCode).toBe(400);
      expect(next.mock.calls[0][0].message).toBe('Category ID is required');
    });

    it('should handle not found errors', async () => {
      // Set up request parameters
      req.params = { id: 'test-id' };

      // Mock service return null
      serviceCategoryService.getServiceCategoryById.mockResolvedValue(null);

      // Call the controller method
      await serviceCategoryController.getCategoryById(req, res, next);

      // Assertions
      expect(next).toHaveBeenCalledWith(expect.any(AppError));
      expect(next.mock.calls[0][0].statusCode).toBe(404);
      expect(next.mock.calls[0][0].message).toBe('Service category not found');
    });

    it('should pass service errors to the next middleware', async () => {
      // Set up request parameters
      req.params = { id: 'test-id' };

      // Mock service throwing an error
      const error = new Error('Service error');
      serviceCategoryService.getServiceCategoryById.mockRejectedValue(error);

      // Call the controller method
      await serviceCategoryController.getCategoryById(req, res, next);

      // Assertions
      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('updateCategory', () => {
    it('should update a service category', async () => {
      // Set up request data
      req.params = { id: 'test-id' };
      req.body = {
        name: 'Updated Category',
        description: 'Updated Description',
      };

      // Mock service response
      const mockUpdatedCategory = {
        serviceCategoryId: 'test-id',
        ...req.body,
      };

      serviceCategoryService.updateServiceCategory.mockResolvedValue(
        mockUpdatedCategory,
      );

      // Call the controller method
      await serviceCategoryController.updateCategory(req, res, next);

      // Assertions
      expect(serviceCategoryService.updateServiceCategory).toHaveBeenCalledWith(
        'test-id',
        {
          name: 'Updated Category',
          description: 'Updated Description',
          displayOrder: undefined,
          isPopular: undefined,
          vehicleType: undefined,
        },
      );

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalled();
      expect(formatSuccess).toHaveBeenCalledWith(
        mockUpdatedCategory,
        'Service category updated successfully',
        200,
      );
    });

    it('should include file data when updating with an icon', async () => {
      // Set up request data
      req.params = { id: 'test-id' };
      req.body = { name: 'Updated Category' };
      req.fileData = {
        location: 'https://example.com/updated-icon.png',
        originalName: 'updated-icon.png',
      };

      // Mock service response
      const mockUpdatedCategory = {
        serviceCategoryId: 'test-id',
        name: 'Updated Category',
        icon: 'https://example.com/updated-icon.png',
      };

      serviceCategoryService.updateServiceCategory.mockResolvedValue(
        mockUpdatedCategory,
      );

      // Call the controller method
      await serviceCategoryController.updateCategory(req, res, next);

      // Assertions
      expect(serviceCategoryService.updateServiceCategory).toHaveBeenCalledWith(
        'test-id',
        {
          name: 'Updated Category',
          description: undefined,
          displayOrder: undefined,
          isPopular: undefined,
          vehicleType: undefined,
          icon: 'https://example.com/updated-icon.png',
        },
      );

      expect(logger.info).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalled();
      expect(formatSuccess).toHaveBeenCalledWith(
        mockUpdatedCategory,
        'Service category updated successfully',
        200,
      );
    });

    it('should pass service errors to the next middleware', async () => {
      // Set up request parameters
      req.params = { id: 'test-id' };

      // Mock service throwing an error
      const error = new Error('Service error');
      serviceCategoryService.updateServiceCategory.mockRejectedValue(error);

      // Call the controller method
      await serviceCategoryController.updateCategory(req, res, next);

      // Assertions
      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('deleteCategory', () => {
    it('should delete a service category', async () => {
      // Set up request parameters
      req.params = { id: 'test-id' };

      // Mock service response
      const mockDeletedCategory = {
        serviceCategoryId: 'test-id',
        name: 'Deleted Category',
      };

      serviceCategoryService.deleteServiceCategory.mockResolvedValue(
        mockDeletedCategory,
      );

      // Call the controller method
      await serviceCategoryController.deleteCategory(req, res, next);

      // Assertions
      expect(serviceCategoryService.deleteServiceCategory).toHaveBeenCalledWith(
        'test-id',
      );
      expect(res.status).toHaveBeenCalledWith(204);
      expect(res.send).toHaveBeenCalled();
    });

    it('should return an error if ID is not provided', async () => {
      // Call the controller method without an ID
      await serviceCategoryController.deleteCategory(req, res, next);

      // Assertions
      expect(next).toHaveBeenCalledWith(expect.any(AppError));
      expect(next.mock.calls[0][0].statusCode).toBe(400);
      expect(next.mock.calls[0][0].message).toBe('Category ID is required');
    });

    it('should handle not found errors', async () => {
      // Set up request parameters
      req.params = { id: 'test-id' };

      // Mock service return null
      serviceCategoryService.deleteServiceCategory.mockResolvedValue(null);

      // Call the controller method
      await serviceCategoryController.deleteCategory(req, res, next);

      // Assertions
      expect(next).toHaveBeenCalledWith(expect.any(AppError));
      expect(next.mock.calls[0][0].statusCode).toBe(404);
      expect(next.mock.calls[0][0].message).toBe('Service category not found');
    });

    it('should pass service errors to the next middleware', async () => {
      // Set up request parameters
      req.params = { id: 'test-id' };

      // Mock service throwing an error
      const error = new Error('Service error');
      serviceCategoryService.deleteServiceCategory.mockRejectedValue(error);

      // Call the controller method
      await serviceCategoryController.deleteCategory(req, res, next);

      // Assertions
      expect(next).toHaveBeenCalledWith(error);
    });
  });
});
