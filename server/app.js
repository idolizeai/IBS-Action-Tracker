require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

// Crash immediately if critical env vars are missing — better to fail fast than
// silently sign tokens with undefined secret or connect to wrong DB.
if (!process.env.JWT_SECRET) {
  console.error('FATAL: JWT_SECRET environment variable is not set. Server cannot start.');
  process.exit(1);
}

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');

const apiRoutes = require('./routes');
const errorHandler = require('./middleware/error.middleware');

const app = express();

// Security headers: X-Frame-Options, X-Content-Type-Options, HSTS, etc.
app.use(helmet());

<<<<<<< HEAD
const allowedOrigins = process.env.CLIENT_ORIGIN
  ? process.env.CLIENT_ORIGIN.split(',')
  : ['http://localhost:5173', 'http://localhost:5174'];

app.use(cors({
  origin: allowedOrigins,
=======
app.use(cors({
  origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
>>>>>>> 25cd64f90a730b43cd747e13845932684e835196
  credentials: true,
}));
app.use(cookieParser());
app.use(express.json({ limit: '100kb' }));

app.use('/api', apiRoutes);

app.get('/api/health', (_, res) => res.json({ status: 'ok' }));

app.use(errorHandler);

module.exports = app;
