const express = require('express');
const passport = require('passport');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { authenticateJWT } = require('../middleware/auth');
const User = require('../models/User');

const router = express.Router();

/**
 * @swagger
 * /auth/signup:
 *   post:
 *     summary: Create a new user account (regular user or admin)
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - displayName
 *               - email
 *               - password
 *             properties:
 *               displayName:
 *                 type: string
 *                 description: User's display name
 *                 example: John Doe
 *               email:
 *                 type: string
 *                 format: email
 *                 description: User's email address
 *                 example: johndoe@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 description: User's password
 *                 example: Password123!
 *               adminSecret:
 *                 type: string
 *                 description: >
 *                   Optional secret key to create an admin account. Must match the server's JWT_SECRET.
 *                   Required only for admin account creation.
 *                 example: your_jwt_secret_here
 *     responses:
 *       201:
 *         description: User created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       400:
 *         description: Bad request (validation errors)
 *       403:
 *         description: Forbidden (invalid adminSecret)
 *       500:
 *         description: Server error
 */
router.post('/signup', async (req, res) => {
  const { displayName, email, password, adminSecret } = req.body;

  if (!displayName || !email || !password) {
    return res.status(400).json({ success: false, message: 'Display name, email, and password are required' });
  }

  try {
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Email already in use' });
    }

    let role = 'user';
    if (adminSecret) {
      if (adminSecret !== process.env.JWT_SECRET) {
        return res.status(403).json({ success: false, message: 'Invalid adminSecret' });
      }
      role = 'admin';
    }

    const newUser = new User({
      displayName,
      email,
      password,
      role
    });

    await newUser.save();

    res.status(201).json({
      success: true,
      user: newUser.getPublicProfile()
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: User ID
 *         displayName:
 *           type: string
 *           description: User's display name
 *         email:
 *           type: string
 *           description: User's email address
 *         role:
 *           type: string
 *           enum: [user, admin]
 *           description: User's role
 *         avatar:
 *           type: string
 *           description: User's profile picture URL
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Account creation date
 */

/**
 * @swagger
 * /auth/google:
 *   get:
 *     summary: Initiate Google OAuth login
 *     tags: [Authentication]
 *     description: Redirects user to Google OAuth consent screen
 *     responses:
 *       302:
 *         description: Redirect to Google OAuth
 */
router.get('/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

/**
 * @swagger
 * /auth/google/callback:
 *   get:
 *     summary: Google OAuth callback
 *     tags: [Authentication]
 *     description: Handles the callback from Google OAuth and generates JWT token
 *     responses:
 *       200:
 *         description: Authentication successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 token:
 *                   type: string
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       401:
 *         description: Authentication failed
 */
router.get('/google/callback',
  passport.authenticate('google', { failureRedirect: '/auth/failure' }),
  async (req, res) => {
    try {
      // Generate JWT token
      const token = req.user.getSignedJwtToken();
      const user = req.user.getPublicProfile();

      // Set cookie with JWT token (optional)
      res.cookie('token', token, {
        expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict'
      });

      // For development, you can redirect to a success page or return JSON
      if (process.env.NODE_ENV === 'development') {
        res.json({
          success: true,
          message: 'Authentication successful',
          token,
          user
        });
      } else {
        // In production, redirect to frontend with token
        res.redirect(`${process.env.CLIENT_URL}/dashboard?token=${token}`);
      }
    } catch (error) {
      console.error('Callback error:', error);
      res.status(500).json({
        success: false,
        message: 'Authentication failed'
      });
    }
  }
);

/**
 * @swagger
 * /auth/me:
 *   get:
 *     summary: Get current user profile
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Current user profile
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       401:
 *         description: Not authenticated
 */
router.get('/me', authenticateJWT, async (req, res) => {
  try {
    const user = req.user.getPublicProfile();
    res.json({
      success: true,
      user
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     summary: Logout user
 *     tags: [Authentication]
 *     responses:
 *       200:
 *         description: Logout successful
 */
router.post('/logout', (req, res) => {
  // Clear the token cookie
  res.clearCookie('token');
  
  // Logout from passport session
  req.logout((err) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: 'Logout failed'
      });
    }
    
    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  });
});

/**
 * @swagger
 * /auth/failure:
 *   get:
 *     summary: Authentication failure page
 *     tags: [Authentication]
 *     responses:
 *       401:
 *         description: Authentication failed
 */
router.get('/failure', (req, res) => {
  res.status(401).json({
    success: false,
    message: 'Authentication failed'
  });
});

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: User login with email and password
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 format: password
 *     responses:
 *       200:
 *         description: Successful login, returns JWT token and user info
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       401:
 *         description: Invalid credentials
 */
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
    const payload = {
      id: user._id,
      email: user.email,
      role: user.role
    };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE || '7d' });
    res.json({
      success: true,
      token,
      user: user.getPublicProfile()
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

/**
 * @swagger
 * /auth/token:
 *   get:
 *     summary: Generate a test JWT token for a dummy user (for testing only)
 *     tags: [Authentication]
 *     responses:
 *       200:
 *         description: Returns a JWT token
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 */

router.get('/token', async (req, res) => {
  try {
    // Find or create a test user
    let user = await User.findOne({ email: 'testuser@example.com' });
    if (!user) {
      user = new User({
        email: 'testuser@example.com',
        password: 'Test@1234', // You may want to hash this or set a default
        role: 'user',
        displayName: 'Test User'
      });
      await user.save();
    }

    const payload = {
      id: user._id,
      email: user.email,
      role: user.role
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE || '7d' });
    res.json({ token });
  } catch (error) {
    console.error('Error generating test token:', error);
    res.status(500).json({ success: false, message: 'Failed to generate token' });
  }
});

module.exports = router;
