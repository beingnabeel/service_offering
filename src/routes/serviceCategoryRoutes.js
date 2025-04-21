const express = require('express');
const rateLimit = require('express-rate-limit');
const router = express.Router();

// Import the service type controller for the category types endpoint
const serviceTypeController = require('../controllers/serviceTypeController');
const serviceCategoryController = require('../controllers/serviceCategoryController');
const {
  validateServiceCategory,
  validateServiceCategoryUpdate,
} = require('../validators/serviceCategoryValidator');
const { validate } = require('../middlewares/validationMiddlewares');
const {
  uploadServiceCategoryIcon,
} = require('../middlewares/uploadMiddleware');

/**
 * @route POST /api/v1/categories
 * @desc Create a new service category
 * @access Private
 */
/**
 * @route GET /api/v1/categories
 * @desc Get all service categories with filters, pagination, etc.
 * @access Public
 */
// Define the routes
router
  .route('/')
  .post(
    // First handle the file upload
    uploadServiceCategoryIcon[0], // multer middleware to handle file upload
    uploadServiceCategoryIcon[1], // middleware to process and upload file to S3
    // Then validate the request body
    validate(validateServiceCategory),
    // Finally process the request
    serviceCategoryController.createCategory,
  )
  .get(
    // Get all service categories with filtering, pagination, etc.
    serviceCategoryController.getAllCategories,
  );

/**
 * @route PATCH /api/v1/categories/:id
 * @desc Update a service category
 * @access Private
 */
/**
 * @route DELETE /api/v1/categories/:id
 * @desc Delete a service category
 * @access Private
 */
router
  .route('/:id')
  .get(serviceCategoryController.getCategoryById)
  .patch(
    // First handle the file upload
    uploadServiceCategoryIcon[0], // multer middleware to handle file upload
    uploadServiceCategoryIcon[1], // middleware to process and upload file to S3
    // Then validate the request body
    validate(validateServiceCategoryUpdate),
    // Finally process the request
    serviceCategoryController.updateCategory,
  )
  .delete(serviceCategoryController.deleteCategory);

// Rate limiter for the GET category types endpoint
const getCategoryTypesLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again after 15 minutes',
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

// Route to get all service types for a specific category
router
  .route('/:id/types')
  .get(getCategoryTypesLimiter, serviceTypeController.getTypesByCategoryId);

module.exports = router;
