const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  type: {
    type: String,
    required: [true, 'Transaction type is required'],
    enum: {
      values: ['input', 'output'],
      message: 'Transaction type must be either input or output'
    }
  },
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: [true, 'Product reference is required']
  },
  quantity: {
    type: Number,
    required: [true, 'Quantity is required'],
    min: [1, 'Quantity must be at least 1'],
    validate: {
      validator: Number.isInteger,
      message: 'Quantity must be a whole number'
    }
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User reference is required']
  },
  date: {
    type: Date,
    default: Date.now
  },
  notes: {
    type: String,
    trim: true,
    maxlength: [500, 'Notes cannot exceed 500 characters'],
    default: ''
  }
}, {
  timestamps: true // Automatically adds createdAt and updatedAt fields
});

// Create indexes for better query performance
transactionSchema.index({ product: 1 });
transactionSchema.index({ user: 1 });
transactionSchema.index({ type: 1 });
transactionSchema.index({ date: -1 });

// Pre-populate product and user information when querying
transactionSchema.pre(/^find/, function(next) {
  this.populate({
    path: 'product',
    select: 'name sku category quantity'
  }).populate({
    path: 'user',
    select: 'name email'
  });
  next();
});

module.exports = mongoose.model('Transaction', transactionSchema);