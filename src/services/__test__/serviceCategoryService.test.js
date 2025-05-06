// src/services/__tests__/serviceCategoryService.test.js
const serviceCategoryService = require('../serviceCategoryService');
const axios = require('axios');
const prisma = require('../../models/index');
const { logger } = require('../../utils/logger');

// Mock dependencies
jest.mock('axios');
jest.mock('../../models/index');
jest.mock('../../utils/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  },
}));
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

describe('serviceCategoryService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createServiceCategory', () => {
    const categoryData = {
      name: 'Test Category',
      description: 'Test Description',
      vehicleType: 'CAR',
      icon: 'test-icon-url',
    };

    it('should create a service category through the injection service', async () => {
      // Mock axios response
      axios.post.mockResolvedValue({
        data: {
          data: {
            serviceCategoryId: 'test-id',
            ...categoryData,
          },
        },
      });

      const result =
        await serviceCategoryService.createServiceCategory(categoryData);

      expect(axios.post).toHaveBeenCalledWith(
        'http://localhost:5001/api/v1/categories',
        categoryData,
      );
      expect(result).toEqual({
        serviceCategoryId: 'test-id',
        ...categoryData,
      });
      expect(logger.info).toHaveBeenCalled();
    });

    it('should handle unique constraint errors from the injection service', async () => {
      // Mock axios error response
      axios.post.mockRejectedValue({
        response: {
          status: 409,
          data: {
            message: 'Category already exists',
          },
        },
      });

      await expect(
        serviceCategoryService.createServiceCategory(categoryData),
      ).rejects.toThrow(
        'service category already exists with this name',
      );

      expect(logger.error).toHaveBeenCalled();
    });

    it('should handle other errors from the injection service', async () => {
      // Mock axios error response
      axios.post.mockRejectedValue({
        response: {
          status: 500,
          data: {
            message: 'Internal server error',
          },
        },
      });

      await expect(
        serviceCategoryService.createServiceCategory(categoryData),
      ).rejects.toThrow('Internal server error');

      expect(logger.error).toHaveBeenCalled();
    });
  });

  describe('getServiceCategoryById', () => {
    it('should return a service category by ID', async () => {
      const mockCategory = {
        serviceCategoryId: 'test-id',
        name: 'Test Category',
        description: 'Test Description',
        vehicleType: 'CAR',
      };

      prisma.serviceCategory.findUnique.mockResolvedValue(mockCategory);

      const result =
        await serviceCategoryService.getServiceCategoryById('test-id');

      expect(prisma.serviceCategory.findUnique).toHaveBeenCalledWith({
        where: { serviceCategoryId: 'test-id' },
      });
      expect(result).toEqual(mockCategory);
      expect(logger.info).toHaveBeenCalled();
    });

    it('should throw an error if category is not found', async () => {
      prisma.serviceCategory.findUnique.mockResolvedValue(null);

      await expect(
        serviceCategoryService.getServiceCategoryById('test-id'),
      ).rejects.toThrow('service category not found');

      expect(logger.warn).toHaveBeenCalled();
    });

    it('should handle database errors', async () => {
      const dbError = new Error('Database error');
      prisma.serviceCategory.findUnique.mockRejectedValue(dbError);

      await expect(
        serviceCategoryService.getServiceCategoryById('test-id'),
      ).rejects.toThrow('Failed to retrieve service category by ID: test-id');

      expect(logger.error).toHaveBeenCalled();
    });
  });

  describe('getAllServiceCategories', () => {
    it('should return all service categories with pagination', async () => {
      const mockCategories = [
        { serviceCategoryId: '1', name: 'Category 1' },
        { serviceCategoryId: '2', name: 'Category 2' },
      ];

      // Mock query builder methods
      prisma.serviceCategory.findMany.mockResolvedValue(mockCategories);
      prisma.serviceCategory.count.mockResolvedValue(2);

      const result = await serviceCategoryService.getAllServiceCategories({
        page: 1,
        limit: 10,
      });

      expect(result).toEqual({
        data: mockCategories,
        meta: {
          total: 2,
          page: 1,
          limit: 10,
          totalPages: 1,
          hasNextPage: false,
          hasPrevPage: false,
        },
      });
      expect(logger.info).toHaveBeenCalled();
    });

    it('should handle empty results properly', async () => {
      prisma.serviceCategory.findMany.mockResolvedValue([]);
      prisma.serviceCategory.count.mockResolvedValue(0);

      const result = await serviceCategoryService.getAllServiceCategories({});

      expect(result).toEqual({
        data: [],
        meta: {
          total: 0,
          page: 1,
          limit: 100,
          totalPages: 0,
          hasNextPage: false,
          hasPrevPage: false,
        },
      });
    });

    it('should handle database errors', async () => {
      prisma.serviceCategory.findMany.mockRejectedValue(
        new Error('Database error'),
      );

      await expect(
        serviceCategoryService.getAllServiceCategories({}),
      ).rejects.toThrow('Database error');

      expect(logger.error).toHaveBeenCalled();
    });
  });

  describe('updateServiceCategory', () => {
    const updateData = {
      name: 'Updated Category',
      description: 'Updated Description',
    };

    it('should update a service category through the injection service', async () => {
      // Mock axios response
      axios.patch.mockResolvedValue({
        data: {
          data: {
            serviceCategoryId: 'test-id',
            ...updateData,
          },
        },
      });

      const result = await serviceCategoryService.updateServiceCategory(
        'test-id',
        updateData,
      );

      expect(axios.patch).toHaveBeenCalledWith(
        'http://localhost:5001/api/v1/categories/test-id',
        updateData,
      );
      expect(result).toEqual({
        serviceCategoryId: 'test-id',
        ...updateData,
      });
      expect(logger.info).toHaveBeenCalled();
    });

    it('should handle not found errors from the injection service', async () => {
      // Mock axios error response
      axios.patch.mockRejectedValue({
        response: {
          status: 404,
          data: {
            message: 'Category not found',
          },
        },
      });

      await expect(
        serviceCategoryService.updateServiceCategory('test-id', updateData),
      ).rejects.toThrow('service category not found');

      expect(logger.error).toHaveBeenCalled();
    });
  });

  describe('deleteServiceCategory', () => {
    it('should delete a service category through the injection service', async () => {
      // Mock axios response
      axios.delete.mockResolvedValue({});

      const result =
        await serviceCategoryService.deleteServiceCategory('test-id');

      expect(axios.delete).toHaveBeenCalledWith(
        'http://localhost:5001/api/v1/categories/test-id',
      );
      expect(result).toBe(true);
      expect(logger.info).toHaveBeenCalled();
    });

    it('should handle not found errors from the injection service', async () => {
      // Mock axios error response
      axios.delete.mockRejectedValue({
        response: {
          status: 404,
          data: {
            message: 'Category not found',
          },
        },
      });

      await expect(
        serviceCategoryService.deleteServiceCategory('test-id'),
      ).rejects.toThrow('service category not found');

      expect(logger.error).toHaveBeenCalled();
    });

    it('should handle dependency errors from the injection service', async () => {
      // Mock axios error response
      axios.delete.mockRejectedValue({
        response: {
          status: 400,
          data: {
            message: 'Category has dependencies',
          },
        },
      });

      await expect(
        serviceCategoryService.deleteServiceCategory('test-id'),
      ).rejects.toThrow('Cannot delete category with associated service types');

      expect(logger.error).toHaveBeenCalled();
    });
  });
});
