const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const {
  register,
  login,
  getMe,
  updateProfile,
  changePassword,
  saveFaceEmbedding,
  getFaceEmbedding,
  refreshAccessToken,
  logoutAllSessions,
  enable2FA,
  disable2FA,
  verifyLogin2FA,
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { rateLimit } = require('../middleware/rateLimit');

router.post(
  '/register',
  validate([
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').trim().isEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  ]),
  register
);

router.post(
  '/login',
  rateLimit({
    keyPrefix: 'auth-login',
    windowMs: 15 * 60 * 1000,
    maxRequests: Number(process.env.LOGIN_RATE_LIMIT_MAX || 10),
    message: 'Too many login attempts. Please try again after 15 minutes.',
  }),
  validate([
    body('email').trim().isEmail().withMessage('Valid email is required'),
    body('password').notEmpty().withMessage('Password is required'),
  ]),
  login
);

router.post(
  '/2fa/login-verify',
  validate([
    body('tempToken').notEmpty().withMessage('tempToken is required'),
    body('code').trim().isLength({ min: 6, max: 6 }).withMessage('6-digit code is required'),
  ]),
  verifyLogin2FA
);

router.post('/refresh', refreshAccessToken);
router.post('/logout-all', protect, logoutAllSessions);
router.post('/2fa/enable', protect, enable2FA);
router.post('/2fa/disable', protect, disable2FA);

router.get('/me', protect, getMe);
router.put(
  '/profile',
  protect,
  validate([
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').optional().trim().isEmail().withMessage('Valid email is required'),
    body('phone').optional().isString().withMessage('Phone must be text'),
  ]),
  updateProfile
);
router.put('/change-password', protect, changePassword);
router.post('/face', protect, saveFaceEmbedding);
router.get('/face', protect, getFaceEmbedding);

module.exports = router;
