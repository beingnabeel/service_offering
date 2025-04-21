const catchAsync = require('../utils/catchAsync');
// const AppError = require('../utils/appError');
const {
  createInvalidIdError,
  createInternalError,
  createNotFoundError,
} = require('../controllers/errorController');
const serviceTypeService = require('../services/serviceTypeService');
const { formatSuccess } = require('../utils/responseFormatter');
const { logger } = require('../utils/logger');

const createType = catchAsync(async (req, res, next) => {
  const typeData = {
    name: req.body.name,
    description: req.body.description,
    longDescription: req.body.longDescription,
    estimatedDuration: req.body.estimatedDuration,
    categoryId: req.body.categoryId,
    recommendedFrequency: req.body.recommendedFrequency,
    warningThreshold: req.body.warningThreshold,
    displayOrder: req.body.displayOrder,
    isPopular: req.body.isPopular,
  };

  if (req.fileData) {
    typeData.displayImage = req.fileData.location;
    logger.info({
      message: 'Service type display image uploaded',
      metadata: {
        fileName: req.fileData.originalName,
        fileUrl: req.fileData.location,
      },
    });
  }

  const serviceType = await serviceTypeService.createServiceType(typeData);

  if (!serviceType) {
    return next(createInternalError('Failed to create service type'));
  }
  res
    .status(201)
    .json(formatSuccess(serviceType, 'Service type created successfully', 201));
});

const getTypeById = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  // Basic UUID validation (adjust regex if needed for specific UUID versions)
  const uuidRegex =
    /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
  if (!id || !uuidRegex.test(id)) {
    return next(createInvalidIdError(id, 'service type'));
  }

  // Service layer now handles the 'not found' case (404)
  const serviceType = await serviceTypeService.getServiceTypeById(id);

  res
    .status(200)
    .json(
      formatSuccess(serviceType, 'Service type retrieved successfully', 200),
    );
});

const updateType = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const uuidRegex =
    /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
  if (!id || !uuidRegex.test(id)) {
    return next(createInvalidIdError(id, 'service type'));
  }
  const updateData = {
    name: req.body.name,
    description: req.body.description,
    longDescription: req.body.longDescription,
    estimatedDuration: req.body.estimatedDuration,
    categoryId: req.body.categoryId,
    recommendedFrequency: req.body.recommendedFrequency,
    warningThreshold: req.body.warningThreshold,
    displayOrder: req.body.displayOrder,
    isPopular: req.body.isPopular,
  };
  if (req.fileData) {
    updateData.displayImage = req.fileData.location;
    logger.info({
      message: 'Service type display image updated',
      metadata: {
        fileName: req.fileData.originalName,
        fileUrl: req.fileData.location,
      },
    });
  }

  const updatedType = await serviceTypeService.updateServiceType(
    id,
    updateData,
  );

  res
    .status(200)
    .json(formatSuccess(updatedType, 'Service type updated successfully', 200));
});

const getTypesByCategoryId = catchAsync(async (req, res, next) => {
  const { id } = req.params; // This matches the :id parameter in the route /:id/types

  // Basic UUID validation for category ID
  const uuidRegex =
    /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
  if (!id || !uuidRegex.test(id)) {
    return next(createInvalidIdError(id, 'service category'));
  }

  try {
    // Call the service function to get types by category ID
    const result = await serviceTypeService.getServiceTypesByCategoryId(
      id,
      req.query,
    );

    // Check if result is empty but valid
    if (!result.data || result.data.length === 0) {
      // Still return success but with empty data and a specific message
      return res
        .status(200)
        .json(
          formatSuccess(
            { data: [], meta: { total: 0, page: 1, limit: 10, totalPages: 0 } },
            'No service types found for this category',
            200,
          ),
        );
    }

    // Return success response with data
    return res
      .status(200)
      .json(formatSuccess(result, 'Service types retrieved successfully', 200));
  } catch (error) {
    // Pass any errors to the global error handler
    next(error);
  }
});

const deleteType = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const uuidRegex =
    /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
  if (!id || !uuidRegex.test(id)) {
    return next(createInvalidIdError(id, 'service type'));
  }

  const deletedType = await serviceTypeService.deleteServiceType(id);
  if (!deletedType) {
    return next(createNotFoundError(id, 'Service type not found'));
  }

  return res.status(204).send();
});

module.exports = {
  createType,
  getTypeById,
  updateType,
  getTypesByCategoryId,
  deleteType,
};
