const { body } = require('express-validator');

exports.validateProduct = [
  body('name').notEmpty().withMessage('Name is required'),
  body('sku').notEmpty().withMessage('SKU is required'),
  body('price').isNumeric().withMessage('Price must be a number'),
  body('quantity').isInt({ min: 0 }).withMessage('Quantity must be an integer >= 0')
];

exports.validateCategory = [
  body('name').notEmpty().withMessage('Name is required')
];

exports.validateUser = [
  body('googleId').notEmpty().withMessage('Google ID is required'),
  body('email').isEmail().withMessage('Valid email is required')
];

exports.validateTransaction = [
  body('type').isIn(['entry', 'exit']).withMessage('Type must be entry or exit'),
  body('product').notEmpty().withMessage('Product ID is required'),
  body('quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1')
];
