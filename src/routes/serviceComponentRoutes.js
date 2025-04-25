const express = require('express');
const rateLimit = require('express-rate-limit');
const router = express.Router();
const serviceComponentController = require('../controllers/serviceComponentController');
// Import authentication middleware
const { authenticate, restrictTo } = require('../middlewares/authMiddleware');
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
  .get(
    // Authenticate - Both ADMIN and USER can access
    authenticate,
    getComponentTypesLimiter,
    serviceComponentController.getAllComponents,
  )
  .post(
    // Authenticate and authorize - ADMIN only
    authenticate,
    restrictTo('ADMIN'),
    validate(validateServiceComponent),
    serviceComponentController.createComponent,
  );

router
  .route('/:id')
  .get(
    // Authenticate - Both ADMIN and USER can access
    authenticate,
    getComponentTypesLimiter,
    serviceComponentController.getComponentById,
  )
  .patch(
    // Authenticate and authorize - ADMIN only
    authenticate,
    restrictTo('ADMIN'),
    validate(validateUpdateServiceComponent),
    serviceComponentController.updateComponent,
  )
  .delete(
    // Authenticate and authorize - ADMIN only
    authenticate,
    restrictTo('ADMIN'),
    serviceComponentController.deleteComponent,
  );
// Route to get all service components for a specific category
// router
//   .route('/:id/components')
//   .get(getComponentTypesLimiter, serviceComponentController.getComponentsByCategoryId);

module.exports = router;
