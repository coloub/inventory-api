const { body, validationResult } = require('express-validator');

// Product validation rules (existing code)
const productValidation = [
  body('name')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Product name must be between 1 and 100 characters'),
  
  body('sku')
    .trim()
    .isLength({ min: 1, max: 20 })
    .withMessage('SKU must be between 1 and 20 characters')
    .matches(/^[A-Z0-9-_]+$/)
    .withMessage('SKU can only contain uppercase letters, numbers, hyphens, and underscores'),
  
  body('description')
    .trim()
    .isLength({ min: 1, max: 500 })
    .withMessage('Description must be between 1 and 500 characters'),
  
  body('price')
    .isFloat({ min: 0 })
    .withMessage('Price must be a positive number'),
  
  body('quantity')
    .isInt({ min: 0 })
    .withMessage('Quantity must be a non-negative integer'),
  
  body('category')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Category must be between 1 and 50 characters'),
  
  body('vendor')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Vendor must be between 1 and 100 characters')
];

// Category validation rules
const categoryValidation = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Category name must be between 2 and 50 characters')
    .matches(/^[a-zA-Z0-9\s&-]+$/)
    .withMessage('Category name can only contain letters, numbers, spaces, ampersands, and hyphens'),
  
  body('description')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Description cannot exceed 200 characters')
];

// Middleware to handle validation errors (existing code)
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }
  next();
};

module.exports = {
  productValidation,
  categoryValidation, // NEW: Export category validation
  handleValidationErrors
};