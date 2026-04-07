const TaskService = require('../services/task.service');
const { success, created, error, notFound } = require('../utils/response');
const { PRIORITIES, FINANCIAL_IMPACT, COMM_MODES, FUNCTION_TYPES } = require('../config/constants');

const validateTaskBody = (body) => {
  const { title, priority, function_type, ibs_lead_id, customer_id, financial_impact, comm_mode, is_draft } = body;
  if (!title || title.trim().length === 0) return 'title is required';

  if (is_draft) {
    return null; // skip validation for drafts
  }

  if (!PRIORITIES.includes(Number(priority))) return 'invalid priority';
  if (!FUNCTION_TYPES.includes(function_type)) return 'invalid function_type';
  if (!ibs_lead_id) return 'ibs_lead_id is required';
  if (!customer_id) return 'customer_id is required';
  if (!FINANCIAL_IMPACT.includes(financial_impact)) return 'invalid financial_impact';
  if (!COMM_MODES.includes(comm_mode)) return 'invalid comm_mode'; 

  return null;
};

const list = async (req, res, next) => {
  try {
    const tasks = await TaskService.getTasksForUser(req.user, req.query);
    success(res, tasks);
  } catch (err) {
    next(err);
  }
};

const create = async (req, res, next) => {
  try {
    const validationError = validateTaskBody(req.body);
    if (validationError) return error(res, validationError);

    const task = await TaskService.createTask(req.user.id, req.body);
    created(res, task);
  } catch (err) {
    next(err);
  }
};

const update = async (req, res, next) => {
  try {
    const task = await TaskService.updateTask(Number(req.params.id), req.user, req.body);
    if (!task) return notFound(res, 'Task not found');
    success(res, task);
  } catch (err) {
    if (err.statusCode) return error(res, err.message, err.statusCode);
    next(err);
  }
};

const remove = async (req, res, next) => {
  try {
    const deleted = await TaskService.deleteTask(Number(req.params.id), req.user);
    if (!deleted) return notFound(res, 'Task not found');
    success(res, { deleted: true });
  } catch (err) {
    if (err.statusCode) return error(res, err.message, err.statusCode);
    next(err);
  }
};

module.exports = { list, create, update, remove };
