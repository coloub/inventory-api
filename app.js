require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('./swagger.json');
const userRoutes = require('./routes/userRoutes');
const transactionRoutes = require('./routes/transactionRoutes');
const session = require('express-session');
const passport = require('passport');
require('./auth/passport');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

const categoryRoutes = require('./routes/categoryRoutes');
const productRoutes = require('./routes/productRoutes');

app.use('/api/categories', categoryRoutes);
app.use('/api/products', productRoutes);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
app.use('/api/users', userRoutes);
app.use('/api/transactions', transactionRoutes);
app.use(session({
  secret: 'supersecretkey',
  resave: false,
  saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());

app.get('/auth/google',
  passport.authenticate('google', { scope: ['profile', 'email'] }));

app.get('/auth/google/callback',
  passport.authenticate('google', {
    successRedirect: '/public',
    failureRedirect: '/auth/fail'
  }));

app.get('/auth/fail', (req, res) => {
  res.status(401).send('Authentication Failed');
});



const mongoUri = process.env.MONGODB_URL || 'mongodb://localhost:27017/inventory';

if (process.env.NODE_ENV !== 'test') {
  mongoose.connect(mongoUri)
    .then(() => {
      console.log('Connected to MongoDB');
      app.listen(process.env.PORT || 3000, () =>
        console.log('Server is running')
      );
    })
    .catch(err => console.error(err));
} else {
  mongoose.connect(mongoUri)
    .then(() => {
      console.log('Connected to MongoDB');
    })
    .catch(err => console.error(err));
}

module.exports = app;
