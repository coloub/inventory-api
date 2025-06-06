const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  sku: { type: String, required: true, unique: true },
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
  quantity: { type: Number, default: 0 },
  price: { type: Number, required: true },
  description: String,
  supplier: String
}, { timestamps: true });

module.exports = mongoose.model('Product', productSchema);
