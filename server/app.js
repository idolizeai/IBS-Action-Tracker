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
const { sendMail } = require('./utils/email');

const app = express();

const send = async () => {
  const resul = await sendMail({
    to: "Prakash.Jha@idolizesolutions.com",
    subject: "Hello",
    html: "<h1>Test Email</h1>"
  });
  console.log(resul)
}
send();


// Trust IIS proxy headers (required for rate limiting, IP detection, and X-Forwarded-For)
app.set('trust proxy', true);

// Security headers: X-Frame-Options, X-Content-Type-Options, HSTS, etc.
app.use(helmet());

const allowedOrigins = process.env.CLIENT_ORIGIN
  ? process.env.CLIENT_ORIGIN.split(',')
  : ['http://localhost:5173', 'http://localhost:5174','http://localhost:5176'];

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
}));
app.use(cookieParser());
app.use(express.json({ limit: '100kb' }));

app.use('/api', apiRoutes);

app.get('/api/health', (_, res) => res.json({ status: 'ok' }));

app.use(errorHandler);

module.exports = app;
