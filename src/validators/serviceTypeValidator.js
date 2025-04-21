const { body, param, validationResult } = require('express-validator');
const AppError = require('../utils/appError');
// const {
//   isValidString,
//   isValidInteger,
//   isValidBoolean,
//   isValidEnum,
// } = require('../utils/validators');

/**
 * Validation rules for creating/updating a service type
 */
const validateServiceType = [
  // Name validation
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ min: 2, max: 255 })
    .withMessage('Name must be between 2 and 255 characters'),

  // Description validation (optional)
  body('description')
    .optional()
    .trim()
    .isLength({ min: 5, max: 255 })
    .withMessage('Description must be between 5 and 255 characters'),

  // Long description validation (optional)
  body('longDescription')
    .optional()
    .trim()
    .isLength({ min: 10 })
    .withMessage('Long description should be at least 10 characters'),

  // Estimated duration validation
  body('estimatedDuration')
    .notEmpty()
    .withMessage('Estimated duration is required')
    .isInt({ min: 1 })
    .withMessage('Estimated duration must be a positive integer (in minutes)'),

  // Display image validation (optional)
  body('displayImage')
    .optional()
    .isString()
    .withMessage('Display image must be a valid URL string'),

  // Category ID validation
  body('categoryId')
    .notEmpty()
    .withMessage('Category ID is required')
    .isUUID()
    .withMessage('Category ID must be a valid UUID'),

  // Recommended frequency validation (optional)
  body('recommendedFrequency')
    .optional()
    .isString()
    .withMessage('Recommended frequency must be a string'),

  // Warning threshold validation (optional)
  body('warningThreshold')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Warning threshold must be a non-negative integer'),

  // Display order validation (optional)
  body('displayOrder')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Display order must be a non-negative integer'),

  // Is popular validation (optional)
  body('isPopular')
    .optional()
    .isBoolean()
    .withMessage('isPopular must be a boolean value'),
];

const validateUpdateServiceType = [
  body('name')
    .trim()
    .optional()
    .isLength({ min: 2, max: 255 })
    .withMessage('Name must be between 2 and 255 characters'),

  // Description validation (optional)
  body('description')
    .optional()
    .trim()
    .isLength({ min: 5, max: 255 })
    .withMessage('Description must be between 5 and 255 characters'),

  // Long description validation (optional)
  body('longDescription')
    .optional()
    .trim()
    .isLength({ min: 10 })
    .withMessage('Long description should be at least 10 characters'),

  // Estimated duration validation
  body('estimatedDuration')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Estimated duration must be a positive integer (in minutes)'),

  // Display image validation (optional)
  body('displayImage')
    .optional()
    .isString()
    .withMessage('Display image must be a valid URL string'),

  // Category ID validation
  body('categoryId')
    .optional()
    .isUUID()
    .withMessage('Category ID must be a valid UUID'),

  // Recommended frequency validation (optional)
  body('recommendedFrequency')
    .optional()
    .isString()
    .withMessage('Recommended frequency must be a string'),

  // Warning threshold validation (optional)
  body('warningThreshold')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Warning threshold must be a non-negative integer'),

  // Display order validation (optional)
  body('displayOrder')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Display order must be a non-negative integer'),

  // Is popular validation (optional)
  body('isPopular')
    .optional()
    .isBoolean()
    .withMessage('isPopular must be a boolean value'),
];
/**
 * Validation rules for checking service type ID
 */
const validateServiceTypeId = [
  param('id')
    .notEmpty()
    .withMessage('Service type ID is required')
    .isUUID()
    .withMessage('Service type ID must be a valid UUID'),
];

/**
 * Middleware to validate service type data
 */
const validateServiceTypeData = (req, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map((err) => err.msg);
    return next(new AppError(errorMessages.join(', '), 400));
  }
  next();
};

module.exports = {
  validateServiceType,
  validateServiceTypeId,
  validateServiceTypeData,
  validateUpdateServiceType,
};
