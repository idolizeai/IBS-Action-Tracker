const { Router } = require('express');
const DraftController = require('../controllers/draft.controller');
const { authMiddleware } = require('../middleware/auth.middleware');

const router = Router();

router.use(authMiddleware);

router.get('/',    DraftController.get);
router.put('/',    DraftController.save);
router.delete('/', DraftController.clear);

module.exports = router;
