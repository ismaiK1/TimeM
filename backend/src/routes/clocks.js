/**
 * Routes clocks — POST action, GET liste
 */
const express = require('express');
const { body, query } = require('express-validator');
const clocksController = require('../controllers/clocksController');
const { auth } = require('../middlewares/auth');
const { validate } = require('../middlewares/validate');

const router = express.Router();
router.use(auth);

router.post(
  '/',
  [body('action').isIn(['clock_in', 'clock_out']).withMessage('action doit être clock_in ou clock_out')],
  validate,
  clocksController.postClock
);
router.get(
  '/',
  [
    query('from').optional().isISO8601().withMessage('from doit être une date ISO'),
    query('to').optional().isISO8601().withMessage('to doit être une date ISO'),
    query('userId').optional().isUUID(),
  ],
  validate,
  clocksController.list
);

module.exports = router;
