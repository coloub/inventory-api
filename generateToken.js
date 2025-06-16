const jwt = require('jsonwebtoken');
require('dotenv').config();

const payload = {
  id: 'test-user-id',
  email: 'testuser@example.com',
  role: 'user'
};

const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE || '7d' });

console.log('Generated JWT Token:');
console.log(token);
