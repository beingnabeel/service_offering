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

// Associate a component with a service type
const associateComponentWithType = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  // Basic UUID validation
  const uuidRegex =
    /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
  if (!id || !uuidRegex.test(id)) {
    return next(createInvalidIdError(id, 'service type'));
  }

  // Basic validation for required service component ID
  if (!req.body.serviceComponentId) {
    return next(createInternalError('Service component ID is required'));
  }

  try {
    const typeComponent = await serviceTypeService.associateComponentWithType(
      id,
      req.body,
    );

    return res
      .status(201)
      .json(
        formatSuccess(
          typeComponent,
          'Component associated with service type successfully',
          201,
        ),
      );
  } catch (error) {
    next(error);
  }
});

// Get all components associated with a service type
// const getTypeComponents = catchAsync(async (req, res, next) => {
//   const { id } = req.params;

//   // Basic UUID validation
//   const uuidRegex =
//     /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
//   if (!id || !uuidRegex.test(id)) {
//     return next(createInvalidIdError(id, 'service type'));
//   }

//   try {
//     // Get all components associated with the service type
//     const components = await serviceTypeService.getComponentsByTypeId(id);

//     // If no components are found, return empty array with success message
//     if (!components || components.length === 0) {
//       return res
//         .status(200)
//         .json(
//           formatSuccess([], 'No components found for this service type', 200),
//         );
//     }

//     // Return the response in the requested format - formatSuccess already handles this correctly
//     return res
//       .status(200)
//       .json(
//         formatSuccess(components, 'Components retrieved successfully', 200),
//       );
//   } catch (error) {
//     next(error);
//   }
// });
// the above one is working fine ( changed it to use the apifeatures)
const getTypeComponents = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  // Basic UUID validation
  const uuidRegex =
    /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
  if (!id || !uuidRegex.test(id)) {
    return next(createInvalidIdError(id, 'service type'));
  }

  try {
    // Pass the query parameters to the service layer for filtering, sorting, and pagination
    const result = await serviceTypeService.getComponentsByTypeId(
      id,
      req.query,
    );

    // If no components are found, return empty array with pagination metadata
    if (!result.data || result.data.length === 0) {
      return res.status(200).json(
        formatSuccess(
          {
            data: [],
            meta: result.meta || {
              total: 0,
              page: 1,
              limit: 10,
              totalPages: 0,
            },
          },
          'No components found for this service type',
          200,
        ),
      );
    }

    // Return the response with data and metadata
    return res
      .status(200)
      .json(formatSuccess(result, 'Components retrieved successfully', 200));
  } catch (error) {
    next(error);
  }
});

// Remove a component from a service type
const removeTypeComponent = catchAsync(async (req, res, next) => {
  const { id, componentId } = req.params;

  // Basic UUID validation for service type ID
  const uuidRegex =
    /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
  if (!id || !uuidRegex.test(id)) {
    return next(createInvalidIdError(id, 'service type'));
  }

  // Basic UUID validation for component ID
  if (!componentId || !uuidRegex.test(componentId)) {
    return next(createInvalidIdError(componentId, 'service component'));
  }

  try {
    await serviceTypeService.removeComponentFromType(id, componentId);

    // Return 204 No Content for successful deletion
    return res.status(204).send();
  } catch (error) {
    next(error);
  }
});

module.exports = {
  createType,
  getTypeById,
  updateType,
  getTypesByCategoryId,
  deleteType,
  associateComponentWithType,
  getTypeComponents,
  removeTypeComponent,
};
