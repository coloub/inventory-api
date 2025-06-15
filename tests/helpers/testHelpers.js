const jwt = require('jsonwebtoken');
const User = require('../../models/User');
const Product = require('../../models/Product');

// JWT Secret for testing
const JWT_SECRET = 'test-jwt-secret-key';

// Create a test user and return JWT token
const createTestUserAndToken = async (role = 'user') => {
  const userData = {
    googleId: `test-google-id-${Date.now()}`,
    displayName: 'Test User',
    email: `test${Date.now()}@example.com`,
    role: role,
    avatar: 'https://example.com/avatar.jpg',
    isActive: true
  };

  const user = new User(userData);
  await user.save();

  // Generate JWT token manually (since we're in test environment)
  const token = jwt.sign(
    { 
      id: user._id,
      email: user.email,
      role: user.role 
    },
    process.env.JWT_SECRET || JWT_SECRET,
    { expiresIn: '1h' }
  );

  return { user, token };
};

// Create test product data
const createTestProduct = async () => {
  const productData = {
    name: 'Test Product',
    sku: `TEST-${Date.now()}`,
    description: 'This is a test product',
    price: 29.99,
    quantity: 100,
    category: 'Electronics',
    vendor: 'Test Vendor'
  };

  const product = new Product(productData);
  await product.save();
  return product;
};

// Create multiple test products
const createTestProducts = async (count = 3) => {
  const products = [];
  for (let i = 0; i < count; i++) {
    const productData = {
      name: `Test Product ${i + 1}`,
      sku: `TEST-${Date.now()}-${i}`,
      description: `This is test product number ${i + 1}`,
      price: 29.99 + i,
      quantity: 100 + i * 10,
      category: i % 2 === 0 ? 'Electronics' : 'Books',
      vendor: `Test Vendor ${i + 1}`
    };

    const product = new Product(productData);
    await product.save();
    products.push(product);
  }
  return products;
};

// Generate valid JWT token for testing
const generateTestToken = (userId, role = 'user') => {
  return jwt.sign(
    { 
      id: userId,
      role: role 
    },
    process.env.JWT_SECRET || JWT_SECRET,
    { expiresIn: '1h' }
  );
};

// Generate invalid JWT token for testing
const generateInvalidToken = () => {
  return jwt.sign(
    { id: 'invalid' },
    'wrong-secret',
    { expiresIn: '1h' }
  );
};

module.exports = {
  createTestUserAndToken,
  createTestProduct,
  createTestProducts,
  generateTestToken,
  generateInvalidToken,
  JWT_SECRET
};