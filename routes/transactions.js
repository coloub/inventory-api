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
 *         description: Filter by transaction type. Select either 'input' for stock addition or 'output' for stock removal.
 *         example: input
 *       - in: query
 *         name: product
 *         schema:
 *           type: string
 *         description: Filter by product ID. Select from available products like "60d0fe4f5311236168a109ca" (Wireless Mouse), "60d0fe4f5311236168a109cb" (Keyboard).
 *         example: "60d0fe4f5311236168a109ca"
 *       - in: query
 *         name: user
 *         schema:
 *           type: string
 *         description: Filter by user ID. Select from users like "60d0fe4f5311236168a109cb" (John Doe), "60d0fe4f5311236168a109cc" (Jane Smith).
 *         example: "60d0fe4f5311236168a109cb"
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter transactions from this date (YYYY-MM-DD). Example: "2023-01-01"
 *         example: "2023-01-01"
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter transactions until this date (YYYY-MM-DD). Example: "2023-12-31"
 *         example: "2023-12-31"
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination
 *         example: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of transactions per page
 *         example: 10
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
 *         description: >
 *           Transaction ID. You can copy the Transaction ID from a previously created transaction and paste it here to retrieve it.
 *         example: "60d0fe4f5311236168a109ca"
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
 *             examples:
 *               successResponse:
 *                 summary: Successful creation response
 *                 value:
 *                   success: true
 *                   data:
 *                     type: "input"
 *                     product:
 *                       _id: "60d0fe4f5311236168a109ca"
 *                       name: "Wireless Mouse"
 *                       sku: "WM-001"
 *                       category: "Electronics"
 *                       quantity: 200
 *                     quantity: 100
 *                     user:
 *                       _id: "60d0fe4f5311236168a109cb"
 *                       name: "John Doe"
 *                       email: "john@example.com"
 *                     notes: "New shipment received"
 *                     date: "2023-06-01T12:00:00Z"
 *                     createdAt: "2023-06-01T12:00:00Z"
 *                     updatedAt: "2023-06-01T12:00:00Z"
 *               errorResponse:
 *                 summary: Validation error or insufficient stock
 *                 value:
 *                   success: false
 *                   message: "Insufficient stock. Available: 10, Requested: 25"
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
 *         description: Transaction ID to update. This should be a valid ObjectId. You can copy it from the response of a GET or POST transaction.
 *         example: "60d0fe4f5311236168a109ca"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - type
 *               - product
 *               - quantity
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [input, output]
 *                 description: Transaction type (input for stock addition, output for stock removal)
 *               product:
 *                 type: string
 *                 description: Product ID (MongoDB ObjectId)
 *               quantity:
 *                 type: integer
 *                 minimum: 1
 *                 description: Quantity of items
 *               notes:
 *                 type: string
 *                 maxLength: 500
 *                 description: Optional notes
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
 *             minimalUpdate:
 *               summary: Minimal update with required fields only
 *               value:
 *                 type: "input"
 *                 product: "60d0fe4f5311236168a109ca"
 *                 quantity: 50
 *     responses:
 *       200:
 *         description: Transaction updated successfully
 *         content:
 *           application/json:
 *             examples:
 *               successResponse:
 *                 summary: Successful update response
 *                 value:
 *                   success: true
 *                   data:
 *                     type: "input"
 *                     product:
 *                       _id: "60d0fe4f5311236168a109ca"
 *                       name: "Wireless Mouse"
 *                       sku: "WM-001"
 *                       category: "Electronics"
 *                       quantity: 150
 *                     quantity: 75
 *                     user:
 *                       _id: "60d0fe4f5311236168a109cb"
 *                       name: "John Doe"
 *                       email: "john@example.com"
 *                     notes: "Updated quantity after recount"
 *                     date: "2023-06-01T12:00:00Z"
 *                     createdAt: "2023-06-01T12:00:00Z"
 *                     updatedAt: "2023-06-02T12:00:00Z"
 *               errorResponse:
 *                 summary: Validation error or insufficient stock
 *                 value:
 *                   success: false
 *                   message: "Insufficient stock. Available: 10, Requested: 100"
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