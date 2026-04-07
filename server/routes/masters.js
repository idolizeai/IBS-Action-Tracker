const express = require('express');
const { getPool, sql } = require('../db/connection');
const { authMiddleware, adminOnly } = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware);

// ── IBS Leads ────────────────────────────────────────────────────────────────

// GET /api/masters/ibs-leads
router.get('/ibs-leads', async (req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.request()
      .query('SELECT id, name, active FROM masters_ibs_leads ORDER BY name ASC');
    res.json(result.recordset);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/masters/ibs-leads  (admin only)
router.post('/ibs-leads', adminOnly, async (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: 'name is required' });
  try {
    const pool = await getPool();
    const result = await pool.request()
      .input('name', sql.NVarChar, name.trim())
      .query('INSERT INTO masters_ibs_leads (name) OUTPUT INSERTED.* VALUES (@name)');
    res.status(201).json(result.recordset[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// PATCH /api/masters/ibs-leads/:id  (admin only)
router.patch('/ibs-leads/:id', adminOnly, async (req, res) => {
  const { name, active } = req.body;
  try {
    const pool = await getPool();
    const sets = [];
    const req2 = pool.request().input('id', sql.Int, Number(req.params.id));
    if (name !== undefined) { sets.push('name = @name'); req2.input('name', sql.NVarChar, name.trim()); }
    if (active !== undefined) { sets.push('active = @active'); req2.input('active', sql.Bit, active ? 1 : 0); }
    if (!sets.length) return res.status(400).json({ error: 'Nothing to update' });
    await req2.query(`UPDATE masters_ibs_leads SET ${sets.join(', ')} WHERE id = @id`);
    const updated = await pool.request().input('id', sql.Int, Number(req.params.id))
      .query('SELECT id, name, active FROM masters_ibs_leads WHERE id = @id');
    res.json(updated.recordset[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /api/masters/ibs-leads/:id  (admin only)
router.delete('/ibs-leads/:id', adminOnly, async (req, res) => {
  try {
    const pool = await getPool();
    await pool.request()
      .input('id', sql.Int, Number(req.params.id))
      .query('DELETE FROM masters_ibs_leads WHERE id = @id');
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ── Customers ─────────────────────────────────────────────────────────────────

// GET /api/masters/customers
router.get('/customers', async (req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.request()
      .query('SELECT id, name, is_internal, active FROM masters_customers ORDER BY is_internal DESC, name ASC');
    res.json(result.recordset);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/masters/customers  (admin only)
router.post('/customers', adminOnly, async (req, res) => {
  const { name, is_internal } = req.body;
  if (!name) return res.status(400).json({ error: 'name is required' });
  try {
    const pool = await getPool();
    const result = await pool.request()
      .input('name', sql.NVarChar, name.trim())
      .input('is_internal', sql.Bit, is_internal ? 1 : 0)
      .query('INSERT INTO masters_customers (name, is_internal) OUTPUT INSERTED.* VALUES (@name, @is_internal)');
    res.status(201).json(result.recordset[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// PATCH /api/masters/customers/:id  (admin only)
router.patch('/customers/:id', adminOnly, async (req, res) => {
  const { name, is_internal, active } = req.body;
  try {
    const pool = await getPool();
    const sets = [];
    const req2 = pool.request().input('id', sql.Int, Number(req.params.id));
    if (name !== undefined) { sets.push('name = @name'); req2.input('name', sql.NVarChar, name.trim()); }
    if (is_internal !== undefined) { sets.push('is_internal = @is_internal'); req2.input('is_internal', sql.Bit, is_internal ? 1 : 0); }
    if (active !== undefined) { sets.push('active = @active'); req2.input('active', sql.Bit, active ? 1 : 0); }
    if (!sets.length) return res.status(400).json({ error: 'Nothing to update' });
    await req2.query(`UPDATE masters_customers SET ${sets.join(', ')} WHERE id = @id`);
    const updated = await pool.request().input('id', sql.Int, Number(req.params.id))
      .query('SELECT id, name, is_internal, active FROM masters_customers WHERE id = @id');
    res.json(updated.recordset[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/customers/:id', adminOnly, async (req, res) => {
  try {
    const pool = await getPool();
    await pool.request()
      .input('id', sql.Int, Number(req.params.id))
      .query('DELETE FROM masters_customers WHERE id = @id');
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
