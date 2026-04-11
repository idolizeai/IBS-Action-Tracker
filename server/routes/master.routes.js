const { Router } = require('express');
const MasterController = require('../controllers/master.controller');
const { authMiddleware, adminOnlyDb } = require('../middleware/auth.middleware');

const router = Router();

router.use(authMiddleware);

// IBS Leads
router.get('/ibs-leads',       MasterController.getIBSLeads);
router.post('/ibs-leads',      adminOnlyDb, MasterController.createIBSLead);
router.patch('/ibs-leads/:id', adminOnlyDb, MasterController.updateIBSLead);
router.delete('/ibs-leads/:id', adminOnlyDb, MasterController.deleteIBSLead);

// Customers
router.get('/customers',        MasterController.getCustomers);
router.post('/customers',       adminOnlyDb, MasterController.createCustomer);
router.patch('/customers/:id',  adminOnlyDb, MasterController.updateCustomer);
router.delete('/customers/:id', adminOnlyDb, MasterController.deleteCustomer);

module.exports = router;
