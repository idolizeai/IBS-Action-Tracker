const { DataTypes, Sequelize } = require('sequelize');
const sequelize = require('../config/database');

const RefreshToken = sequelize.define(
  'RefreshToken',
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    user_id: { type: DataTypes.INTEGER, allowNull: false },
    token_hash: { type: DataTypes.STRING(255), allowNull: false, unique: true },
    expires_at: { type: DataTypes.DATE, allowNull: false },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: Sequelize.literal('GETDATE()'),
    },
  },
  {
    tableName: 'refresh_tokens',
    timestamps: false,
  }
);

module.exports = RefreshToken;
