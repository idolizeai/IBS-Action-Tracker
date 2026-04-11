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
  res.clearCookie('access_token',  { path: '/' });
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

const me = (req, res) => {
  success(res, { user: req.user });
};

module.exports = { register, login, refresh, logout, me };
