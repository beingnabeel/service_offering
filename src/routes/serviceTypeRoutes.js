const express = require('express');
const rateLimit = require('express-rate-limit');
const router = express.Router();
const serviceTypeController = require('../controllers/serviceTypeController');
// Import authentication middleware
const { authenticate, restrictTo } = require('../middlewares/authMiddleware');
const {
  validateServiceType,
  validateUpdateServiceType,
} = require('../validators/serviceTypeValidator');
const { validate } = require('../middlewares/validationMiddlewares');
const { uploadServiceTypeImage } = require('../middlewares/uploadMiddleware');

router.route('/').post(
  // Authenticate and authorize - ADMIN only
  authenticate,
  restrictTo('ADMIN'),
  // First handle the file upload
  uploadServiceTypeImage[0], // multer middleware to handle file upload
  uploadServiceTypeImage[1], // middleware to process and upload file to S3
  // Then validate the request body
  validate(validateServiceType),
  // Finally process the request
  serviceTypeController.createType,
);
// .get(serviceTypeController.getAllTypes);

// Rate limiter for the GET by ID endpoint
const getTypeByIdLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again after 15 minutes',
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

router
  .route('/:id')
  .get(
    // Authenticate - Both ADMIN and USER can access
    authenticate,
    getTypeByIdLimiter,
    serviceTypeController.getTypeById,
  )
  .patch(
    // Authenticate and authorize - ADMIN only
    authenticate,
    restrictTo('ADMIN'),
    uploadServiceTypeImage[0],
    uploadServiceTypeImage[1],
    validate(validateUpdateServiceType),
    getTypeByIdLimiter,
    serviceTypeController.updateType,
  )
  .delete(
    // Authenticate and authorize - ADMIN only
    authenticate,
    restrictTo('ADMIN'),
    getTypeByIdLimiter,
    serviceTypeController.deleteType,
  ); // Apply limiter before the controller

// Route to get all service types for a specific category
router.route('/category/:categoryId').get(
  // Authenticate - Both ADMIN and USER can access
  authenticate,
  getTypeByIdLimiter,
  serviceTypeController.getTypesByCategoryId,
);

// Routes for managing service type components
router
  .route('/:id/components')
  .get(
    // Authenticate - Both ADMIN and USER can access
    authenticate,
    getTypeByIdLimiter,
    serviceTypeController.getTypeComponents,
  )
  .post(
    // Authenticate and authorize - ADMIN only
    authenticate,
    restrictTo('ADMIN'),
    getTypeByIdLimiter,
    validate(
      require('../validators/serviceTypeComponentValidator')
        .validateTypeComponent,
    ),
    serviceTypeController.associateComponentWithType,
  );

// Route for managing a specific service type component
router.delete(
  '/:id/components/:componentId',
  // Authenticate and authorize - ADMIN only
  authenticate,
  restrictTo('ADMIN'),
  getTypeByIdLimiter,
  serviceTypeController.removeTypeComponent,
);

module.exports = router;

//4166445106595233
