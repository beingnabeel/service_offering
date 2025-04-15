const express = require('express');
const router = express.Router();
const serviceTypeController = require('../controllers/serviceTypeController');
const { validateServiceType } = require('../validators/serviceTypeValidator');
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

module.exports = router;
