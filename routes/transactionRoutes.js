const express = require('express');
const router = express.Router();
const controller = require('../controllers/transactionController');
const { ensureAuth } = require('../middleware/auth');
const { validateTransaction } = require('../middleware/validators');
const validateRequest = require('../middleware/validateRequest');

router.get('/', controller.getAll);
router.post('/', ensureAuth, validateTransaction, validateRequest, controller.create);

module.exports = router;
