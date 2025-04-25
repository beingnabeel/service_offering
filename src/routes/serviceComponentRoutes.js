const express = require('express');
const rateLimit = require('express-rate-limit');
const router = express.Router();
const serviceComponentController = require('../controllers/serviceComponentController');
const { validate } = require('../middlewares/validationMiddlewares');
const {
  validateServiceComponent,
  validateUpdateServiceComponent,
} = require('../validators/serviceComponentValidator');

const getComponentTypesLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests from this IP, please try again after 15 minutes',
  standardHeaders: true,
  legacyHeaders: false,
});

router
  .route('/')
  .get(getComponentTypesLimiter, serviceComponentController.getAllComponents)
  .post(
    validate(validateServiceComponent),
    serviceComponentController.createComponent,
  );

router
  .route('/:id')
  .get(getComponentTypesLimiter, serviceComponentController.getComponentById)
  .patch(
    validate(validateUpdateServiceComponent),
    serviceComponentController.updateComponent,
  )
  .delete(serviceComponentController.deleteComponent);
// Route to get all service components for a specific category
// router
//   .route('/:id/components')
//   .get(getComponentTypesLimiter, serviceComponentController.getComponentsByCategoryId);

module.exports = router;
