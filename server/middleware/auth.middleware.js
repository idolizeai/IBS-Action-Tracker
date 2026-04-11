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

/**
 * JWT-based admin check (fast, but forgeable if JWT_SECRET is compromised)
 * Use for non-critical admin routes only.
 */
function adminOnly(req, res, next) {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ success: false, error: 'Admin access required' });
  }
  next();
}

/**
 * DATABASE-BASED admin check (SECURE — cannot be bypassed by forging JWT)
 * Use this for ALL critical admin operations (create leads, delete users, etc.)
 * This is the DEFENSE-IN-DEPTH layer.
 */
async function adminOnlyDb(req, res, next) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }

    // Re-fetch role from database — JWT can be forged, DB cannot
    const user = await User.findOne({
      where: { id: userId },
      attributes: ['id', 'role'],
    });

    if (!user) {
      return res.status(401).json({ success: false, error: 'User not found' });
    }

    if (user.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Admin access required' });
    }

    // Attach verified user to request for downstream use
    req.dbUser = user;
    next();
  } catch (err) {
    console.error('adminOnlyDb error:', err);
    return res.status(500).json({ success: false, error: 'Server error' });
  }
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

module.exports = { authMiddleware, adminOnly, adminOnlyDb, isIbsExist };
