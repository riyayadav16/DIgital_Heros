const express = require('express');
const router = express.Router();
const { subscribe, getStatus, cancelSubscription } = require('../controllers/subscription.controller');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);
router.post('/subscribe', subscribe);
router.get('/status', getStatus);
router.post('/cancel', cancelSubscription);

module.exports = router;
