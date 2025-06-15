const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Category name is required'],
    unique: true,
    trim: true,
    maxlength: [50, 'Category name cannot exceed 50 characters'],
    minlength: [2, 'Category name must be at least 2 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [200, 'Description cannot exceed 200 characters'],
    default: ''
  }
}, {
  timestamps: true // Automatically adds createdAt and updatedAt fields
});

// Create index for better search performance
categorySchema.index({ name: 'text' });

// Pre-save middleware to capitalize first letter of category name
categorySchema.pre('save', function(next) {
  if (this.name) {
    this.name = this.name.charAt(0).toUpperCase() + this.name.slice(1).toLowerCase();
  }
  next();
});

// Instance method to get products in this category
categorySchema.methods.getProducts = function() {
  const Product = mongoose.model('Product');
  return Product.find({ category: this.name });
};

module.exports = mongoose.model('Category', categorySchema);