const express = require('express');
const router = express.Router();
const { submitScore, getMyScores, updateScore, deleteScore } = require('../controllers/score.controller');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);
router.post('/', submitScore);
router.get('/', getMyScores);
router.put('/:id', updateScore);
router.delete('/:id', deleteScore);

module.exports = router;
