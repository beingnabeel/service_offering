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
// Define the create category route
router.route('/')
  .post(
    // First handle the file upload
    uploadServiceCategoryIcon[0], // multer middleware to handle file upload
    uploadServiceCategoryIcon[1], // middleware to process and upload file to S3
    // Then validate the request body
    validate(validateServiceCategory),
    // Finally process the request
    serviceCategoryController.createCategory
  );

module.exports = router;
