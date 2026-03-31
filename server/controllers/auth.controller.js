const AuthService = require('../services/auth.service');
const { success, created, error } = require('../utils/response');

const register = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password) {
      return error(res, 'name, email and password are required');
    }
    const result = await AuthService.register(name, email, password, role);
    return created(res, result);
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
    const result = await AuthService.login(email, password);
    return success(res, result);
  } catch (err) {
    if (err.statusCode) return error(res, err.message, err.statusCode);
    next(err);
  }
};

const me = (req, res) => {
  success(res, { user: req.user });
};

module.exports = { register, login, me };
