const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { literal } = require('sequelize');
const { User, RefreshToken } = require('../models');

const hashToken = (token) =>
  crypto.createHash('sha256').update(token).digest('hex');

const generateAccessToken = (user) =>
  jwt.sign(
    { id: user.id, email: user.email, name: user.name, role: user.role, ibs_lead_id: user.ibs_lead_id },
    process.env.JWT_SECRET,
    { expiresIn: '15m' }
  );

const createRefreshToken = async (userId) => {
  const rawToken = crypto.randomBytes(64).toString('hex');
  await RefreshToken.create({
    user_id: userId,
    token_hash: hashToken(rawToken),
    // Use DATEADD so MSSQL computes the date — avoids the +00:00 timezone
    // format that MSSQL DATETIME rejects when sent from the JS driver.
    expires_at: literal('DATEADD(day, 7, GETDATE())'),
  });
  return rawToken;
};

const register = async (name, email, password, ibs_lead_id) => {
  const existing = await User.findOne({ where: { email: email.toLowerCase() } });
  if (existing) {
    const err = new Error('Email already registered');
    err.statusCode = 409;
    throw err;
  }

  const password_hash = await bcrypt.hash(password, 10);
  const user = await User.create({
    name,
    email: email.toLowerCase(),
    password_hash,
    ibs_lead_id,
    role: 'user',
  });

  const accessToken = generateAccessToken(user);
  const refreshToken = await createRefreshToken(user.id);
  return { accessToken, refreshToken, user: user.toJSON() };
};

const login = async (email, password) => {
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

  const accessToken = generateAccessToken(user);
  const refreshToken = await createRefreshToken(user.id);
  return { accessToken, refreshToken, user: user.toJSON() };
};

const refreshAccessToken = async (rawToken) => {
  const tokenRecord = await RefreshToken.findOne({
    where: { token_hash: hashToken(rawToken) },
  });

  if (!tokenRecord) {
    const err = new Error('Invalid refresh token');
    err.statusCode = 401;
    throw err;
  }

  if (new Date() > new Date(tokenRecord.expires_at)) {
    await tokenRecord.destroy();
    const err = new Error('Refresh token expired, please log in again');
    err.statusCode = 401;
    throw err;
  }

  const user = await User.findByPk(tokenRecord.user_id);
  if (!user) {
    await tokenRecord.destroy();
    const err = new Error('User not found');
    err.statusCode = 401;
    throw err;
  }

  // Rotate: delete old refresh token, issue a new one
  await tokenRecord.destroy();
  const newRefreshToken = await createRefreshToken(user.id);
  const accessToken = generateAccessToken(user);

  return { accessToken, newRefreshToken, user: user.toJSON() };
};

const revokeRefreshToken = async (rawToken) => {
  if (!rawToken) return;
  await RefreshToken.destroy({ where: { token_hash: hashToken(rawToken) } });
};

module.exports = { register, login, refreshAccessToken, revokeRefreshToken };
