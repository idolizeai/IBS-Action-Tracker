const jwt = require('jsonwebtoken');
const { IBSLead } = require('../models');
const { error } = require('../utils/response');

function authMiddleware(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, error: 'No token provided' });
  }
  const token = header.split(' ')[1];
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ success: false, error: 'Invalid or expired token' });
  }
}

function adminOnly(req, res, next) {
  if (req.user?.role !== 'admin') {
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
