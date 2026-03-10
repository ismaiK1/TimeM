/**
 * Routes teams — CRUD
 */
const express = require('express');
const { body, param } = require('express-validator');
const teamsController = require('../controllers/teamsController');
const { auth } = require('../middlewares/auth');
const { authorize } = require('../middlewares/authorize');
const { validate } = require('../middlewares/validate');

const router = express.Router();
router.use(auth);

router.get('/', teamsController.list);
router.get('/:id', param('id').isUUID().withMessage('ID invalide'), validate, teamsController.get);
router.post(
  '/',
  authorize('MANAGER'),
  [body('name').trim().notEmpty().withMessage('Nom requis'), body('managerId').optional().isUUID()],
  validate,
  teamsController.create
);
router.patch(
  '/:id',
  authorize('MANAGER'),
  param('id').isUUID(),
  [body('name').optional().trim().notEmpty(), body('managerId').optional().custom((v) => v === '' || v === undefined || /^[0-9a-f-]{36}$/i.test(v))],
  validate,
  teamsController.update
);
router.delete('/:id', authorize('MANAGER'), param('id').isUUID(), validate, teamsController.remove);

module.exports = router;
