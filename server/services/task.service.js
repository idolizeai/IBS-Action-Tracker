const { Op, literal } = require('sequelize');
const { Task, IBSLead, Customer } = require('../models');

const TASK_INCLUDE = [
  { model: IBSLead, as: 'ibsLead', attributes: ['id', 'name'] },
  { model: Customer, as: 'customer', attributes: ['id', 'name', 'is_internal'] },
];

const flattenTask = (task) => {
  const t = task.toJSON ? task.toJSON() : task;
  return {
    ...t,
    ibs_lead_name: t.ibsLead?.name ?? null,
    customer_name: t.customer?.name ?? null,
    is_internal:   t.customer?.is_internal ?? null,
    ibsLead:       undefined,
    customer:      undefined,
  };
};

const getTasksForUser = async (userId, filters = {}) => {
  const { priority, function_type, ibs_lead_id, customer_id, financial_impact, done, is_draft } = filters;

  const where = { user_id: userId };

  if (priority !== undefined && priority !== '') where.priority = Number(priority);
  if (function_type) where.function_type = function_type;
  if (ibs_lead_id) where.ibs_lead_id = Number(ibs_lead_id);
  if (customer_id) where.customer_id = Number(customer_id);
  
  if (financial_impact) where.financial_impact = financial_impact;
  where.done = done === 'true' ? true : false;
is_draft === 'true' ? where.is_draft = true : where.is_draft = false;

  const tasks = await Task.findAll({
    where,
    include: TASK_INCLUDE,
    order: [
      ['priority', 'ASC'],
      ['created_at', 'DESC'],
    ],
  });

  return tasks.map((task) => {
    const flattened = flattenTask(task);
    const missing = [];
if (task.is_draft) {
  
  // Check for missing fields
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
console.log('Creating task with data:', data);
  const task = await Task.create({
    user_id: userId,
    title: title.trim(),
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

const updateTask = async (taskId, userId, updates) => {
  const task = await Task.findOne({ where: { id: taskId, user_id: userId } });
  if (!task) return null;

  const allowed = ['title', 'priority', 'function_type', 'ibs_lead_id', 'customer_id', 'financial_impact', 'comm_mode', 'done', 'is_draft'];
  const patch = {};

  for (const field of allowed) {
    if (updates[field] === undefined) continue;

    if (field === 'title') patch.title = updates.title.trim();
    else if (field === 'priority') patch.priority = updates.priority != null ? Number(updates.priority) : null;
    else if (field === 'ibs_lead_id') patch.ibs_lead_id = updates.ibs_lead_id ? Number(updates.ibs_lead_id) : null;
    else if (field === 'customer_id') patch.customer_id = updates.customer_id ? Number(updates.customer_id) : null;
    else if (field === 'function_type') patch.function_type = updates.function_type || null;
    else if (field === 'financial_impact') patch.financial_impact = updates.financial_impact || null;
    else if (field === 'comm_mode') patch.comm_mode = updates.comm_mode || null;
    else if (field === 'is_draft') patch.is_draft = Boolean(updates.is_draft);
    else if (field === 'done') {
      patch.done = Boolean(updates.done);
      patch.done_at = updates.done ? literal('GETDATE()') : null;
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

const deleteTask = async (taskId, userId) => {
  const rows = await Task.destroy({ where: { id: taskId, user_id: userId } });
  return rows > 0;
};

module.exports = { getTasksForUser, createTask, updateTask, deleteTask };
