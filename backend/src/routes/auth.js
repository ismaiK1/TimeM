/**
 * Routes auth — login, me
 */
const express = require('express');
const { body } = require('express-validator');
const authController = require('../controllers/authController');
const { auth } = require('../middlewares/auth');
const { validate } = require('../middlewares/validate');

const router = express.Router();

router.post(
  '/login',
  [
    body('email').isEmail().normalizeEmail().withMessage('Email invalide'),
    body('password').notEmpty().withMessage('Mot de passe requis'),
  ],
  validate,
  authController.login
);
router.get('/me', auth, authController.me);
router.patch(
  '/me/password',
  auth,
  [
    body('currentPassword').notEmpty().withMessage('Mot de passe actuel requis'),
    body('newPassword').isLength({ min: 6 }).withMessage('Nouveau mot de passe min. 6 caractères'),
  ],
  validate,
  authController.changePassword
);

module.exports = router;
