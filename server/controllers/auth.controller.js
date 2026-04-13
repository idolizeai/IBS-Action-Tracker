const { IBSLead } = require('../models');
const AuthService = require('../services/auth.service');
const { success, created, error } = require('../utils/response');

const IS_PROD = process.env.NODE_ENV === 'production';

const ACCESS_COOKIE_OPTS = {
  httpOnly: true,
  secure: IS_PROD,
  sameSite: 'Strict',
  path: '/',
  maxAge: 15 * 60 * 1000, // 15 minutes
};

const REFRESH_COOKIE_OPTS = {
  httpOnly: true,
  secure: IS_PROD,
  sameSite: 'Strict',
  path: '/',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};

const setCookies = (res, accessToken, refreshToken) => {
  res.cookie('access_token', accessToken, ACCESS_COOKIE_OPTS);
  res.cookie('refresh_token', refreshToken, REFRESH_COOKIE_OPTS);
};

const clearCookies = (res) => {
  res.clearCookie('access_token', { path: '/' });
  res.clearCookie('refresh_token', { path: '/' });
};

const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return error(res, 'name, email and password are required');
    }
    if (password.length < 8) {
      return error(res, 'Password must be at least 8 characters', 400);
    }
    const ibs_lead = await IBSLead.findOne({ where: { email: email.toLowerCase() } });
    if (!ibs_lead) {
      return error(res, 'You are not authorized to register', 401);
    }
    // SECURITY: role is NEVER passed from client — always 'user'
    const { accessToken, refreshToken, user } = await AuthService.register(name, email, password, ibs_lead.id);
    setCookies(res, accessToken, refreshToken);
    return created(res, { user });
  } catch (err) {
    if (err.statusCode) return error(res, err.message, err.statusCode);
    next(err);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return error(res, 'email and password are required');
    }
    const { accessToken, refreshToken, user } = await AuthService.login(email, password);
    setCookies(res, accessToken, refreshToken);
    return success(res, { user });
  } catch (err) {
    if (err.statusCode) return error(res, err.message, err.statusCode);
    next(err);
  }
};

const refresh = async (req, res, next) => {
  try {
    const rawRefreshToken = req.cookies?.refresh_token;
    if (!rawRefreshToken) {
      return error(res, 'No refresh token provided', 401);
    }
    const { accessToken, newRefreshToken, user } = await AuthService.refreshAccessToken(rawRefreshToken);
    setCookies(res, accessToken, newRefreshToken);
    return success(res, { user });
  } catch (err) {
    clearCookies(res);
    if (err.statusCode) return error(res, err.message, err.statusCode);
    next(err);
  }
};

const logout = async (req, res, next) => {
  try {
    const rawRefreshToken = req.cookies?.refresh_token;
    await AuthService.revokeRefreshToken(rawRefreshToken);
    clearCookies(res);
    return success(res, { message: 'Logged out' });
  } catch (err) {
    next(err);
  }
};


const EMAIL_REGEX    = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const OTP_REGEX      = /^\d{6}$/;
 
/**
 * Password strength rules (no external library):
 *  • At least 8 characters
 *  • At least one uppercase letter
 *  • At least one lowercase letter
 *  • At least one digit
 *  • At least one special character
 */
const PASSWORD_RULES = [
  { test: (p) => p.length >= 8,            message: 'Password must be at least 8 characters' },
  { test: (p) => /[A-Z]/.test(p),          message: 'Password must contain at least one uppercase letter' },
  { test: (p) => /[a-z]/.test(p),          message: 'Password must contain at least one lowercase letter' },
  { test: (p) => /[0-9]/.test(p),          message: 'Password must contain at least one number' },
  { test: (p) => /[^A-Za-z0-9]/.test(p),  message: 'Password must contain at least one special character' },
];
 
/**
 * Returns the first failing password rule message, or null if all pass.
 */
const validatePassword = (password) => {
  for (const rule of PASSWORD_RULES) {
    if (!rule.test(password)) return rule.message;
  }
  return null;
};
 
// ─── Controllers ─────────────────────────────────────────────────────────────
 
/**
 * POST /auth/forgot-password
 * Body: { email }
 *
 * Always returns 200 even when the email is not found to avoid account
 * enumeration.  Internal errors are still forwarded to the error middleware.
 */
const forgetPassword = async (req, res, next) => { // ← next was missing
  try {
    const rawEmail = req.body.email;
 
    // ── Input presence check ──────────────────────────────────────────────
    if (!rawEmail || typeof rawEmail !== 'string' || !rawEmail.trim()) {
      return error(res, 'email is required', 400);
    }
 
    const email = rawEmail.trim().toLowerCase();
 
    // ── Format validation ─────────────────────────────────────────────────
    if (!EMAIL_REGEX.test(email)) {
      return error(res, 'Invalid email format', 400);
    }
 
    // ── Length cap (prevents oversized payloads reaching the DB) ──────────
    if (email.length > 254) { // RFC 5321 maximum
      return error(res, 'Email address is too long', 400);
    }
 
    await AuthService.forgetPassword(email);
 
    // Always respond with success — do NOT reveal whether the email exists
    return success(res, { message: 'If this email is registered, an OTP has been sent' });
 
  } catch (err) { // ← renamed from 'error' to 'err' to avoid shadowing the helper
    if (err.statusCode) return error(res, err.message, err.statusCode);
    next(err);
  }
};
 
/**
 * POST /auth/verify-otp
 * Body: { email, otp, newPassword }
 */
const verifyOTP = async (req, res, next) => {
  try {
    const { email: rawEmail, otp: rawOtp, newPassword } = req.body;
 
    // ── Presence checks ───────────────────────────────────────────────────
    const missing = [];
    if (!rawEmail    || typeof rawEmail    !== 'string' || !rawEmail.trim())    missing.push('email');
    if (!rawOtp      || (typeof rawOtp !== 'string' && typeof rawOtp !== 'number')) missing.push('otp');
    if (!newPassword || typeof newPassword !== 'string' || !newPassword.trim()) missing.push('newPassword');
 
    if (missing.length > 0) {
      return error(res, `The following fields are required: ${missing.join(', ')}`, 400);
    }
 
    const email = rawEmail.trim().toLowerCase();
    const otp   = String(rawOtp).trim();
 
    // ── Email validation ──────────────────────────────────────────────────
    if (!EMAIL_REGEX.test(email)) {
      return error(res, 'Invalid email format', 400);
    }
    if (email.length > 254) {
      return error(res, 'Email address is too long', 400);
    }
 
    // ── OTP format validation (exactly 6 numeric digits) ─────────────────
    if (!OTP_REGEX.test(otp)) {
      return error(res, 'OTP must be exactly 6 digits', 400);
    }
 
    // ── Password strength validation ──────────────────────────────────────
    const passwordError = validatePassword(newPassword);
    if (passwordError) {
      return error(res, passwordError, 400);
    }
 
    // ── Delegate to service ───────────────────────────────────────────────
    await AuthService.verifyOtpAndUpdatePassword(email, otp, newPassword);
 
    return success(res, { message: 'Password reset successfully' });
 
  } catch (err) { // ← renamed to avoid shadowing
    if (err.statusCode) return error(res, err.message, err.statusCode);
    next(err);
  }
};
 
const me = (req, res) => {
  success(res, { user: req.user });
};

module.exports = { register, login, refresh, logout, me, forgetPassword, verifyOTP };
