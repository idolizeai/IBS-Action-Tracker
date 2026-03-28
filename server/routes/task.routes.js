const { Router } = require('express');
const TaskController = require('../controllers/task.controller');
const { authMiddleware } = require('../middleware/auth.middleware');

const router = Router();

router.use(authMiddleware);

router.get('/',    TaskController.list);
router.post('/',   TaskController.create);
router.patch('/:id', TaskController.update);
router.delete('/:id', TaskController.remove);

module.exports = router;
