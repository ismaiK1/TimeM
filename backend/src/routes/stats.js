/**
 * Routes stats — late-rate, avg-hours
 */
const express = require('express');
const { query } = require('express-validator');
const statsController = require('../controllers/statsController');
const { auth } = require('../middlewares/auth');
const { validate } = require('../middlewares/validate');

const router = express.Router();
router.use(auth);

// optional({ values: 'falsy' }) = chaîne vide traitée comme absent (pas de 400)
router.get(
  '/late-rate',
  [
    query('from').optional({ values: 'falsy' }).isISO8601(),
    query('to').optional({ values: 'falsy' }).isISO8601(),
    query('userId').optional({ values: 'falsy' }).isUUID(),
  ],
  validate,
  statsController.lateRate
);
router.get(
  '/avg-hours',
  [
    query('from').optional({ values: 'falsy' }).isISO8601(),
    query('to').optional({ values: 'falsy' }).isISO8601(),
    query('granularity').optional({ values: 'falsy' }).isIn(['day', 'week']),
    query('userId').optional({ values: 'falsy' }).isUUID(),
  ],
  validate,
  statsController.avgHours
);

module.exports = router;
