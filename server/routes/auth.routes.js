const { Router } = require('express');
const rateLimit = require('express-rate-limit');
const AuthController = require('../controllers/auth.controller');
const { authMiddleware } = require('../middleware/auth.middleware');

const router = Router();

// Max 10 login attempts per 15 minutes per IP
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many login attempts. Please wait 15 minutes before trying again.',
  },
});

// Max 5 register attempts per hour per IP
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many registration attempts. Please wait 1 hour before trying again.',
  },
});

router.post('/register', registerLimiter, AuthController.register);
router.post('/login',    loginLimiter,    AuthController.login);
router.post('/refresh',  AuthController.refresh);
router.post('/logout',   AuthController.logout);
router.get('/me',        authMiddleware,  AuthController.me);

module.exports = router;
