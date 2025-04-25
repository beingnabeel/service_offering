const catchAsync = require('../utils/catchAsync');
const serviceComponentService = require('../services/serviceComponentService');
const { formatSuccess } = require('../utils/responseFormatter');
const { logger } = require('../utils/logger');
const {
  createInvalidIdError,
  createNotFoundError,
  createInternalError,
} = require('./errorController');

const createComponent = catchAsync(async (req, res, next) => {
  const componentData = {
    name: req.body.name,
    description: req.body.description,
    estimatedDuration: req.body.estimatedDuration,
    vehicleType: req.body.vehicleType,
  };
  const serviceComponent =
    await serviceComponentService.createServiceComponent(componentData);
  if (!serviceComponent) {
    return next(createInternalError('Failed to create service component'));
  }
  res
    .status(201)
    .json(
      formatSuccess(
        serviceComponent,
        'Service component created successfully',
        201,
      ),
    );
});

const getAllComponents = catchAsync(async (req, res, next) => {
  try {
    const result = await serviceComponentService.getAllServiceComponents(
      req.query,
    );

    if (!result.data || result.data.length === 0) {
      return res
        .status(200)
        .json(
          formatSuccess(
            { data: [], meta: result.meta },
            'No service components found',
            200,
          ),
        );
    }
    return res
      .status(200)
      .json(
        formatSuccess(result, `Service components retrieved successfully`, 200),
      );
  } catch (error) {
    next(error);
  }
});

const getComponentById = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const uuidRegex =
    /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
  if (!id || !uuidRegex.test(id)) {
    return next(createInvalidIdError(id, 'service category'));
  }
  const serviceComponent =
    await serviceComponentService.getServiceComponentById(id);
  if (!serviceComponent) {
    return next(createNotFoundError(id, 'Service component not found'));
  }
  res
    .status(200)
    .json(
      formatSuccess(
        serviceComponent,
        'Service component retrieved successfully',
        200,
      ),
    );
});
const updateComponent = catchAsync(async (req, res) => {
  const { id } = req.params;
  const updateData = {
    name: req.body.name,
    description: req.body.description,
    estimatedDuration: req.body.estimatedDuration,
    vehicleType: req.body.vehicleType,
  };
  const updatedComponent = await serviceComponentService.updateServiceComponent(
    id,
    updateData,
  );

  res
    .status(200)
    .json(
      formatSuccess(
        updatedComponent,
        'Service component updated successfully',
        200,
      ),
    );
});

const deleteComponent = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const uuidRegex =
    /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
  if (!id || !uuidRegex.test(id)) {
    return next(createInvalidIdError(id, 'service component'));
  }
  await serviceComponentService.deleteServiceComponent(id);
  return res.status(204).send();
});

module.exports = {
  createComponent,
  getAllComponents,
  updateComponent,
  getComponentById,
  deleteComponent,
};
