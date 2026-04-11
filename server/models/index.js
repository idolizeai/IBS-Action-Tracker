const sequelize = require('../config/database');
const User = require('./User');
const Task = require('./Task');
const IBSLead = require('./IBSLead');
const Customer = require('./Customer');
const TaskDraft = require('./TaskDraft');
const RefreshToken = require('./RefreshToken');

// Associations

User.hasMany(Task, { foreignKey: 'user_id', onDelete: 'CASCADE' });
Task.belongsTo(User, { foreignKey: 'user_id' });

User.hasOne(TaskDraft, { foreignKey: 'user_id', onDelete: 'CASCADE' });
TaskDraft.belongsTo(User, { foreignKey: 'user_id' });

Task.belongsTo(IBSLead, { foreignKey: 'ibs_lead_id', as: 'ibsLead' });
IBSLead.hasMany(Task, { foreignKey: 'ibs_lead_id' });

Task.belongsTo(Customer, { foreignKey: 'customer_id', as: 'customer' });
Customer.hasMany(Task, { foreignKey: 'customer_id' });

User.hasMany(RefreshToken, { foreignKey: 'user_id', onDelete: 'CASCADE' });
RefreshToken.belongsTo(User, { foreignKey: 'user_id' });

module.exports = { sequelize, User, Task, IBSLead, Customer, TaskDraft, RefreshToken };
