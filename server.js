const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const cookieParser = require('cookie-parser'); // NEW
const passport = require('passport'); // NEW
const session = require('express-session'); // NEW (install with: npm install express-session)
const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');
const { specs, swaggerUi } = require('./config/swagger');

// Load environment variables
dotenv.config();

// Passport configuration
require('./config/passport')(passport); // NEW

// Connect to database
connectDB();

const app = express();

// Body parser middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Cookie parser middleware
app.use(cookieParser()); // NEW

// Session middleware (required for Passport)
app.use(session({ // NEW
  secret: process.env.JWT_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Passport middleware
app.use(passport.initialize()); // NEW
app.use(passport.session()); // NEW

// Enable CORS
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true // Important for cookies
}));

// Swagger Documentation (updated to include auth)
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Inventory API Documentation'
}));

// Routes
app.use('/auth', require('./routes/auth')); // NEW: Auth routes
app.use('/api/v1/products', require('./routes/products')); // Will be protected
app.use('/api/v1/categories', require('./routes/categories')); // Will be protected
app.use('/api/v1/transactions', require('./routes/transactions')); // NEW: Transaction routes

// Serve frontend static files
const path = require('path');
app.use(express.static(path.join(__dirname, 'frontend')));

// Serve frontend index.html for /dashboard route to handle token in URL
app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend', 'index.html'));
});

// Health check route
app.get('/', (req, res) => {
  res.json({
    message: 'Inventory API is running!',
    version: '1.0.0',
    documentation: '/api-docs',
    authentication: '/auth/google', // NEW
    endpoints: {
      auth: '/auth',
      products: '/api/v1/products',
      categories: '/api/v1/categories'
    }
  });
});

// Error handler middleware (must be last)
app.use(errorHandler);

module.exports = app;
