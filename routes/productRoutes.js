const express = require('express');
const router = express.Router();
const controller = require('../controllers/productController');
const { ensureAuth } = require('../middleware/auth');
const { validateProduct } = require('../middleware/validators');
const validateRequest = require('../middleware/validateRequest');

router.get('/', controller.getAll);
router.post('/', ensureAuth, validateProduct, validateRequest, controller.create);
router.put('/:id', ensureAuth, validateProduct, validateRequest, controller.update);
router.delete('/:id', ensureAuth, controller.remove);

module.exports = router;
