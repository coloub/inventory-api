const express = require('express');
const router = express.Router();
const controller = require('../controllers/userController');
const { validateUser } = require('../middleware/validators');
const validateRequest = require('../middleware/validateRequest');

router.get('/', controller.getAll);
router.post('/', validateUser, validateRequest, controller.create);

module.exports = router;
