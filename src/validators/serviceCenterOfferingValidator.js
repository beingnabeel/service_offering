const { body } = require('express-validator');

const validateServiceCenterOffering = [
  // Service Type ID validation
  body('serviceTypeId')
    .notEmpty()
    .withMessage('Service Type ID is required')
    .isUUID()
    .withMessage('Service Type ID must be a valid UUID'),

  // Status validation
  body('status')
    .optional()
    .isIn(['ACTIVE', 'INACTIVE', 'PENDING'])
    .withMessage('Status must be one of: ACTIVE, INACTIVE, PENDING'),

  // Price validation
  body('basePrice')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Base price must be a non-negative number'),

  // Discount validations
  body('discountPercentage')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('Discount percentage must be between 0 and 100'),

  // body('discountAbsolute')
  //   .optional()
  //   .isFloat({ min: 0 })
  //   .withMessage('Absolute discount must be a non-negative number'),

  body('discountValidUntil')
    .optional()
    .isISO8601()
    .withMessage('Discount valid until must be a valid date'),

  // Time validations
  body('timeToComplete')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Time to complete must be a positive integer'),

  // Priority validations
  body('availablePriorities')
    .optional()
    .isArray()
    .withMessage('Available priorities must be an array')
    .custom((priorities) => {
      const validPriorities = ['NORMAL', 'EXPRESS', 'PREMIUM'];
      return priorities.every((p) => validPriorities.includes(p));
    })
    .withMessage('Each priority must be one of: NORMAL, EXPRESS, PREMIUM'),

  body('priorityPrices')
    .optional()
    .custom((prices) => {
      if (typeof prices !== 'object') return false;

      // Check that all keys are valid priorities and all values are non-negative numbers
      const validPriorities = ['NORMAL', 'EXPRESS', 'URGENT'];
      return Object.entries(prices).every(([priority, price]) => {
        return (
          validPriorities.includes(priority) &&
          typeof price === 'number' &&
          price >= 0
        );
      });
    })
    .withMessage(
      'Priority prices must be an object with valid priorities as keys and non-negative numbers as values',
    ),

  // Booking validation
  body('minimumAdvanceBooking')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Minimum advance booking must be a non-negative integer'),

  // Terms and conditions
  body('termsAndConditions')
    .optional()
    .isString()
    .withMessage('Terms and conditions must be a string'),

  // Payment policy validation
  body('paymentPolicy')
    .optional()
    .isIn([
      'PAYMENT_AFTER_SERVICE',
      'PAYMENT_BEFORE_SERVICE',
      'PAYMENT_INSTALLMENTS',
    ])
    .withMessage(
      'Payment policy must be one of: PAYMENT_AFTER_SERVICE, PAYMENT_BEFORE_SERVICE, PAYMENT_INSTALLMENTS',
    ),

  // Warranty validations
  body('warrantyDays')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Warranty days must be a non-negative integer'),

  body('warrantyKilometers')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Warranty kilometers must be a non-negative integer'),

  // Feature flags
  body('isHighlighted')
    .optional()
    .isBoolean()
    .withMessage('isHighlighted must be a boolean'),

  // body('hasPickupDropService')
  //   .optional()
  //   .isBoolean()
  //   .withMessage('hasPickupDropService must be a boolean'),

  // body('pickupDropFee')
  //   .optional()
  //   .isFloat({ min: 0 })
  //   .withMessage('Pickup/drop fee must be a non-negative number'),

  body('hasEmergencyService')
    .optional()
    .isBoolean()
    .withMessage('hasEmergencyService must be a boolean'),

  body('emergencyServiceFee')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Emergency service fee must be a non-negative number'),
];
const validateUpdateServiceCenterOffering = [
  // Service Type ID validation
  body('serviceTypeId')
    .optional()
    .isUUID()
    .withMessage('Service Type ID must be a valid UUID'),

  // Status validation
  body('status')
    .optional()
    .isIn(['ACTIVE', 'INACTIVE', 'PENDING'])
    .withMessage('Status must be one of: ACTIVE, INACTIVE, PENDING'),

  // Price validation
  body('basePrice')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Base price must be a non-negative number'),

  // Discount validations
  body('discountPercentage')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('Discount percentage must be between 0 and 100'),

  // body('discountAbsolute')
  //   .optional()
  //   .isFloat({ min: 0 })
  //   .withMessage('Absolute discount must be a non-negative number'),

  body('discountValidUntil')
    .optional()
    .isISO8601()
    .withMessage('Discount valid until must be a valid date'),

  // Time validations
  body('timeToComplete')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Time to complete must be a positive integer'),

  // Priority validations
  body('availablePriorities')
    .optional()
    .isArray()
    .withMessage('Available priorities must be an array')
    .custom((priorities) => {
      const validPriorities = ['NORMAL', 'EXPRESS', 'PREMIUM'];
      return priorities.every((p) => validPriorities.includes(p));
    })
    .withMessage('Each priority must be one of: NORMAL, EXPRESS, PREMIUM'),

  body('priorityPrices')
    .optional()
    .custom((prices) => {
      if (typeof prices !== 'object') return false;

      // Check that all keys are valid priorities and all values are non-negative numbers
      const validPriorities = ['NORMAL', 'EXPRESS', 'URGENT'];
      return Object.entries(prices).every(([priority, price]) => {
        return (
          validPriorities.includes(priority) &&
          typeof price === 'number' &&
          price >= 0
        );
      });
    })
    .withMessage(
      'Priority prices must be an object with valid priorities as keys and non-negative numbers as values',
    ),

  // Booking validation
  body('minimumAdvanceBooking')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Minimum advance booking must be a non-negative integer'),

  // Terms and conditions
  body('termsAndConditions')
    .optional()
    .isString()
    .withMessage('Terms and conditions must be a string'),

  // Payment policy validation
  body('paymentPolicy')
    .optional()
    .isIn([
      'PAYMENT_AFTER_SERVICE',
      'PAYMENT_BEFORE_SERVICE',
      'PAYMENT_INSTALLMENTS',
    ])
    .withMessage(
      'Payment policy must be one of: PAYMENT_AFTER_SERVICE, PAYMENT_BEFORE_SERVICE, PAYMENT_INSTALLMENTS',
    ),

  // Warranty validations
  body('warrantyDays')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Warranty days must be a non-negative integer'),

  body('warrantyKilometers')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Warranty kilometers must be a non-negative integer'),

  // Feature flags
  body('isHighlighted')
    .optional()
    .isBoolean()
    .withMessage('isHighlighted must be a boolean'),

  // body('hasPickupDropService')
  //   .optional()
  //   .isBoolean()
  //   .withMessage('hasPickupDropService must be a boolean'),

  // body('pickupDropFee')
  //   .optional()
  //   .isFloat({ min: 0 })
  //   .withMessage('Pickup/drop fee must be a non-negative number'),

  body('hasEmergencyService')
    .optional()
    .isBoolean()
    .withMessage('hasEmergencyService must be a boolean'),

  body('emergencyServiceFee')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Emergency service fee must be a non-negative number'),
];

module.exports = {
  validateServiceCenterOffering,
  validateUpdateServiceCenterOffering,
};
