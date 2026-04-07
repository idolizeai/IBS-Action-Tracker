const { Router } = require('express');

const router = Router();

router.use('/auth',    require('./auth.routes'));
router.use('/tasks',   require('./task.routes'));
router.use('/masters', require('./master.routes'));
router.use('/draft',   require('./draft.routes'));

module.exports = router;
