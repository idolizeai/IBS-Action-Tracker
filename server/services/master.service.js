const { Op } = require('sequelize');
const { IBSLead, Customer } = require('../models');


const getIBSLeads = () =>
  IBSLead.findAll({ order: [['name', 'ASC']] });

const createIBSLead = async (name, email) => {
  const existing = await IBSLead.findOne({ where: { email: email.toLowerCase() } });
  if (existing) {
    const err = new Error('This Email already assigned to another IBS Lead');
    err.statusCode = 409;
    throw err;
  }
  return IBSLead.create({ name: name.trim(), email: email.trim() });
}

const updateIBSLead = async (id, updates) => {
  const lead = await IBSLead.findByPk(id);
  if (!lead) return null;
  const patch = {};
  if (updates.name !== undefined) patch.name = updates.name.trim();
  if (updates.email !== undefined) patch.email = updates.email.trim();
  if (updates.active !== undefined) patch.active = Boolean(updates.active);
  if (Object.keys(patch).length === 0) {
    const err = new Error('Nothing to update');
    err.statusCode = 400;
    throw err;
  }
  if (patch.email) {
    const existing = await IBSLead.findOne({
      where: {
        email: patch.email.toLowerCase(),
        id: { [Op.ne]: id }
      }
    });
    if (existing) {
      const err = new Error('This Email already assigned to another IBS Lead');
      err.statusCode = 409;
      throw err;
    }
  }
  return lead.update(patch);
};

const deleteIBSLead = async (id) => {
  const rows = await IBSLead.update({ active: false }, { where: { id } });
  return rows > 0;
};


const getCustomers = () =>
  Customer.findAll({ order: [['is_internal', 'DESC'], ['name', 'ASC']] });

const createCustomer = (name, is_internal) =>
  Customer.create({ name: name.trim(), is_internal: Boolean(is_internal) });

const updateCustomer = async (id, updates) => {
  const customer = await Customer.findByPk(id);
  if (!customer) return null;
  const patch = {};
  if (updates.name !== undefined) patch.name = updates.name.trim();
  if (updates.is_internal !== undefined) patch.is_internal = Boolean(updates.is_internal);
  if (updates.active !== undefined) patch.active = Boolean(updates.active);
  if (Object.keys(patch).length === 0) {
    const err = new Error('Nothing to update');
    err.statusCode = 400;
    throw err;
  }
  return customer.update(patch);
};

const deleteCustomer = async (id) => {
  const rows = await Customer.update({ where: { id } });
  return rows > 0;
};

module.exports = {
  getIBSLeads, createIBSLead, updateIBSLead, deleteIBSLead,
  getCustomers, createCustomer, updateCustomer, deleteCustomer,
};
