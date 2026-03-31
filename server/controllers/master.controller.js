const MasterService = require('../services/master.service');
const { success, created, error, notFound } = require('../utils/response');

// ── IBS Leads ──────────────────────────────────────────────────────────────────

const getIBSLeads = async (req, res, next) => {
  try {
    const leads = await MasterService.getIBSLeads();
    success(res, leads);
  } catch (err) {
    next(err);
  }
};

const createIBSLead = async (req, res, next) => {
  try {
    const { name } = req.body;
    if (!name) return error(res, 'name is required');
    const lead = await MasterService.createIBSLead(name);
    created(res, lead);
  } catch (err) {
    next(err);
  }
};

const updateIBSLead = async (req, res, next) => {
  try {
    const lead = await MasterService.updateIBSLead(Number(req.params.id), req.body);
    if (!lead) return notFound(res, 'IBS Lead not found');
    success(res, lead);
  } catch (err) {
    if (err.statusCode) return error(res, err.message, err.statusCode);
    next(err);
  }
};

const deleteIBSLead = async (req, res, next) => {
  try {
    const deleted = await MasterService.deleteIBSLead(Number(req.params.id));
    if (!deleted) return notFound(res, 'IBS Lead not found');
    success(res, { deleted: true });
  } catch (err) {
    next(err);
  }
};

// ── Customers ──────────────────────────────────────────────────────────────────

const getCustomers = async (req, res, next) => {
  try {
    const customers = await MasterService.getCustomers();
    success(res, customers);
  } catch (err) {
    next(err);
  }
};

const createCustomer = async (req, res, next) => {
  try {
    const { name, is_internal } = req.body;
    if (!name) return error(res, 'name is required');
    const customer = await MasterService.createCustomer(name, is_internal);
    created(res, customer);
  } catch (err) {
    next(err);
  }
};

const updateCustomer = async (req, res, next) => {
  try {
    const customer = await MasterService.updateCustomer(Number(req.params.id), req.body);
    if (!customer) return notFound(res, 'Customer not found');
    success(res, customer);
  } catch (err) {
    if (err.statusCode) return error(res, err.message, err.statusCode);
    next(err);
  }
};

const deleteCustomer = async (req, res, next) => {
  try {
    const deleted = await MasterService.deleteCustomer(Number(req.params.id));
    if (!deleted) return notFound(res, 'Customer not found');
    success(res, { deleted: true });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getIBSLeads, createIBSLead, updateIBSLead, deleteIBSLead,
  getCustomers, createCustomer, updateCustomer, deleteCustomer,
};
