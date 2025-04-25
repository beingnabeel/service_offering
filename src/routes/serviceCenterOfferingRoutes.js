const express = require('express');
const rateLimit = require('express-rate-limit');
const router = express.Router();

// Import authentication middleware
const { authenticate, restrictTo } = require('../middlewares/authMiddleware');
const serviceCenterOfferingController = require('../controllers/serviceCenterOfferingController');
const { validate } = require('../middlewares/validationMiddlewares');
const {
  validateServiceCenterOffering,
  validateUpdateServiceCenterOffering,
} = require('../validators/serviceCenterOfferingValidator');
const createOfferingLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again after 15 minutes',
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});
// Routes for managing service center offerings

// Create a new service offering
router.post(
  '/:serviceCenterId/offerings',
  // Authenticate and authorize - ADMIN only
  authenticate,
  restrictTo('ADMIN'),
  createOfferingLimiter,
  validate(validateServiceCenterOffering),
  serviceCenterOfferingController.createServiceCenterOffering,
);

// Update a service offering
router.patch(
  '/:serviceCenterId/offerings/:serviceCenterOfferingId',
  // Authenticate and authorize - ADMIN only
  authenticate,
  restrictTo('ADMIN'),
  validate(validateUpdateServiceCenterOffering),
  serviceCenterOfferingController.updateServiceCenterOffering,
);

// Get all service offerings for a service center
router.get(
  '/:serviceCenterId/offerings',
  // Authenticate - Both ADMIN and USER can access
  authenticate,
  serviceCenterOfferingController.getServiceCenterOfferings,
);

// Get a specific service offering by ID
router.get(
  '/:serviceCenterId/offerings/:serviceCenterOfferingId',
  // Authenticate - Both ADMIN and USER can access
  authenticate,
  serviceCenterOfferingController.getServiceCenterOffering,
);

// Get a specific service offering with its components
router.get(
  '/:serviceCenterId/offerings/:serviceCenterOfferingId/with-components',
  // Authenticate - Both ADMIN and USER can access
  authenticate,
  serviceCenterOfferingController.getServiceCenterOfferingWithComponents,
);

module.exports = router;
