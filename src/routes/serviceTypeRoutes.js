const express = require('express');
const rateLimit = require('express-rate-limit');
const router = express.Router();
const serviceTypeController = require('../controllers/serviceTypeController');
const {
  validateServiceType,
  validateUpdateServiceType,
} = require('../validators/serviceTypeValidator');
const { validate } = require('../middlewares/validationMiddlewares');
const { uploadServiceTypeImage } = require('../middlewares/uploadMiddleware');

router.route('/').post(
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
  .get(getTypeByIdLimiter, serviceTypeController.getTypeById)
  .patch(
    uploadServiceTypeImage[0],
    uploadServiceTypeImage[1],
    validate(validateUpdateServiceType),
    getTypeByIdLimiter,
    serviceTypeController.updateType,
  ); // Apply limiter before the controller

// Route to get all service types for a specific category
router
  .route('/category/:categoryId')
  .get(getTypeByIdLimiter, serviceTypeController.getTypesByCategoryId)
  .delete(getTypeByIdLimiter, serviceTypeController.deleteType);

module.exports = router;
