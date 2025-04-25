const { body } = require('express-validator');

const validateServiceComponent = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ min: 2, max: 255 })
    .withMessage('Name must be between 2 and 255 characters'),

  body('description')
    .optional()
    .trim()
    .isLength({ min: 5, max: 255 })
    .withMessage('Description must be between 5 and 255 characters'),
  body('estimatedDuration')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Estimated duration must be a non-negative integer'),
  body('vehicleType')
    .optional()
    .isIn(['CAR', 'BIKE'])
    .withMessage('Vehicle type must be one of: CAR, BIKE'),
];
const validateUpdateServiceComponent = [
  body('name')
    .optional()
    .isLength({ min: 2, max: 255 })
    .withMessage('Name must be between 2 and 255 characters'),

  body('description')
    .optional()
    .trim()
    .isLength({ min: 5, max: 255 })
    .withMessage('Description must be between 5 and 255 characters'),
  body('estimatedDuration')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Estimated duration must be a non-negative integer'),
  body('vehicleType')
    .optional()
    .isIn(['CAR', 'BIKE'])
    .withMessage('Vehicle type must be one of: CAR, BIKE'),
];

module.exports = {
  validateServiceComponent,
  validateUpdateServiceComponent,
};
