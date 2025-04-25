const express = require('express');
const rateLimit = require('express-rate-limit');
const router = express.Router();

// Import authentication middleware
const { authenticate, restrictTo } = require('../middlewares/authMiddleware');

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

router
  .route('/')
  .post(
    // Authenticate and authorize - ADMIN only
    authenticate,
    restrictTo('ADMIN'),
    // First handle the file upload
    uploadServiceCategoryIcon[0], // multer middleware to handle file upload
    uploadServiceCategoryIcon[1], // middleware to process and upload file to S3
    // Then validate the request body
    validate(validateServiceCategory),
    // Finally process the request
    serviceCategoryController.createCategory,
  )
  .get(
    // Authenticate - Both ADMIN and USER can access
    authenticate,
    // Get all service categories with filtering, pagination, etc.
    serviceCategoryController.getAllCategories,
  );

router
  .route('/:id')
  .get(
    // Authenticate - Both ADMIN and USER can access
    authenticate,
    serviceCategoryController.getCategoryById,
  )
  .patch(
    authenticate,
    restrictTo('ADMIN'),
    uploadServiceCategoryIcon[0],
    uploadServiceCategoryIcon[1],
    validate(validateServiceCategoryUpdate),
    serviceCategoryController.updateCategory,
  )
  .delete(
    authenticate,
    restrictTo('ADMIN'),
    serviceCategoryController.deleteCategory,
  );

const getCategoryTypesLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: 'Too many requests from this IP, please try again after 15 minutes',
  standardHeaders: true,
  legacyHeaders: false,
});

// Route to get all service types for a specific category
router.route('/:id/types').get(
  // Authenticate - Both ADMIN and USER can access
  authenticate,
  getCategoryTypesLimiter,
  serviceTypeController.getTypesByCategoryId,
);

module.exports = router;
