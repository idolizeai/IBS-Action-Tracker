// THIS FILE IS DEPRECATED — use auth.routes.js instead
// Kept for backwards compatibility but role parameter is now IGNORED

const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getPool, sql } = require('../db/connection');

const router = express.Router();

function makeToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, name: user.name, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
}

// DEPRECATED: This route accepts a 'role' parameter from the body,
// but we now FORCE role to 'user' regardless of what the client sends.
router.post('/register', async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'name, email and password are required' });
  }
  try {
    const pool = await getPool();
    const exists = await pool.request()
      .input('email', sql.NVarChar, email.toLowerCase())
      .query('SELECT id FROM users WHERE email = @email');
    if (exists.recordset.length > 0) {
      return res.status(409).json({ error: 'Email already registered' });
    }
    const hash = await bcrypt.hash(password, 10);
    // SECURITY: ALWAYS set role to 'user' — NEVER trust client-supplied role
    const userRole = 'user';
    const result = await pool.request()
      .input('name', sql.NVarChar, name)
      .input('email', sql.NVarChar, email.toLowerCase())
      .input('password_hash', sql.NVarChar, hash)
      .input('role', sql.NVarChar, userRole)
      .query(`
        INSERT INTO users (name, email, password_hash, role)
        OUTPUT INSERTED.id, INSERTED.name, INSERTED.email, INSERTED.role
        VALUES (@name, @email, @password_hash, @role)
      `);
    const user = result.recordset[0];
    res.status(201).json({ token: makeToken(user), user: { id: user.id, name: user.name, email: user.email, role: user.role } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'email and password are required' });
  }
  try {
    const pool = await getPool();
    const result = await pool.request()
      .input('email', sql.NVarChar, email.toLowerCase())
      .query('SELECT id, name, email, password_hash, role FROM users WHERE email = @email');
    const user = result.recordset[0];
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });
    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) return res.status(401).json({ error: 'Invalid credentials' });
    res.json({ token: makeToken(user), user: { id: user.id, name: user.name, email: user.email, role: user.role } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/me', require('../middleware/auth').authMiddleware, async (req, res) => {
  res.json({ user: req.user });
});

module.exports = router;
