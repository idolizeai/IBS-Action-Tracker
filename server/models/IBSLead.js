const { DataTypes } = require('sequelize');
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
  },
  {
    tableName: 'masters_ibs_leads',
    timestamps: false,
  }
);

module.exports = IBSLead;
