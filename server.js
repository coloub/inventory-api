const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');
const { specs, swaggerUi } = require('./config/swagger');

// Load environment variables
dotenv.config();

// Connect to database
connectDB();

const app = express();

// Body parser middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Enable CORS
app.use(cors());

// Swagger Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Inventory API Documentation'
}));

// Routes
app.use('/api/v1/products', require('./routes/products'));
app.use('/api/v1/categories', require('./routes/categories')); // NEW: Category routes

// Health check route
app.get('/', (req, res) => {
  res.json({
    message: 'Inventory API is running!',
    version: '1.0.0',
    documentation: '/api-docs',
    endpoints: {
      products: '/api/v1/products',
      categories: '/api/v1/categories' // NEW: Show category endpoint
    }
  });
});

// Error handler middleware (must be last)
app.use(errorHandler);

const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
  console.log(`API Documentation available at http://localhost:${PORT}/api-docs`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.log(`Error: ${err.message}`);
  // Close server & exit process
  server.close(() => {
    process.exit(1);
  });
});

module.exports = app;