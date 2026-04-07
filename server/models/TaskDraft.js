const { DataTypes, Sequelize } = require('sequelize');
const sequelize = require('../config/database');

const TaskDraft = sequelize.define(
  'TaskDraft',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      unique: true, // one draft per user
    },
    data: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    updated_at: {
      type: DataTypes.DATE,
      defaultValue: Sequelize.literal('GETDATE()'),
    },
  },
  {
    tableName: 'task_drafts',
    timestamps: false,
  }
);

module.exports = TaskDraft;
