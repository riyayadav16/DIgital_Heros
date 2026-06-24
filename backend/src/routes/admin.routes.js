const express = require('express');
const router = express.Router();
const { authenticate, requireAdmin } = require('../middleware/auth');
const {
  getUsers, updateUser, deleteUser,
  getAllScores, deleteScore,
  runDraw, simulateDrawHandler, publishDrawHandler, getAllDraws,
  getAllWinners, verifyWinner, updatePayout,
  getCharities, createCharity, updateCharity, deleteCharity,
  getAnalytics
} = require('../controllers/admin.controller');

router.use(authenticate, requireAdmin);

// Analytics
router.get('/analytics', getAnalytics);

// Users
router.get('/users', getUsers);
router.patch('/users/:id', updateUser);
router.delete('/users/:id', deleteUser);

// Scores
router.get('/scores', getAllScores);
router.delete('/scores/:id', deleteScore);

// Draws
router.get('/draws', getAllDraws);
router.post('/draws/run', runDraw);
router.post('/draws/simulate', simulateDrawHandler);
router.post('/draws/publish/:id', publishDrawHandler);

// Winners
router.get('/winners', getAllWinners);
router.patch('/winners/:id/verify', verifyWinner);
router.patch('/winners/:id/payout', updatePayout);

// Charities
router.get('/charities', getCharities);
router.post('/charities', createCharity);
router.patch('/charities/:id', updateCharity);
router.delete('/charities/:id', deleteCharity);

module.exports = router;
