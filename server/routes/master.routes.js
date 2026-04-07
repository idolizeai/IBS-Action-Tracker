const { Router } = require('express');
const MasterController = require('../controllers/master.controller');
const { authMiddleware, adminOnly } = require('../middleware/auth.middleware');

const router = Router();

router.use(authMiddleware);

// IBS Leads
router.get('/ibs-leads',       MasterController.getIBSLeads);
router.post('/ibs-leads',      adminOnly, MasterController.createIBSLead);
router.patch('/ibs-leads/:id', adminOnly, MasterController.updateIBSLead);
router.delete('/ibs-leads/:id', adminOnly, MasterController.deleteIBSLead);

// Customers
router.get('/customers',        MasterController.getCustomers);
router.post('/customers',       adminOnly, MasterController.createCustomer);
router.patch('/customers/:id',  adminOnly, MasterController.updateCustomer);
router.delete('/customers/:id', adminOnly, MasterController.deleteCustomer);

module.exports = router;
