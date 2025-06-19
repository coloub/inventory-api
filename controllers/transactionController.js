const Transaction = require('../models/Transaction');
const Product = require('../models/Product');
const mongoose = require('mongoose');

// @desc    Get all transactions
// @route   GET /api/v1/transactions
// @access  Private
const getAllTransactions = async (req, res, next) => {
  try {
    // Parse query parameters for filtering and pagination
    const { type, product, user, startDate, endDate, page = 1, limit = 10 } = req.query;
    
    // Build filter object
    const filter = {};
    
    if (type) filter.type = type;
    if (product) filter.product = product;
    if (user) filter.user = user;
    
    // Date range filter
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(endDate);
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Get transactions with pagination
    const transactions = await Transaction.find(filter)
      .sort({ date: -1 }) // Most recent first
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count for pagination info
    const totalCount = await Transaction.countDocuments(filter);
    
    res.status(200).json({
      success: true,
      count: transactions.length,
      totalCount,
      currentPage: parseInt(page),
      totalPages: Math.ceil(totalCount / parseInt(limit)),
      data: transactions
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single transaction by ID
// @route   GET /api/v1/transactions/:id
// @access  Private
const getTransactionById = async (req, res, next) => {
  try {
    const transaction = await Transaction.findById(req.params.id);

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }

    res.status(200).json({
      success: true,
      data: transaction
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new transaction
// @route   POST /api/v1/transactions
// @access  Private
const createTransaction = async (req, res, next) => {
  // Start a session for transaction atomicity
  const session = await mongoose.startSession();
  
  try {
    await session.withTransaction(async () => {
      const { type, product: productId, quantity, notes } = req.body;
      
      // Get the product
      const product = await Product.findById(productId).session(session);
      if (!product) {
        throw new Error('Product not found');
      }

      // Check stock for output transactions
      if (type === 'output' && product.quantity < quantity) {
        throw new Error(`Insufficient stock. Available: ${product.quantity}, Requested: ${quantity}`);
      }

      // Create the transaction
      const transactionData = {
        type,
        product: productId,
        quantity,
        user: req.user._id,
        notes: notes || ''
      };

      const transaction = await Transaction.create([transactionData], { session });

      // Update product quantity
      let newQuantity;
      if (type === 'input') {
        newQuantity = product.quantity + quantity;
      } else {
        newQuantity = product.quantity - quantity;
      }

      await Product.findByIdAndUpdate(
        productId,
        { quantity: newQuantity },
        { session, new: true, runValidators: true }
      );

      // Populate the transaction before returning
      await transaction[0].populate([
        { path: 'product', select: 'name sku category quantity' },
        { path: 'user', select: 'name email' }
      ]);

      res.status(201).json({
        success: true,
        data: transaction[0]
      });
    });
  } catch (error) {
    if (error.message.includes('Insufficient stock') || error.message.includes('Product not found')) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }
    next(error);
  } finally {
    await session.endSession();
  }
};

// @desc    Update transaction
// @route   PUT /api/v1/transactions/:id
// @access  Private
const updateTransaction = async (req, res, next) => {
  const session = await mongoose.startSession();
  
  try {
    await session.withTransaction(async () => {
      // Get the original transaction
      const originalTransaction = await Transaction.findById(req.params.id).session(session);
      if (!originalTransaction) {
        throw new Error('Transaction not found');
      }

      const { type, product: productId, quantity, notes } = req.body;
      
      // Get the product
      const product = await Product.findById(productId || originalTransaction.product).session(session);
      if (!product) {
        throw new Error('Product not found');
      }

      // Revert the original transaction's effect on inventory
      let revertedQuantity;
      if (originalTransaction.type === 'input') {
        revertedQuantity = product.quantity - originalTransaction.quantity;
      } else {
        revertedQuantity = product.quantity + originalTransaction.quantity;
      }

      // Apply the new transaction's effect
      let newQuantity;
      const newType = type || originalTransaction.type;
      const newQty = quantity || originalTransaction.quantity;
      
      if (newType === 'input') {
        newQuantity = revertedQuantity + newQty;
      } else {
        newQuantity = revertedQuantity - newQty;
        
        // Check if we have sufficient stock for output
        if (newQuantity < 0) {
          throw new Error(`Insufficient stock after update. Available: ${revertedQuantity}, Requested: ${newQty}`);
        }
      }

      // Update the transaction
      const updatedTransaction = await Transaction.findByIdAndUpdate(
        req.params.id,
        {
          type: newType,
          product: productId || originalTransaction.product,
          quantity: newQty,
          notes: notes !== undefined ? notes : originalTransaction.notes
        },
        { session, new: true, runValidators: true }
      );

      // Update product quantity
      await Product.findByIdAndUpdate(
        productId || originalTransaction.product,
        { quantity: newQuantity },
        { session, new: true, runValidators: true }
      );

      res.status(200).json({
        success: true,
        data: updatedTransaction
      });
    });
  } catch (error) {
    if (error.message.includes('not found') || error.message.includes('Insufficient stock')) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }
    next(error);
  } finally {
    await session.endSession();
  }
};

// @desc    Delete transaction
// @route   DELETE /api/v1/transactions/:id
// @access  Private (Admin only)
const deleteTransaction = async (req, res, next) => {
  const session = await mongoose.startSession();
  
  try {
    await session.withTransaction(async () => {
      // Get the transaction to delete
      const transaction = await Transaction.findById(req.params.id).session(session);
      if (!transaction) {
        throw new Error('Transaction not found');
      }

      // Get the product
      const product = await Product.findById(transaction.product).session(session);
      if (!product) {
        throw new Error('Associated product not found');
      }

      // Revert the transaction's effect on inventory
      let newQuantity;
      if (transaction.type === 'input') {
        newQuantity = product.quantity - transaction.quantity;
      } else {
        newQuantity = product.quantity + transaction.quantity;
      }

      // Check if reverting would result in negative stock
      if (newQuantity < 0) {
        throw new Error(`Cannot delete transaction: would result in negative stock (${newQuantity})`);
      }

      // Delete the transaction
      await Transaction.findByIdAndDelete(req.params.id).session(session);

      // Update product quantity
      await Product.findByIdAndUpdate(
        transaction.product,
        { quantity: newQuantity },
        { session, new: true, runValidators: true }
      );

      res.status(200).json({
        success: true,
        message: 'Transaction deleted successfully'
      });
    });
  } catch (error) {
    if (error.message.includes('not found') || error.message.includes('negative stock')) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }
    next(error);
  } finally {
    await session.endSession();
  }
};

const getTransactionHistory = async (req, res, next) => {
  try {
    // Fetch all transactions sorted by date descending (newest first)
    const transactions = await Transaction.find({})
      .sort({ date: -1 });

    res.status(200).json({
      success: true,
      count: transactions.length,
      data: transactions
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllTransactions,
  getTransactionById,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  getTransactionHistory
};
