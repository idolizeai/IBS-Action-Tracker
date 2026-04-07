const { Sequelize } = require('sequelize');
const { TaskDraft } = require('../models');

const getDraft = async (userId) => {
  const row = await TaskDraft.findOne({ where: { user_id: userId } });
  if (!row) return null;
  try { return JSON.parse(row.data); } catch { return null; }
};

const saveDraft = async (userId, formData) => {
  const data = JSON.stringify(formData);
  const existing = await TaskDraft.findOne({ where: { user_id: userId } });
  if (existing) {
    await existing.update({ data, updated_at: Sequelize.literal('GETDATE()') });
  } else {
    await TaskDraft.create({ user_id: userId, data });
  }
  return true;
};

const clearDraft = async (userId) => {
  await TaskDraft.destroy({ where: { user_id: userId } });
  return true;
};

module.exports = { getDraft, saveDraft, clearDraft };
