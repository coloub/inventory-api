const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true,
    maxlength: [100, 'Product name cannot exceed 100 characters']
  },
  sku: {
    type: String,
    required: [true, 'SKU is required'],
    unique: true,
    trim: true,
    uppercase: true,
    maxlength: [20, 'SKU cannot exceed 20 characters']
  },
  description: {
    type: String,
    required: [true, 'Product description is required'],
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: [0, 'Price cannot be negative']
  },
  quantity: {
    type: Number,
    required: [true, 'Quantity is required'],
    min: [0, 'Quantity cannot be negative'],
    default: 0
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    trim: true,
    maxlength: [50, 'Category cannot exceed 50 characters']
  },
  vendor: {
    type: String,
    required: [true, 'Vendor is required'],
    trim: true,
    maxlength: [100, 'Vendor name cannot exceed 100 characters']
  }
}, {
  timestamps: true // Automatically adds createdAt and updatedAt fields
});

// Create index for better search performance
productSchema.index({ name: 'text', description: 'text' });
productSchema.index({ sku: 1 });
productSchema.index({ category: 1 });

module.exports = mongoose.model('Product', productSchema);