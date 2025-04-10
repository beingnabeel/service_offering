const express = require("express");
const router = express.Router();
const serviceCategoryController = require("../controllers/serviceCategoryController");
const {
  validateServiceCategory,
} = require("../validators/serviceCategoryValidator");
const { validate } = require("../middlewares/validationMiddlewares");
const { uploadServiceCategoryIcon } = require("../middlewares/uploadMiddleware");

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
router.route('/')
  .post(
    // First handle the file upload
    uploadServiceCategoryIcon[0], // multer middleware to handle file upload
    uploadServiceCategoryIcon[1], // middleware to process and upload file to S3
    // Then validate the request body
    validate(validateServiceCategory),
    // Finally process the request
    serviceCategoryController.createCategory
  )
  .get(
    // Get all service categories with filtering, pagination, etc.
    serviceCategoryController.getAllCategories
  );

module.exports = router;
