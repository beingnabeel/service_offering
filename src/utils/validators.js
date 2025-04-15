const { validationResult } = require('express-validator');

/**
 * Check if validation errors exist and format them
 * @param {Object} req - Express request object

 * @returns {Object|void} Validation errors or next middleware
 */
const validateRequest = (req) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const formattedErrors = {};
    errors.array().forEach((error) => {
      formattedErrors[error.path] = error.msg;
    });
    return { errors: formattedErrors };
  }
  return null;
};

/**
 * Common validation rules
 */
// const commonValidations = {
//   // String validation
//   isValidString: (field, options = {}) => {
//     const { min = 1, max = 255, required = true } = options;
//     return body(field)
//       .if((value, { req }) => required || value)
//       .isString()
//       .withMessage(`${field} must be a string`)
//       .isLength({ min, max })
//       .withMessage(`${field} must be between ${min} and ${max} characters`);
//   },

//   // Integer validation
//   isValidInteger: (field, options = {}) => {
//     const { min, max, required = true } = options;
//     let validator = body(field)
//       .if((value, { req }) => required || value !== undefined)
//       .isInt()
//       .withMessage(`${field} must be an integer`);

//     if (min !== undefined) {
//       validator = validator
//         .isInt({ min })
//         .withMessage(`${field} must be at least ${min}`);
//     }

//     if (max !== undefined) {
//       validator = validator
//         .isInt({ max })
//         .withMessage(`${field} must be at most ${max}`);
//     }

//     return validator;
//   },

//   // Boolean validation
//   isValidBoolean: (field, required = true) => {
//     return body(field)
//       .if((value, { req }) => required || value !== undefined)
//       .isBoolean()
//       .withMessage(`${field} must be a boolean value`);
//   },

//   // Enum validation
//   isValidEnum: (field, allowedValues, required = true) => {
//     return body(field)
//       .if((value, { req }) => required || value)
//       .isIn(allowedValues)
//       .withMessage(`${field} must be one of: ${allowedValues.join(', ')}`);
//   },
// };

module.exports = {
  validateRequest,
  // ...commonValidations,
};
