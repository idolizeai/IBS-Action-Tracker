const jwt = require('jsonwebtoken');
const { User } = require('../models');
const { error } = require('../utils/response');

function authMiddleware(req, res, next) {
  const token = req.cookies?.access_token;
  if (!token) {
    return res.status(401).json({ success: false, error: 'No token provided' });
  }
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ success: false, error: 'Invalid or expired token' });
  }
}

async function adminOnly(req, res, next) {
  const user = await User.findByPk(req.user.id, {
    attributes: ['id', 'role']
  });
  if (user.dataValues.role !== 'admin') {
    return res.status(403).json({ success: false, error: 'Admin access required' });
  }
  next();
}


async function isIbsExist(req, res, next) {
  try {
    const { email } = req.body;
    if (!email) {
      return error(res, 'Email is required', 400);
    }


    next();
  } catch (err) {
    console.error('Error in isIbsExist middleware:', err);
    next(err);
  }
}

module.exports = { authMiddleware, adminOnly, isIbsExist };
