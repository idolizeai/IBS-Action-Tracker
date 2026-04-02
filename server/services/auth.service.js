const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User } = require('../models');

const generateToken = (user) =>
  jwt.sign(
    { id: user.id, email: user.email, name: user.name, role: user.role, ibs_lead_id: user.ibs_lead_id },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );

const register = async (name, email, password, role, ibs_lead_id) => {
  const existing = await User.findOne({ where: { email: email.toLowerCase() } });
  if (existing) {
    const err = new Error('Email already registered');
    err.statusCode = 409;
    throw err;
  }

  const password_hash = await bcrypt.hash(password, 10);
  const userRole = role === 'admin' ? 'admin' : 'user';

  const user = await User.create({
    name,
    email: email.toLowerCase(),
    password_hash,
    ibs_lead_id,
    role: userRole,
  });

  return { token: generateToken(user), user };
};

const login = async (email, password) => {
  // Use unscoped to include password_hash for comparison
  const user = await User.unscoped().findOne({ where: { email: email.toLowerCase() } });
  if (!user) {
    const err = new Error('Invalid credentials');
    err.statusCode = 401;
    throw err;
  }

  const match = await bcrypt.compare(password, user.password_hash);
  if (!match) {
    const err = new Error('Invalid credentials');
    err.statusCode = 401;
    throw err;
  }

  const safeUser = user.toJSON(); // password_hash already stripped by toJSON override
  return { token: generateToken(safeUser), user: safeUser };
};

module.exports = { register, login };
