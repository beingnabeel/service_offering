const { body, param, validationResult } = require("express-validator");
const AppError = require("../utils/appError");
const {
  isValidString,
  isValidInteger,
  isValidBoolean,
  isValidEnum,
} = require("../utils/validators");

/**
 * Validation rules for creating a service category
 */
const validateServiceCategory = [
  // Name validation
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Name is required")
    .isLength({ min: 2, max: 255 })
    .withMessage("Name must be between 2 and 255 characters"),

  // Description validation (optional)
  body("description")
    .optional()
    .trim()
    .isLength({ min: 5, max: 255 })
    .withMessage("Description must be between 5 and 255 characters"),

  // Vehicle type validation
  body("vehicleType")
    .optional()
    .isIn(["CAR", "BIKE"])
    .withMessage("Vehicle type must be one of: CAR, BIKE"),

  // Icon validation (optional)
  body("icon")
    .optional()
    .isString()
    .withMessage("Icon must be a valid URL string"),

  // Display order validation (optional)
  body("displayOrder")
    .optional()
    .isInt({ min: 0 })
    .withMessage("Display order must be a non-negative integer"),

  // Is popular validation (optional)
  body("isPopular")
    .optional()
    .isBoolean()
    .withMessage("isPopular must be a boolean value"),
];

const validateServiceCategoryUpdate = [
  // Name validation
  body("name")
    .trim()
    .optional()
    .isLength({ min: 2, max: 255 })
    .withMessage("Name must be between 2 and 255 characters"),

  // Description validation (optional)
  body("description")
    .optional()
    .trim()
    .isLength({ min: 5, max: 255 })
    .withMessage("Description must be between 5 and 255 characters"),

  // Vehicle type validation
  body("vehicleType")
    .optional()
    .isIn(["CAR", "BIKE"])
    .withMessage("Vehicle type must be one of: CAR, BIKE"),

  // Icon validation (optional)
  body("icon")
    .optional()
    .isString()
    .withMessage("Icon must be a valid URL string"),

  // Display order validation (optional)
  body("displayOrder")
    .optional()
    .isInt({ min: 0 })
    .withMessage("Display order must be a non-negative integer"),

  // Is popular validation (optional)
  body("isPopular")
    .optional()
    .isBoolean()
    .withMessage("isPopular must be a boolean value"),
];
module.exports = {
  validateServiceCategory,
  validateServiceCategoryUpdate,
};
