const { Router } = require('express');
const AuthController = require('../controllers/auth.controller');
const { authMiddleware } = require('../middleware/auth.middleware');

const router = Router();

router.post('/register', AuthController.register);
router.post('/login',    AuthController.login);
router.get('/me',        authMiddleware, AuthController.me);

module.exports = router;
