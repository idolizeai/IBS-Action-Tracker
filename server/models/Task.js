const { DataTypes, Sequelize } = require('sequelize');
const sequelize = require('../config/database');
const { FINANCIAL_IMPACT, COMM_MODES, FUNCTION_TYPES } = require('../config/constants');

const Task = sequelize.define(
  'Task',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    priority: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: { min: 0, max: 4 },
    },
    function_type: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: { isIn: [FUNCTION_TYPES] },
    },
    ibs_lead_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    customer_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    financial_impact: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: { isIn: [FINANCIAL_IMPACT] },
    },
    comm_mode: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: { isIn: [COMM_MODES] },
    },
    done: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    done_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    // Sequelize.literal('GETDATE()') inlines raw SQL — avoids the tedious driver
    // serializing JS Date as '2026-03-28 +00:00' which MSSQL DATETIME rejects.
    created_at: {
      type: DataTypes.DATE,
      defaultValue: Sequelize.literal('GETDATE()'),
    },
    updated_at: {
      type: DataTypes.DATE,
      defaultValue: Sequelize.literal('GETDATE()'),
    },
  },
  {
    tableName: 'tasks',
    timestamps: false, // we manage created_at / updated_at manually via GETDATE() literals
  }
);

module.exports = Task;
