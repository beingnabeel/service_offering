const { formatSuccess } = require('../utils/responseFormatter');
const {
  createInvalidIdError,
  createNotFoundError,
} = require('../controllers/errorController');
const serviceCenterOfferingService = require('../services/serviceCenterOfferingService');
const catchAsync = require('../utils/catchAsync');

/**
 * Create a new service center offering for a specific service center
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * @returns {Object} - Created service center offering
 */
const createServiceCenterOffering = catchAsync(async (req, res, next) => {
  const { serviceCenterId } = req.params;

  // Basic UUID validation for service center ID
  const uuidRegex =
    /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
  if (!serviceCenterId || !uuidRegex.test(serviceCenterId)) {
    return next(createInvalidIdError(serviceCenterId, 'service center'));
  }

  try {
    // Include the service center ID in the request body for creation
    const offeringData = { ...req.body, serviceCenterId };

    // Call the service function to create the offering
    const createdOffering =
      await serviceCenterOfferingService.createServiceCenterOffering(
        serviceCenterId,
        offeringData,
        req,
      );

    // Return the created offering with status 201
    return res.status(201).json(formatSuccess(createdOffering));
  } catch (error) {
    next(error);
  }
});

/**
 * Get all service offerings for a specific service center
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * @returns {Object} - List of service center offerings
 */
const getServiceCenterOfferings = catchAsync(async (req, res, next) => {
  const { serviceCenterId } = req.params;

  // Basic UUID validation for service center ID
  const uuidRegex =
    /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
  if (!serviceCenterId || !uuidRegex.test(serviceCenterId)) {
    return next(createInvalidIdError(serviceCenterId, 'service center'));
  }

  // Get query parameters for filtering, sorting, and pagination
  const offerings =
    await serviceCenterOfferingService.getServiceCenterOfferings(
      serviceCenterId,
      req.query,
    );

  return res.status(200).json(formatSuccess(offerings));
});

/**
 * Get a specific service offering by ID for a specific service center
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * @returns {Object} - Service center offering
 */
const getServiceCenterOffering = catchAsync(async (req, res, next) => {
  const { serviceCenterId, serviceCenterOfferingId } = req.params;

  // Basic UUID validation for service center ID
  const uuidRegex =
    /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
  if (!serviceCenterId || !uuidRegex.test(serviceCenterId)) {
    return next(createInvalidIdError(serviceCenterId, 'service center'));
  }
  if (!serviceCenterOfferingId || !uuidRegex.test(serviceCenterOfferingId)) {
    return next(
      createInvalidIdError(serviceCenterOfferingId, 'service center offering'),
    );
  }

  const offering = await serviceCenterOfferingService.getServiceCenterOffering(
    serviceCenterId,
    serviceCenterOfferingId,
  );

  if (!offering) {
    return next(
      createNotFoundError(serviceCenterOfferingId, 'service center offering'),
    );
  }

  return res.status(200).json(formatSuccess(offering));
});

/**
 * Update a specific service offering for a specific service center
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * @returns {Object} - Updated service center offering
 */
const updateServiceCenterOffering = catchAsync(async (req, res, next) => {
  const { serviceCenterId, serviceCenterOfferingId } = req.params;

  // Basic UUID validation for IDs
  const uuidRegex =
    /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
  if (!serviceCenterId || !uuidRegex.test(serviceCenterId)) {
    return next(createInvalidIdError(serviceCenterId, 'service center'));
  }
  if (!serviceCenterOfferingId || !uuidRegex.test(serviceCenterOfferingId)) {
    return next(
      createInvalidIdError(serviceCenterOfferingId, 'service center offering'),
    );
  }

  try {
    // Call the service function to update the offering
    const updatedOffering =
      await serviceCenterOfferingService.updateServiceCenterOffering(
        serviceCenterId,
        serviceCenterOfferingId,
        req.body,
        req,
      );

    if (!updatedOffering) {
      return next(
        createNotFoundError(serviceCenterOfferingId, 'service center offering'),
      );
    }

    // Return the updated offering
    return res.status(200).json(formatSuccess(updatedOffering));
  } catch (error) {
    next(error);
  }
});

/**
 * Get a specific service offering with its components for a specific service center
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * @returns {Object} - Service center offering with components
 */

const getServiceCenterOfferingWithComponents = catchAsync(
  async (req, res, next) => {
    const { serviceCenterId, serviceCenterOfferingId } = req.params;

    // Basic UUID validation for service center ID
    const uuidRegex =
      /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
    if (!serviceCenterId || !uuidRegex.test(serviceCenterId)) {
      return next(createInvalidIdError(serviceCenterId, 'service center'));
    }
    if (!serviceCenterOfferingId || !uuidRegex.test(serviceCenterOfferingId)) {
      return next(
        createInvalidIdError(
          serviceCenterOfferingId,
          'service center offering',
        ),
      );
    }

    try {
      // Pass all query parameters directly to the service layer
      const offeringWithComponents =
        await serviceCenterOfferingService.getServiceCenterOfferingWithComponents(
          serviceCenterId,
          serviceCenterOfferingId,
          req.query,
        );

      if (!offeringWithComponents) {
        return next(
          createNotFoundError(
            serviceCenterOfferingId,
            'service center offering',
          ),
        );
      }

      return res
        .status(200)
        .json(
          formatSuccess(
            offeringWithComponents,
            'Service center offering with components retrieved successfully',
            200,
          ),
        );
    } catch (error) {
      next(error);
    }
  },
);

module.exports = {
  createServiceCenterOffering,
  getServiceCenterOfferings,
  getServiceCenterOffering,
  updateServiceCenterOffering,
  getServiceCenterOfferingWithComponents,
};
