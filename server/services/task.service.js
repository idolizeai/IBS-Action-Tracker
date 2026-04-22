const { Op, literal } = require('sequelize');
const { Task, IBSLead, Customer, User } = require('../models');
const crypto = require('crypto');

const TASK_INCLUDE = [
  { model: IBSLead, as: 'ibsLead', attributes: ['id', 'name'] },
  { model: Customer, as: 'customer', attributes: ['id', 'name', 'is_internal'] },
  { model: User, attributes: ['id', 'name'] },
];

const flattenTask = (task) => {
  const t = task.toJSON ? task.toJSON() : task;
  return {
    ...t,
    title: t.title ? decryptTitle(t.title) : t.title,
    ibs_lead_name: t.ibsLead?.name ?? null,
    customer_name: t.customer?.name ?? null,
    is_internal: t.customer?.is_internal ?? null,
    owner_name: t.User?.name ?? null,
    ibsLead: undefined,
    customer: undefined,
    User: undefined,
  };
};



const ALGORITHM = 'aes-256-cbc';
const KEY = Buffer.from((process.env.SECRET_KEY || '').padEnd(32).slice(0, 32));
const IV = KEY.slice(0, 16); // fixed 16-byte IV derived from key

const encryptTitle = (text) => {
  const cipher = crypto.createCipheriv(ALGORITHM, KEY, IV);
  return Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]).toString('base64');
};

const decryptTitle = (stored) => {
  const decipher = crypto.createDecipheriv(ALGORITHM, KEY, IV);
  return Buffer.concat([decipher.update(Buffer.from(stored, 'base64')), decipher.final()]).toString('utf8');
};
const getTasksForUser = async (user, filters = {}) => {
  const {
    priority,
    function_type,
    ibs_lead_id,
    customer_id,
    financial_impact,
    comm_mode,
    done,
    is_draft,
    assignment,
    is_delayed
  } = filters;

  let accessWhere = {};
  let filterWhere = {};


  let assignedByUserId = null;

  if (assignment === 'to_me' && ibs_lead_id) {
    const assignedByUser = await User.findOne({
      where: { ibs_lead_id: Number(ibs_lead_id) },
      attributes: ['id']
    });
    if (!assignedByUser) return [];
    assignedByUserId = assignedByUser.id;
  }
  // -------------------------
  // ACCESS CONTROL (STRICT)
  // -------------------------
  if (is_draft === 'true') {
    accessWhere = {
      user_id: user.id,
      is_draft: true
    };
  } else {
    if (assignment === 'by_me') {
      accessWhere = {
        user_id: user.id,
        is_draft: false
      };
    }
    else if (assignment === 'to_me') {
      if (!user.ibs_lead_id) return [];

      accessWhere = {
        ibs_lead_id: user.ibs_lead_id,
        user_id: { [Op.ne]: user.id },
        is_draft: false
      };

      if (assignedByUserId) {
        accessWhere.user_id = assignedByUserId;
      }

    }
    else {
      const conditions = [{ user_id: user.id }];

      if (user.ibs_lead_id) {
        conditions.push({ ibs_lead_id: user.ibs_lead_id });
      }

      accessWhere = {
        [Op.or]: conditions,
        is_draft: false
      };
    }
  }

  // -------------------------
  // FILTERS (SAFE)
  // -------------------------
  if (priority !== undefined && priority !== '') {
    filterWhere.priority = Number(priority);
  }

  if (function_type) {
    filterWhere.function_type = function_type;
  }

  if (customer_id) {
    filterWhere.customer_id = Number(customer_id);
  }

  if (financial_impact) {
    filterWhere.financial_impact = financial_impact;
  }

  if (comm_mode) {
    filterWhere.comm_mode = comm_mode;
  }

  // 🚫 CRITICAL FIX: prevent override in "to_me"
  if (assignment !== 'to_me' && ibs_lead_id) {
    filterWhere.ibs_lead_id = Number(ibs_lead_id);
  }

  // Delayed logic
  if (is_delayed === 'true' || is_delayed === true || is_delayed === 1) {
    filterWhere.is_delayed = true;
    filterWhere[Op.and] = [
      {
        [Op.or]: [
          { priority: 0 },
          { priority: 1 }
        ]
      }
    ];
  }

  // Done flag (keep same behavior)
  filterWhere.done = (done === 'true');

  // -------------------------
  // FINAL WHERE
  // -------------------------
  const where = {
    ...accessWhere,
    ...filterWhere
  };

  const tasks = await Task.findAll({
    where,
    include: TASK_INCLUDE,
    order: [
      ['priority', 'ASC'],
      ['created_at', 'DESC'],
    ],
  });

  // -------------------------
  // RESPONSE MAPPING (UNCHANGED)
  // -------------------------
  return tasks.map((task) => {
    const flattened = flattenTask(task);
    const missing = [];

    if (task.is_draft) {
      if (flattened.priority === null || flattened.priority === undefined) {
        missing.push('Priority');
      }
      if (!flattened.function_type) {
        missing.push('Function Type');
      }
      if (!flattened.ibs_lead_id) {
        missing.push('IBS Lead');
      }
      if (!flattened.customer_id) {
        missing.push('Customer');
      }
      if (!flattened.financial_impact) {
        missing.push('Financial Impact');
      }
      if (!flattened.comm_mode) {
        missing.push('Communication Mode');
      }
    }

    return { ...flattened, missing };
  });
};
const createTask = async (userId, data) => {
  const { title, priority, function_type, ibs_lead_id, customer_id, financial_impact, comm_mode, is_draft } = data;
  const task = await Task.create({
    user_id: userId,
    title: encryptTitle(title.trim()),
    priority: priority != null ? Number(priority) : null,
    function_type: function_type || null,
    ibs_lead_id: ibs_lead_id ? Number(ibs_lead_id) : null,
    customer_id: customer_id ? Number(customer_id) : null,
    financial_impact: financial_impact || null,
    comm_mode: comm_mode || null,
    is_draft: Boolean(is_draft),
  });

  await task.reload({ include: TASK_INCLUDE });
  return flattenTask(task);
};

const updateTask = async (taskId, user, updates) => {
  const task = await Task.findByPk(taskId);
  if (!task) return null;

  // ── Non-owner path ──────────────────────────────────────────────────────────
  if (task.user_id !== user.id) {
    // Fetch the full user record to check role
    const dbUser = await User.findByPk(user.id);
    if (!dbUser) {
      const err = new Error('User not found');
      err.statusCode = 404;
      throw err;
    }

    // ── ADMIN: may ONLY update `priority` ────────────────────────────────────
    if (dbUser.role === 'admin' && task.ibs_lead_id === user.ibs_lead_id) {
      console.log('admin', task.ibs_lead_id, user.ibs_lead_id, dbUser.role);
      // Check that the request contains ONLY the `priority` field
      const requestedKeys = Object.keys(updates);
      const hasOnlyPriority =
        requestedKeys.length === 1 && requestedKeys[0] === 'priority';
      const hasDelay = requestedKeys.length === 1 && requestedKeys[0] === 'is_delayed';

      if (!hasOnlyPriority && !hasDelay) {
        const err = new Error(
          'As an admin assigned to this task you can only update the priority field and delay status'
        );
        err.statusCode = 403;
        throw err;
      }

      // Validate priority value
      const priorityVal = updates.priority;
      const isDelayVal = updates.is_delayed;
      if (
        hasOnlyPriority &&
        (priorityVal === undefined ||
          priorityVal === null ||
          !Number.isFinite(Number(priorityVal)))
      ) {
        const err = new Error('priority must be a valid number');
        err.statusCode = 400;
        throw err;
      }
      if (
        hasDelay &&
        (isDelayVal === undefined ||
          isDelayVal === null ||
          typeof isDelayVal !== 'boolean')
      ) {
        const err = new Error('is_delayed must be a valid boolean');
        err.statusCode = 400;
        throw err;
      }
      if (hasOnlyPriority) {
        await task.update({
          priority: Number(priorityVal),
          updated_at: literal('GETDATE()'),
        });
      }
      if (hasDelay) {
        await task.update({
          is_delayed: Boolean(isDelayVal),
          updated_at: literal('GETDATE()'),
        });
      }
      await task.reload({ include: TASK_INCLUDE });
      return flattenTask(task);
    }

    // ── COLLABORATOR: blocked entirely ────────────────────────────────────────
    if (user.ibs_lead_id && task.ibs_lead_id === user.ibs_lead_id) {
      const err = new Error('A collaborator cannot update the task');
      err.statusCode = 403;
      throw err;
    }

    // Task doesn't belong to this user and they are not an admin or collaborator
    return null;
  }

  // ── Owner path ──────────────────────────────────────────────────────────────
  const allowed = [
    'title', 'priority', 'function_type', 'ibs_lead_id', 'customer_id',
    'financial_impact', 'comm_mode', 'done', 'is_draft', 'is_delayed',
  ];
  const patch = {};

  for (const field of allowed) {
    if (updates[field] === undefined) continue;

    if (field === 'title') {
      patch.title = encryptTitle(updates.title.trim());
    } else if (field === 'priority') {
      patch.priority = updates.priority != null ? Number(updates.priority) : null;
    } else if (field === 'ibs_lead_id') {
      patch.ibs_lead_id = updates.ibs_lead_id ? Number(updates.ibs_lead_id) : null;
    } else if (field === 'customer_id') {
      patch.customer_id = updates.customer_id ? Number(updates.customer_id) : null;
    } else if (field === 'function_type') {
      patch.function_type = updates.function_type || null;
    } else if (field === 'financial_impact') {
      patch.financial_impact = updates.financial_impact || null;
    } else if (field === 'comm_mode') {
      patch.comm_mode = updates.comm_mode || null;
    } else if (field === 'is_draft') {
      patch.is_draft = Boolean(updates.is_draft);
    } else if (field === 'done') {
      patch.done = Boolean(updates.done);
      patch.done_at = updates.done ? literal('GETDATE()') : null;
    } else if (field === 'is_delayed') {
      if (task.is_delayed === true || task.is_delayed === 1) {
        const err = new Error('A task is already delayed');
        err.statusCode = 400;
        throw err;
      }
      patch.is_delayed = true;
    } else {
      patch[field] = updates[field];
    }
  }

  if (Object.keys(patch).length === 0) {
    const err = new Error('Nothing to update');
    err.statusCode = 400;
    throw err;
  }

  patch.updated_at = literal('GETDATE()');
  await task.update(patch);
  await task.reload({ include: TASK_INCLUDE });
  return flattenTask(task);
};

const deleteTask = async (taskId, user) => {
  const task = await Task.findByPk(taskId);
  if (!task) return false;

  if (task.user_id !== user.id) {
    if (user.ibs_lead_id && task.ibs_lead_id === user.ibs_lead_id) {
      const err = new Error('a colloborator cannot update the task');
      err.statusCode = 403;
      throw err;
    }
    return false;
  }

  await task.destroy();
  return true;
};

module.exports = { getTasksForUser, createTask, updateTask, deleteTask };
