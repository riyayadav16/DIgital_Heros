const express = require('express');
const router = express.Router();
const { signup, login, getMe, updateProfile, changePassword, forgotPassword, resetPassword } = require('../controllers/auth.controller');
const { authenticate } = require('../middleware/auth');

router.use((req, res, next) => {
  console.log(`[Auth Routes] ${req.method} ${req.originalUrl}`);
  next();
});

router.post('/signup', signup);
router.post('/login', login);
router.get('/me', authenticate, getMe);
router.patch('/profile', authenticate, updateProfile);
router.patch('/change-password', authenticate, changePassword);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

module.exports = router;
