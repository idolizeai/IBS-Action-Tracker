const { DataTypes, Sequelize } = require('sequelize');
const sequelize = require('../config/database');

const IBSLead = sequelize.define(
  'IBSLead',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: Sequelize.literal('GETDATE()'),
    },
    updated_at: {
      type: DataTypes.DATE,
      defaultValue: Sequelize.literal('GETDATE()'),
    }
  },
  {
    tableName: 'masters_ibs_leads',
    timestamps: false,
  }
);

module.exports = IBSLead;
