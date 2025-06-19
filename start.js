// server.js o index.js
const app = require('./server');
const cors = require('cors'); // 👈 Importar CORS
const connectDB = require('./config/db');

// Connect to database
connectDB();

// Usar CORS (permite llamadas desde otros orígenes, como tu frontend)
app.use(cors({
  origin: ['http://localhost:3000', 'https://inventory-api-hrlt.onrender.com'], // Agrega aquí tu dominio real si lo tienes
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));

const PORT = process.env.PORT || 3000;
const HOST = '0.0.0.0'; // 👈 Permite conexiones externas

const server = app.listen(PORT, HOST, () => {
  const domain = process.env.NODE_ENV === 'production'
    ? `https://${process.env.DOMAIN || 'inventory-api-hrlt.onrender.com'}`
    : `http://localhost:${PORT}`;

  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
  console.log(`API Documentation available at ${domain}/api-docs`);
  console.log(`Google OAuth login at ${domain}/auth/google`);
});

// Manejo de promesas no controladas
process.on('unhandledRejection', (err, promise) => {
  console.log(`Error: ${err.message}`);
  server.close(() => {
    process.exit(1);
  });
});

module.exports = server;
