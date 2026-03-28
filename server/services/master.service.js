const { IBSLead, Customer } = require('../models');


const getIBSLeads = () =>
  IBSLead.findAll({ order: [['name', 'ASC']] });

const createIBSLead = (name) =>
  IBSLead.create({ name: name.trim() });

const updateIBSLead = async (id, updates) => {
  const lead = await IBSLead.findByPk(id);
  if (!lead) return null;
  const patch = {};
  if (updates.name !== undefined) patch.name = updates.name.trim();
  if (updates.active !== undefined) patch.active = Boolean(updates.active);
  if (Object.keys(patch).length === 0) {
    const err = new Error('Nothing to update');
    err.statusCode = 400;
    throw err;
  }
  return lead.update(patch);
};

const deleteIBSLead = async (id) => {
  const rows = await IBSLead.destroy({ where: { id } });
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
  const rows = await Customer.destroy({ where: { id } });
  return rows > 0;
};

module.exports = {
  getIBSLeads, createIBSLead, updateIBSLead, deleteIBSLead,
  getCustomers, createCustomer, updateCustomer, deleteCustomer,
};
