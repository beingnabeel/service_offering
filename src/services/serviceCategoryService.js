const prisma = require("../models/index");
const AppError = require("../utils/appError");
const APIFeatures = require("../utils/apiFeatures");
const { logger } = require("../utils/logger");
const axios = require("axios");

// Injection service base URL
const INJECTION_SERVICE_URL =
  process.env.INJECTION_SERVICE_URL || "http://localhost:5001";

/**
 * Create a new service category
 * @param {Object} categoryData - Service category data
 * @returns {Promise<Object>} Created service category
 */
const createServiceCategory = async (categoryData) => {
  try {
    logger.info({
      message: "Forwarding category creation to Injection Service",
      metadata: { categoryName: categoryData.name },
    });

    // Forward the write operation to the Injection Service
    const response = await axios.post(
      `${INJECTION_SERVICE_URL}/api/v1/categories`,
      categoryData
    );

    const serviceCategory = response.data.data;

    logger.info({
      message: "Service category created successfully via Injection Service",
      metadata: { serviceCategoryId: serviceCategory.serviceCategoryId },
    });

    return serviceCategory;
  } catch (error) {
    logger.error({
      message: "Error creating service category via Injection Service",
      metadata: {
        error: error.response?.data?.message || error.message,
        stack: error.stack,
      },
    });

    // Check for specific error responses from the injection service
    if (error.response?.status === 409) {
      throw new AppError(
        "A service category with this name and vehicle type already exists",
        409
      );
    }

    throw new AppError(
      error.response?.data?.message || "Failed to create service category",
      error.response?.status || 500
    );
  }
};

/**
 * Get all service categories with filtering, sorting, pagination and field selection
 * @param {Object} queryOptions - Query parameters for filtering and pagination
 * @returns {Promise<Object>} Service categories with pagination metadata
 */
const getAllServiceCategories = async (queryOptions) => {
  try {
    // Import the APIFeatures class
    const APIFeatures = require("../utils/apiFeatures");

    // Define allowed filter fields for service categories
    const ALLOWED_FILTER_FIELDS = [
      "serviceCategoryId",
      "name",
      "description",
      "vehicleType",
      "icon",
      "displayOrder",
      "isPopular",
      "createdAt",
      "updatedAt",
    ];

    // Helper function to validate if a field is allowed for filtering
    const isAllowedField = (field) => {
      // Check if it's a direct match with allowed fields
      if (ALLOWED_FILTER_FIELDS.includes(field)) return true;

      // Check if it's an operator on an allowed field
      // Example: 'name_contains' or 'createdAt[gte]'
      if (field.includes("[") && field.includes("]")) {
        const baseField = field.split("[")[0];
        return ALLOWED_FILTER_FIELDS.includes(baseField);
      }

      // Handle standard operator formats like 'createdAt.gte'
      if (field.includes(".")) {
        const baseField = field.split(".")[0];
        return ALLOWED_FILTER_FIELDS.includes(baseField);
      }

      return false;
    };

    // Initialize with a proper query builder, not just the model
    // The starting point needs to be a query builder object that can accept method calls
    let baseQuery = {
      // Store reference to the model
      model: prisma.serviceCategory,

      // Store the where conditions (will be built by the APIFeatures)
      whereConditions: {},

      // Store the orderBy conditions (will be built by the APIFeatures)
      orderByConditions: [{ createdAt: "desc" }], // Default sorting

      // Store the select conditions (will be built by the APIFeatures)
      selectConditions: undefined,

      // Store pagination parameters
      skipValue: 0,
      takeValue: 100, // Default limit

      // Define method functions that match the ones expected by APIFeatures
      orderBy: function (orderByParams) {
        this.orderByConditions = orderByParams;
        return this;
      },

      select: function (selectParams) {
        this.selectConditions = selectParams;
        return this;
      },

      where: function (whereParams) {
        // Filter out invalid fields before adding to where conditions
        const validWhereParams = {};

        Object.keys(whereParams).forEach((key) => {
          if (isAllowedField(key)) {
            validWhereParams[key] = whereParams[key];
          } else {
            // Log invalid fields for debugging, but don't add them to the query
            logger.warn({
              message: `Ignoring invalid filter field: ${key}`,
              metadata: { value: whereParams[key] },
            });
          }
        });

        this.whereConditions = { ...this.whereConditions, ...validWhereParams };
        return this;
      },

      skip: function (skipValue) {
        this.skipValue = skipValue;
        return this;
      },

      limit: function (limitValue) {
        this.takeValue = limitValue;
        return this;
      },

      // Custom search implementation for service categories
      // This overrides the search implementation in APIFeatures
      search: function (searchTerm) {
        if (searchTerm) {
          // Only search in fields that exist in the serviceCategory model
          this.whereConditions = {
            ...this.whereConditions,
            OR: [
              { name: { contains: searchTerm, mode: "insensitive" } },
              { description: { contains: searchTerm, mode: "insensitive" } },
            ],
          };
        }
        return this;
      },

      // Method to execute count query
      count: async function () {
        try {
          return await this.model.count({
            where: this.whereConditions,
          });
        } catch (error) {
          // Convert Prisma errors to AppErrors
          if (error.code && error.code.startsWith("P")) {
            throw AppError.fromPrismaError(error);
          }
          throw error;
        }
      },

      // Method to execute find query
      findMany: async function () {
        try {
          return await this.model.findMany({
            where: this.whereConditions,
            orderBy: this.orderByConditions,
            ...(this.selectConditions && { select: this.selectConditions }),
            skip: this.skipValue,
            take: this.takeValue,
          });
        } catch (error) {
          // Convert Prisma errors to AppErrors
          if (error.code && error.code.startsWith("P")) {
            throw AppError.fromPrismaError(error);
          }
          throw error;
        }
      },
    };

    // Initialize the APIFeatures with our custom query builder and query options
    const features = new APIFeatures(baseQuery, queryOptions);

    // Apply filtering
    features.filter();

    // Apply search directly from our custom query builder implementation
    // instead of using the APIFeatures search implementation
    if (queryOptions.search) {
      baseQuery.search(queryOptions.search);
    }

    // Continue with other features
    features.sort().limitFieldsAdvanced();

    // Get the query before pagination for counting total records
    // Create a copy for counting before pagination is applied
    const countQuery = { ...features.query };

    // Apply pagination
    features.paginate();

    // Get total count before pagination for metadata
    const totalCount = await countQuery.count();

    // Execute the final query with all options applied
    const serviceCategories = await features.query.findMany();

    // Calculate pagination metadata
    const page = parseInt(queryOptions.page, 10) || 1;
    const limit = parseInt(queryOptions.limit, 10) || 100;
    const totalPages = Math.ceil(totalCount / limit);

    logger.info({
      message: "Retrieved service categories",
      metadata: { count: serviceCategories.length, totalCount },
    });

    // Return data with pagination metadata
    return {
      data: serviceCategories,
      meta: {
        total: totalCount,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    };
  } catch (error) {
    logger.error({
      message: "Error retrieving service categories",
      metadata: {
        error: error.message,
        code: error.code,
        stack: error.stack,
      },
    });

    // Convert Prisma errors to AppErrors if not already done
    if (
      error.code &&
      error.code.startsWith("P") &&
      !(error instanceof AppError)
    ) {
      throw AppError.fromPrismaError(error);
    }

    // If this is not a known operational error, convert it to an internal server error
    if (!(error instanceof AppError)) {
      throw AppError.internal(
        `Failed to retrieve service categories: ${error.message}`
      );
    }

    // Otherwise, rethrow the AppError for the global error handler
    throw error;
  }
};

const getServiceCategoryById = async (id) => {
  try {
    logger.info({
      message: "Fetching service category by id",
      metadata: { categoryId: id },
    });

    const serviceCategory = await prisma.serviceCategory.findUnique({
      where: { serviceCategoryId: id },
    });

    if (!serviceCategory) {
      logger.warn({
        message: "Service category not found",
        metadata: { categoryId: id },
      });
      throw new AppError("Service category not found", 404);
    }
    logger.info({
      message: "Service category fetched successfully",
      metadata: { serviceCategoryId: serviceCategory.serviceCategoryId },
    });

    return serviceCategory;
  } catch (error) {
    logger.error({
      message: "Error fetching service category by id",
      metadata: { categoryId: id, error: error.message, stack: error.stack },
    });
    throw error;
  }
};
/**
 * Update an existing service category
 * @param {string} id - Service category ID
 * @param {Object} updateData - Updated service category data
 * @returns {Promise<Object>} Updated service category
 */
const updateServiceCategory = async (id, updateData) => {
  try {
    logger.info({
      message: "Forwarding category update to Injection Service",
      metadata: { categoryId: id, updateData },
    });

    // Forward the update operation to the Injection Service
    const response = await axios.patch(
      `${INJECTION_SERVICE_URL}/api/v1/categories/${id}`,
      updateData
    );

    const updatedCategory = response.data.data;

    logger.info({
      message: "Service category updated successfully via Injection Service",
      metadata: { serviceCategoryId: updatedCategory.serviceCategoryId },
    });

    return updatedCategory;
  } catch (error) {
    logger.error({
      message: "Error updating service category via Injection Service",
      metadata: {
        error: error.response?.data?.message || error.message,
        stack: error.stack,
      },
    });

    // Check for specific error responses from the injection service
    if (error.response?.status === 404) {
      throw new AppError("Service category not found", 404);
    } else if (error.response?.status === 409) {
      throw new AppError(
        "A service category with this name and vehicle type already exists",
        409
      );
    }

    throw new AppError(
      error.response?.data?.message || "Failed to update service category",
      error.response?.status || 500
    );
  }
};

/**
 * Delete a service category
 * @param {string} id - Service category ID
 * @returns {Promise<Object>} Deleted service category
 */
const deleteServiceCategory = async (id) => {
  try {
    logger.info({
      message: "Forwarding category deletion to Injection Service",
      metadata: { categoryId: id },
    });

    // Forward the delete operation to the Injection Service
    // const response = await axios.delete(
    //   `${INJECTION_SERVICE_URL}/api/v1/categories/${id}`
    // );
    await axios.delete(`${INJECTION_SERVICE_URL}/api/v1/categories/${id}`);
    logger.info({
      message: "Service category deleted successfully via Injection Service",
      metadata: { serviceCategoryId: id },
    });

    return true;
  } catch (error) {
    logger.error({
      message: "Error deleting service category via Injection Service",
      metadata: {
        error: error.response?.data?.message || error.message,
        stack: error.stack,
      },
    });

    // Check for specific error responses from the injection service
    if (error.response?.status === 404) {
      throw new AppError("Service category not found", 404);
    } else if (error.response?.status === 400) {
      throw new AppError(
        "Cannot delete category with associated service types",
        400
      );
    }

    throw new AppError(
      error.response?.data?.message || "Failed to delete service category",
      error.response?.status || 500
    );
  }
};

module.exports = {
  createServiceCategory,
  getAllServiceCategories,
  updateServiceCategory,
  deleteServiceCategory,
  getServiceCategoryById,
};
