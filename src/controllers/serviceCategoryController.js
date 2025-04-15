const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const serviceCategoryService = require('../services/serviceCategoryService');
const { formatSuccess } = require('../utils/responseFormatter');
const { logger } = require('../utils/logger');

/**
 * Create a new service category
 */
const createCategory = catchAsync(async (req, res) => {
  // Extract data from the request body
  const categoryData = {
    name: req.body.name,
    description: req.body.description,
    vehicleType: req.body.vehicleType,
    displayOrder: req.body.displayOrder,
    isPopular: req.body.isPopular,
  };

  // If file data is available from the middleware, add the file URL to categoryData and log
  if (req.fileData) {
    categoryData.icon = req.fileData.location;

    // Log successful file upload
    logger.info({
      message: 'Service category icon uploaded',
      metadata: {
        fileName: req.fileData.originalName,
        fileUrl: req.fileData.location,
      },
    });
  }

  // Create the service category using the service layer
  const serviceCategory =
    await serviceCategoryService.createServiceCategory(categoryData);

  // Return success response
  res
    .status(201)
    .json(
      formatSuccess(
        serviceCategory,
        'Service category created successfully',
        201,
      ),
    );
});

/**
 * Get all service categories
 */
const getAllCategories = catchAsync(async (req, res, next) => {
  try {
    // Pass the query parameters directly to the service layer
    // The APIFeatures utility will handle all the filtering, sorting, pagination, etc.
    const result = await serviceCategoryService.getAllServiceCategories(
      req.query,
    );

    // Check if result is empty but valid
    if (!result.data || result.data.length === 0) {
      // Still return success but with empty data and a specific message
      return res
        .status(200)
        .json(
          formatSuccess(
            { data: [], meta: result.meta },
            'No service categories found matching the criteria',
            200,
          ),
        );
    }

    // Return success response with data
    return res
      .status(200)
      .json(
        formatSuccess(result, 'Service categories retrieved successfully', 200),
      );
  } catch (error) {
    // If it's a Prisma error, our global error handler will handle it appropriately
    // If it's any other type of error, let the global handler process it
    next(error);
  }
});

/**
 * Update a service category
 */
const updateCategory = catchAsync(async (req, res) => {
  const { id } = req.params;

  // Extract data from the request body
  const updateData = {
    name: req.body.name,
    description: req.body.description,
    vehicleType: req.body.vehicleType,
    displayOrder: req.body.displayOrder,
    isPopular: req.body.isPopular,
  };

  // If file data is available from the middleware, add the file URL to updateData
  if (req.fileData) {
    updateData.icon = req.fileData.location;

    // Log successful file upload
    logger.info({
      message: 'Service category icon updated',
      metadata: {
        categoryId: id,
        fileName: req.fileData.originalName,
        fileUrl: req.fileData.location,
      },
    });
  }

  // Update the service category using the service layer
  const updatedCategory = await serviceCategoryService.updateServiceCategory(
    id,
    updateData,
  );

  // Return success response
  res
    .status(200)
    .json(
      formatSuccess(
        updatedCategory,
        'Service category updated successfully',
        200,
      ),
    );
});

const getCategoryById = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  if (!id) {
    return next(new AppError('Category ID is required', 400));
  }
  // Get the service category by ID using the service layer
  const serviceCategory =
    await serviceCategoryService.getServiceCategoryById(id);

  if (!serviceCategory) {
    return next(new AppError('Service category not found', 404));
  }

  // Return success response
  res
    .status(200)
    .json(
      formatSuccess(
        serviceCategory,
        'Service category retrieved successfully',
        200,
      ),
    );
});
/**
 * Delete a service category
 */
const deleteCategory = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  if (!id) {
    return next(new AppError('Category ID is required', 400));
  }

  // Delete the service category using the service layer
  const deletedCategory =
    await serviceCategoryService.deleteServiceCategory(id);

  if (!deletedCategory) {
    return next(new AppError('Service category not found', 404));
  }

  // Return success response
  // res
  //   .status(200)
  //   .json(
  //     formatSuccess(
  //       deletedCategory,
  //       "Service category deleted successfully",
  //       200
  //     )
  //   );
  return res.status(204).send();
});

module.exports = {
  createCategory,
  getAllCategories,
  updateCategory,
  deleteCategory,
  getCategoryById,
};
