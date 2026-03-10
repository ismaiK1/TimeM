/**
 * Routes users — CRUD (protégées auth + rôle).
 * RBAC : GET /users réservé MANAGER ; GET/PATCH /users/:id autorisé si req.user.id === id (EMPLOYEE) ou MANAGER équipe (voir usersController).
 */
const express = require('express');
const { body, param } = require('express-validator');
const usersController = require('../controllers/usersController');
const { auth } = require('../middlewares/auth');
const { authorize } = require('../middlewares/authorize');
const { validate } = require('../middlewares/validate');

const router = express.Router();
router.use(auth);

router.get('/', authorize('MANAGER'), usersController.list);
router.get(
  '/:id',
  param('id').isUUID().withMessage('ID invalide'),
  validate,
  usersController.get
);
router.post(
  '/',
  authorize('MANAGER'),
  [
    body('email').isEmail().normalizeEmail().withMessage('Email invalide'),
    body('password').isLength({ min: 6 }).withMessage('Mot de passe min. 6 caractères'),
    body('firstName').trim().notEmpty().withMessage('Prénom requis'),
    body('lastName').trim().notEmpty().withMessage('Nom requis'),
    body('role').optional().isIn(['EMPLOYEE', 'MANAGER']).withMessage('Rôle invalide'),
  ],
  validate,
  usersController.create
);
router.patch(
  '/:id',
  param('id').isUUID().withMessage('ID invalide'),
  [
    body('firstName').optional().trim().notEmpty(),
    body('lastName').optional().trim().notEmpty(),
    body('password').optional().isLength({ min: 6 }),
    body('role').optional().isIn(['EMPLOYEE', 'MANAGER']),
    body('teamId').optional().custom((v) => v === '' || v === undefined || /^[0-9a-f-]{36}$/i.test(v)).withMessage('teamId invalide'),
  ],
  validate,
  usersController.update
);
router.delete(
  '/:id',
  param('id').isUUID().withMessage('ID invalide'),
  validate,
  authorize('MANAGER'),
  usersController.remove
);

module.exports = router;
