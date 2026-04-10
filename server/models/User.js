const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const { ROLES } = require('../config/constants');

const User = sequelize.define(
  'User',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    ibs_lead_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    password_hash: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    otp: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        is: /^[0-9]{6}$/ // exactly 6 digits
      }
    },
    role: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'user',
      validate: { isIn: [ROLES] },
    },
  },
  {
    tableName: 'users',
    timestamps: false,
  }
);

// Never expose password_hash in JSON responses
const originalToJSON = User.prototype.toJSON;
User.prototype.toJSON = function () {
  const values = originalToJSON.call(this);
  delete values.password_hash;
  return values;
};

module.exports = User;
