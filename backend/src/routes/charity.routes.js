const express = require('express');
const router = express.Router();
const { getPublicCharities } = require('../controllers/charity.controller');

router.get('/', getPublicCharities);

module.exports = router;
