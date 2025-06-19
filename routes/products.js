const express = require('express');
const {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct
} = require('../controllers/productController');

const { productValidation, handleValidationErrors } = require('../middleware/validation');
const { authenticateJWT, requireAdmin } = require('../middleware/auth'); // NEW

const router = express.Router();

// Apply authentication to all routes
router.use(authenticateJWT); // NEW: All product routes now require authentication

/**
 * @swagger
 * components:
 *   schemas:
 *     Product:
 *       type: object
 *         required:
 *           - name
 *           - description
 *           - price
 *           - quantity
 *           - category
 *           - vendor
 *       properties:
 *         _id:
 *           type: string
 *           description: Auto-generated product ID
 *         name:
 *           type: string
 *           maxLength: 100
 *           description: Product name
 *         sku:
 *           type: string
 *           maxLength: 20
 *           description: Stock Keeping Unit (unique identifier)
 *         description:
 *           type: string
 *           maxLength: 500
 *           description: Product description
 *         price:
 *           type: number
 *           minimum: 0
 *           description: Product price
 *         quantity:
 *           type: integer
 *           minimum: 0
 *           description: Available quantity
 *         category:
 *           type: string
 *           maxLength: 50
 *           description: Product category
 *         vendor:
 *           type: string
 *           maxLength: 100
 *           description: Product vendor/supplier
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Creation timestamp
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Last update timestamp
 *       example:
 *         name: "Wireless Mouse"
 *         sku: "WM-001"
 *         description: "Ergonomic wireless mouse with USB receiver"
 *         price: 29.99
 *         quantity: 150
 *         category: "Electronics"
 *         vendor: "TechCorp"
 */

/**
 * @swagger
 * /api/v1/products:
 *   get:
 *     summary: Get all products
 *     tags: [Products]
 *     responses:
 *       200:
 *         description: List of all products
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 count:
 *                   type: integer
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Product'
 */
router.get('/', getProducts);

/**
 * @swagger
 * /api/v1/products/{id}:
 *   get:
 *     summary: Get a product by ID
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Product ID
 *     responses:
 *       200:
 *         description: Product found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Product'
 *       404:
 *         description: Product not found
 */
router.get('/:id', getProduct);

/**
 * @swagger
 * /api/v1/products:
 *   post:
 *     summary: Create a new product
 *     tags: [Products]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *         required:
 *           - name
 *           - description
 *           - price
 *           - quantity
 *           - category
 *           - vendor
 *             properties:
 *               name:
 *                 type: string
 *                 maxLength: 100
 *               sku:
 *                 type: string
 *                 maxLength: 20
 *               description:
 *                 type: string
 *                 maxLength: 500
 *               price:
 *                 type: number
 *                 minimum: 0
 *               quantity:
 *                 type: integer
 *                 minimum: 0
 *               category:
 *                 type: string
 *                 maxLength: 50
 *               vendor:
 *                 type: string
 *                 maxLength: 100
 *     responses:
 *       201:
 *         description: Product created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Product'
 *       400:
 *         description: Validation error
 */
router.post('/', productValidation, handleValidationErrors, createProduct);

/**
 * @swagger
 * /api/v1/products/{id}:
 *   put:
 *     summary: Update a product
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Product ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 maxLength: 100
 *               sku:
 *                 type: string
 *                 maxLength: 20
 *               description:
 *                 type: string
 *                 maxLength: 500
 *               price:
 *                 type: number
 *                 minimum: 0
 *               quantity:
 *                 type: integer
 *                 minimum: 0
 *               category:
 *                 type: string
 *                 maxLength: 50
 *               vendor:
 *                 type: string
 *                 maxLength: 100
 *     responses:
 *       200:
 *         description: Product updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Product'
 *       404:
 *         description: Product not found
 *       400:
 *         description: Validation error
 */
router.put('/:id', productValidation, handleValidationErrors, updateProduct);

/**
 * @swagger
 * /api/v1/products/{id}:
 *   delete:
 *     summary: Delete a product
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Product ID
 *     responses:
 *       200:
 *         description: Product deleted successfully
 *       404:
 *         description: Product not found
 */
router.get('/', getProducts);
router.get('/:id', getProduct);
router.post('/', productValidation, handleValidationErrors, createProduct);
router.put('/:id', productValidation, handleValidationErrors, updateProduct);
router.delete('/:id', requireAdmin, deleteProduct); // NEW: Only admin can delete

module.exports = router;