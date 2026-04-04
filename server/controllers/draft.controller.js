const DraftService = require('../services/draft.service');
const { success, error } = require('../utils/response');

const get = async (req, res, next) => {
  try {
    const draft = await DraftService.getDraft(req.user.id);
    success(res, draft); // null if no draft
  } catch (err) {
    next(err);
  }
};

const save = async (req, res, next) => {
  try {
    if (!req.body || typeof req.body !== 'object') return error(res, 'Invalid draft data', 400);
    await DraftService.saveDraft(req.user.id, req.body);
    success(res, { saved: true });
  } catch (err) {
    next(err);
  }
};

const clear = async (req, res, next) => {
  try {
    await DraftService.clearDraft(req.user.id);
    success(res, { cleared: true });
  } catch (err) {
    next(err);
  }
};

module.exports = { get, save, clear };
