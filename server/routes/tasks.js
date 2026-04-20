const express = require('express');
const { getPool, sql } = require('../db/connection');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware);

const VALID_PRIORITIES = [0, 1, 2, 3, 4];
const VALID_FINANCIAL = ['very_high', 'high', 'moderate', 'low', 'none'];
const VALID_COMM = ['email', 'in_person', 'online', 'chat', 'phone', 'none'];
const VALID_FUNCTIONS = ['HR','BAU','Solutions','Planning','Proposal','Admin','Finance','Sales','Marketing','Training','Offerings','Misc'];


function validate(body) {
  const { title, priority, function_type, ibs_lead_id, customer_id, financial_impact, comm_mode } = body;
  if (!title || title.trim().length === 0) return 'title is required';
  if (!VALID_PRIORITIES.includes(Number(priority))) return 'invalid priority';
  if (!VALID_FUNCTIONS.includes(function_type)) return 'invalid function_type';
  if (!ibs_lead_id) return 'ibs_lead_id is required';
  if (!customer_id) return 'customer_id is required';
  if (!VALID_FINANCIAL.includes(financial_impact)) return 'invalid financial_impact';
  if (!VALID_COMM.includes(comm_mode)) return 'invalid comm_mode';
  return null;
}

router.get('/', async (req, res) => {
  try {
    const pool = await getPool();

    const { priority, function_type, ibs_lead_id, customer_id, financial_impact, comm_mode, done } = req.query;

    let query = `
      SELECT t.id, t.title, t.priority, t.function_type,
             t.ibs_lead_id, il.name AS ibs_lead_name,
             t.customer_id, c.name AS customer_name, c.is_internal,
             t.financial_impact, t.comm_mode,
             t.done, t.done_at, t.created_at, t.updated_at
      FROM tasks t
      JOIN masters_ibs_leads il ON il.id = t.ibs_lead_id
      JOIN masters_customers  c  ON c.id  = t.customer_id
      WHERE t.user_id = @userId
    `;
    const req2 = pool.request().input('userId', sql.Int, req.user.id);

    if (priority !== undefined && priority !== '') {
      query += ' AND t.priority = @priority';
      req2.input('priority', sql.TinyInt, Number(priority));
    }
    if (function_type) {
      query += ' AND t.function_type = @function_type';
      req2.input('function_type', sql.NVarChar, function_type);
    }
    if (ibs_lead_id) {
      query += ' AND t.ibs_lead_id = @ibs_lead_id';
      req2.input('ibs_lead_id', sql.Int, Number(ibs_lead_id));
    }
    if (customer_id) {
      query += ' AND t.customer_id = @customer_id';
      req2.input('customer_id', sql.Int, Number(customer_id));
    }
    if (financial_impact) {
      query += ' AND t.financial_impact = @financial_impact';
      req2.input('financial_impact', sql.NVarChar, financial_impact);
    }
    if (comm_mode) {
      query += ' AND t.comm_mode = @comm_mode';
      req2.input('comm_mode', sql.NVarChar, comm_mode);
    }
    if (done === 'true') {
      query += ' AND t.done = 1';
    } else {
      query += ' AND t.done = 0';
    }

    query += ' ORDER BY t.priority ASC, t.created_at DESC';

    const result = await req2.query(query);
    res.json(result.recordset);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/', async (req, res) => {
  const error = validate(req.body);
  if (error) return res.status(400).json({ error });

  const { title, priority, function_type, ibs_lead_id, customer_id, financial_impact, comm_mode } = req.body;
  try {
    const pool = await getPool();
    const result = await pool.request()
      .input('user_id', sql.Int, req.user.id)
      .input('title', sql.NVarChar, title.trim())
      .input('priority', sql.TinyInt, Number(priority))
      .input('function_type', sql.NVarChar, function_type)
      .input('ibs_lead_id', sql.Int, Number(ibs_lead_id))
      .input('customer_id', sql.Int, Number(customer_id))
      .input('financial_impact', sql.NVarChar, financial_impact)
      .input('comm_mode', sql.NVarChar, comm_mode)
      .query(`
        INSERT INTO tasks (user_id, title, priority, function_type, ibs_lead_id, customer_id, financial_impact, comm_mode)
        OUTPUT INSERTED.*
        VALUES (@user_id, @title, @priority, @function_type, @ibs_lead_id, @customer_id, @financial_impact, @comm_mode)
      `);
    res.status(201).json(result.recordset[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.patch('/:id', async (req, res) => {
  const taskId = Number(req.params.id);
  try {
    const pool = await getPool();
    // verify ownership
    const own = await pool.request()
      .input('id', sql.Int, taskId)
      .input('userId', sql.Int, req.user.id)
      .query('SELECT id FROM tasks WHERE id = @id AND user_id = @userId');
    if (!own.recordset.length) return res.status(404).json({ error: 'Task not found' });

    const sets = [];
    const req2 = pool.request()
      .input('id', sql.Int, taskId)
      .input('userId', sql.Int, req.user.id);

    if (req.body.title !== undefined)            { sets.push('title = @title');                       req2.input('title', sql.NVarChar, req.body.title.trim()); }
    if (req.body.priority !== undefined)         { sets.push('priority = @priority');                 req2.input('priority', sql.TinyInt, Number(req.body.priority)); }
    if (req.body.function_type !== undefined)    { sets.push('function_type = @function_type');       req2.input('function_type', sql.NVarChar, req.body.function_type); }
    if (req.body.ibs_lead_id !== undefined)      { sets.push('ibs_lead_id = @ibs_lead_id');           req2.input('ibs_lead_id', sql.Int, Number(req.body.ibs_lead_id)); }
    if (req.body.customer_id !== undefined)      { sets.push('customer_id = @customer_id');           req2.input('customer_id', sql.Int, Number(req.body.customer_id)); }
    if (req.body.financial_impact !== undefined) { sets.push('financial_impact = @financial_impact'); req2.input('financial_impact', sql.NVarChar, req.body.financial_impact); }
    if (req.body.comm_mode !== undefined)        { sets.push('comm_mode = @comm_mode');               req2.input('comm_mode', sql.NVarChar, req.body.comm_mode); }
    if (req.body.done !== undefined) {
      sets.push('done = @done');
      req2.input('done', sql.Bit, req.body.done ? 1 : 0);
      if (req.body.done) {
        sets.push('done_at = GETDATE()');
      } else {
        sets.push('done_at = NULL');
      }
    }

    if (!sets.length) return res.status(400).json({ error: 'Nothing to update' });
    sets.push('updated_at = GETDATE()');

    await req2.query(`UPDATE tasks SET ${sets.join(', ')} WHERE id = @id AND user_id = @userId`);

    // return updated row with joins
    const updated = await pool.request()
      .input('id', sql.Int, taskId)
      .query(`
        SELECT t.id, t.title, t.priority, t.function_type,
               t.ibs_lead_id, il.name AS ibs_lead_name,
               t.customer_id, c.name AS customer_name, c.is_internal,
               t.financial_impact, t.comm_mode,
               t.done, t.done_at, t.created_at, t.updated_at
        FROM tasks t
        JOIN masters_ibs_leads il ON il.id = t.ibs_lead_id
        JOIN masters_customers  c  ON c.id  = t.customer_id
        WHERE t.id = @id
      `);
    res.json(updated.recordset[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/:id', async (req, res) => {
  const taskId = Number(req.params.id);
  try {
    const pool = await getPool();
    const result = await pool.request()
      .input('id', sql.Int, taskId)
      .input('userId', sql.Int, req.user.id)
      .query('DELETE FROM tasks WHERE id = @id AND user_id = @userId');
    if (result.rowsAffected[0] === 0) return res.status(404).json({ error: 'Task not found' });
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;