const express = require('express');
const router = express.Router();
const controller = require('../controllers/categoryController');
const { ensureAuth } = require('../middleware/auth');
const { validateCategory } = require('../middleware/validators');
const validateRequest = require('../middleware/validateRequest');

router.get('/', controller.getAll);
router.post('/', ensureAuth, validateCategory, validateRequest, controller.create);
router.put('/:id', ensureAuth, validateCategory, validateRequest, controller.update);
router.delete('/:id', ensureAuth, controller.remove);

module.exports = router;
