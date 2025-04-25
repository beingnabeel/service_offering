const { body } = require('express-validator');

const validateTypeComponent = [
  body('serviceComponentId')
    .notEmpty()
    .withMessage('Service component ID is required')
    .isUUID()
    .withMessage('Service component ID must be a valid UUID'),

  body('isDefault')
    .optional()
    .isBoolean()
    .withMessage('isDefault must be a boolean value'),

  body('isRequired')
    .optional()
    .isBoolean()
    .withMessage('isRequired must be a boolean value'),

  body('additionalPrice')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Additional price must be a non-negative number'),
];

module.exports = {
  validateTypeComponent,
};
