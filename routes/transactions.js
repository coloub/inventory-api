const express = require('express');
const {
  getAllTransactions,
  getTransactionById,
  createTransaction,
  updateTransaction,
  deleteTransaction
} = require('../controllers/transactionController');

const { transactionValidation, handleValidationErrors } = require('../middleware/validation');
const { authenticateJWT, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Apply authentication to all routes
router.use(authenticateJWT);

/**
 * @swagger
 * components:
 *   schemas:
 *     Transaction:
 *       type: object
 *       required:
 *         - type
 *         - product
 *         - quantity
 *       properties:
 *         _id:
 *           type: string
 *           description: Auto-generated transaction ID
 *         type:
 *           type: string
 *           enum: [input, output]
 *           description: Transaction type (input for stock addition, output for stock removal)
 *         product:
 *           type: object
 *           properties:
 *             _id:
 *               type: string
 *             name:
 *               type: string
 *             sku:
 *               type: string
 *             category:
 *               type: string
 *             quantity:
 *               type: integer
 *           description: Product involved in the transaction
 *         quantity:
 *           type: integer
 *           minimum: 1
 *           description: Quantity of items in the transaction
 *         user:
 *           type: object
 *           properties:
 *             _id:
 *               type: string
 *             name:
 *               type: string
 *             email:
 *               type: string
 *           description: User who performed the transaction
 *         date:
 *           type: string
 *           format: date-time
 *           description: Transaction date
 *         notes:
 *           type: string
 *           maxLength: 500
 *           description: Optional notes about the transaction
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Creation timestamp
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Last update timestamp
 *       example:
 *         type: "input"
 *         product:
 *           _id: "60d0fe4f5311236168a109ca"
 *           name: "Wireless Mouse"
 *           sku: "WM-001"
 *           category: "Electronics"
 *           quantity: 200
 *         quantity: 50
 *         user:
 *           _id: "60d0fe4f5311236168a109cb"
 *           name: "John Doe"
 *           email: "john@example.com"
 *         notes: "Restocking from supplier XYZ"
 *     TransactionInput:
 *       type: object
 *       required:
 *         - type
 *         - product
 *         - quantity
 *       properties:
 *         type:
 *           type: string
 *           enum: [input, output]
 *           description: Transaction type
 *         product:
 *           type: string
 *           description: Product ID (MongoDB ObjectId)
 *         quantity:
 *           type: integer
 *           minimum: 1
 *           description: Quantity of items
 *         notes:
 *           type: string
 *           maxLength: 500
 *           description: Optional notes
 *       example:
 *         type: "input"
 *         product: "60d0fe4f5311236168a109ca"
 *         quantity: 50
 *         notes: "Restocking from supplier XYZ"
 */

/**
 * @swagger
 * /api/v1/transactions:
 *   get:
 *     summary: Get all transactions
 *     tags: [Transactions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [input, output]
 *         description: Filter by transaction type
 *       - in: query
 *         name: product
 *         schema:
 *           type: string
 *         description: Filter by product ID
 *       - in: query
 *         name: user
 *         schema:
 *           type: string
 *         description: Filter by user ID
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter transactions from this date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter transactions until this date
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of transactions per page
 *     responses:
 *       200:
 *         description: List of transactions
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 count:
 *                   type: integer
 *                 totalCount:
 *                   type: integer
 *                 currentPage:
 *                   type: integer
 *                 totalPages:
 *                   type: integer
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Transaction'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/', getAllTransactions);

/**
 * @swagger
 * /api/v1/transactions/{id}:
 *   get:
 *     summary: Get a transaction by ID
 *     tags: [Transactions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Transaction ID
 *     responses:
 *       200:
 *         description: Transaction found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Transaction'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/:id', getTransactionById);

/**
 * @swagger
 * /api/v1/transactions:
 *   post:
 *     summary: Create a new transaction
 *     tags: [Transactions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/TransactionInput'
 *           examples:
 *             stockInput:
 *               summary: Stock Input Transaction
 *               value:
 *                 type: "input"
 *                 product: "60d0fe4f5311236168a109ca"
 *                 quantity: 100
 *                 notes: "New shipment received"
 *             stockOutput:
 *               summary: Stock Output Transaction
 *               value:
 *                 type: "output"
 *                 product: "60d0fe4f5311236168a109ca"
 *                 quantity: 25
 *                 notes: "Order fulfillment"
 *     responses:
 *       201:
 *         description: Transaction created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Transaction'
 *       400:
 *         description: Validation error or insufficient stock
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Insufficient stock. Available: 10, Requested: 25"
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.post('/', transactionValidation, handleValidationErrors, createTransaction);

/**
 * @swagger
 * /api/v1/transactions/{id}:
 *   put:
 *     summary: Update a transaction
 *     tags: [Transactions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Transaction ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [input, output]
 *               product:
 *                 type: string
 *               quantity:
 *                 type: integer
 *                 minimum: 1
 *               notes:
 *                 type: string
 *                 maxLength: 500
 *           example:
 *             type: "input"
 *             quantity: 75
 *             notes: "Updated quantity after recount"
 *     responses:
 *       200:
 *         description: Transaction updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Transaction'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       400:
 *         description: Validation error or insufficient stock
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.put('/:id', transactionValidation, handleValidationErrors, updateTransaction);

/**
 * @swagger
 * /api/v1/transactions/{id}:
 *   delete:
 *     summary: Delete a transaction (Admin only)
 *     tags: [Transactions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Transaction ID
 *     responses:
 *       200:
 *         description: Transaction deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       403:
 *         description: Access denied. Admin role required.
 *       400:
 *         description: Cannot delete transaction (would result in negative stock)
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.delete('/:id', requireAdmin, deleteTransaction);

module.exports = router;