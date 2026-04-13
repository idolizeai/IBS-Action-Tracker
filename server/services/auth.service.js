const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { literal } = require('sequelize');
const { User, RefreshToken, IBSLead } = require('../models');
const { forgotPasswordOtpTemplate, passwordResetSuccessTemplate } = require('../utils/emailtemplate');
const { sendMail } = require('../utils/email');

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

// ─── Constants ────────────────────────────────────────────────────────────────
const OTP_EXPIRY_MS = 10 * 60 * 1000; // 10 minutes
const BCRYPT_SALT_ROUNDS = 12;             // increased from 10 → 12

const generateSecureOtp = () => {
  return crypto.randomInt(100_000, 1_000_000);
};

const getISTTime = (date) => {
  // Convert to IST (UTC+5:30)
  const istDate = new Date(date.getTime() + 5.5 * 60 * 60 * 1000);
  const year = istDate.getUTCFullYear();
  const month = String(istDate.getUTCMonth() + 1).padStart(2, '0');
  const day = String(istDate.getUTCDate()).padStart(2, '0');
  const hours = String(istDate.getUTCHours()).padStart(2, '0');
  const minutes = String(istDate.getUTCMinutes()).padStart(2, '0');
  const seconds = String(istDate.getUTCSeconds()).padStart(2, '0');
  const milliseconds = String(istDate.getUTCMilliseconds()).padStart(3, '0');

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}.${milliseconds}`;
};

const parseISTTime = (istTimeString) => {
  // Parse IST formatted string back to Date for comparison
  // Format: 2026-04-13 16:46:24.223
  // Convert back to UTC by subtracting 5.5 hours
  const [datePart, timePart] = istTimeString.split(' ');
  const [year, month, day] = datePart.split('-');
  const [hours, minutes, secondsWithMs] = timePart.split(':');
  const [seconds, milliseconds] = secondsWithMs.split('.');

  // Create UTC date
  const utcDate = new Date(Date.UTC(
    parseInt(year),
    parseInt(month) - 1,
    parseInt(day),
    parseInt(hours),
    parseInt(minutes),
    parseInt(seconds),
    parseInt(milliseconds)
  ));

  return utcDate;
};

const safeEqual = (a, b) => {
  const strA = String(a);
  const strB = String(b);
  // Both buffers must be the same length for timingSafeEqual
  if (strA.length !== strB.length) return false;
  return crypto.timingSafeEqual(Buffer.from(strA), Buffer.from(strB));
};

const forgetPassword = async (email) => {
  const normalisedEmail = email.trim().toLowerCase();
  const ibsLead = await IBSLead.findOne({ where: { email: normalisedEmail } });
  if (!ibsLead) {
    const err = new Error('User not found');
    err.statusCode = 404;
    throw err;
  }
  const user = await User.findOne({ where: { email: normalisedEmail } });
  if (!user) {
    const err = new Error('User not found');
    err.statusCode = 404;
    throw err;
  }

  const otp = generateSecureOtp();

  const otpExpiry = new Date(Date.now() + OTP_EXPIRY_MS);
  const formattedDate = getISTTime(otpExpiry);
  console.log(Date.now());
  await User.update(
    { otp: String(otp), otp_expiry: formattedDate },
    { where: { id: user.id } }
  );
  console.log("otp", otp)
  console.log("formattedDate", normalisedEmail)
  // 6. Send mail
  const result = await sendMail({
    to: normalisedEmail,
    subject: 'Forget Password',
    html: forgotPasswordOtpTemplate(user.name, otp)
  });

  console.log("result", result)

  if (result.error) {
    // Roll back OTP so a stale code isn't sitting on the account
    await User.update(
      { otp: null, otp_expiry: null },
      { where: { id: user.id } }
    );
    const err = new Error('Failed to send OTP email');
    err.statusCode = 502;
    throw err;
  }

  return true;
};

/**
 * Verifies the OTP (with expiry check) then updates the password.
 *
 * All validation that requires DB state lives here; pure-input validation
 * (format checks, required fields) lives in the controller.
 */
const verifyOtpAndUpdatePassword = async (email, otp, newPassword) => {
  const normalisedEmail = email.trim().toLowerCase();

  // 1. IBSLead gate
  const ibsLead = await IBSLead.findOne({ where: { email: normalisedEmail } });
  if (!ibsLead) {
    const err = new Error('You are not authorised to perform this action');
    err.statusCode = 401;
    throw err;
  }

  // 2. Locate user
  const user = await User.findOne({ where: { email: normalisedEmail } });
  if (!user) {
    const err = new Error('User not found');
    err.statusCode = 404;
    throw err;
  }

  // 3. Ensure an OTP was actually issued
  if (!user.otp || !user.otp_expiry) {
    const err = new Error('No OTP has been requested for this account');
    err.statusCode = 400;
    throw err;
  }

  // 4. Expiry check — compare against current time
  // otp_expiry is now stored as IST formatted string, parse it for comparison
  const expiryUTC = parseISTTime(user.otp_expiry);
  const now = new Date();

  if (now > expiryUTC) {
    // Invalidate the expired OTP immediately
    await User.update(
      { otp: null, otp_expiry: null },
      { where: { id: user.id } }
    );
    const err = new Error('OTP has expired. Please request a new one');
    err.statusCode = 410; // 410 Gone — clearly communicates expiry
    throw err;
  }

  // 5. Constant-time OTP comparison (prevents timing attacks)
  if (!safeEqual(user.otp, String(otp))) {
    const err = new Error('Invalid OTP');
    err.statusCode = 400;
    throw err;
  }

  // 6. Reject if new password is the same as the current one
  const isSamePassword = await bcrypt.compare(newPassword, user.password_hash);
  if (isSamePassword) {
    const err = new Error('New password must be different from the current password');
    err.statusCode = 400;
    throw err;
  }

  // 7. Hash + persist new password; clear OTP in the same atomic update
  const password_hash = await bcrypt.hash(newPassword, BCRYPT_SALT_ROUNDS);
  await User.update(
    { password_hash, otp: null, otp_expiry: null },
    { where: { id: user.id } }
  );

  await sendMail({
    to: normalisedEmail,
    subject: 'Password Reset Successful',
    html: passwordResetSuccessTemplate(user.name)
  });

  return true;
};





module.exports = { register, login, refreshAccessToken, revokeRefreshToken, forgetPassword, verifyOtpAndUpdatePassword };
