/**
 * Routes reports — alias des statistiques (cahier des charges /api/reports)
 */
const express = require('express');
const { query } = require('express-validator');
const reportsController = require('../controllers/reportsController');
const { auth } = require('../middlewares/auth');
const { validate } = require('../middlewares/validate');

const router = express.Router();
router.use(auth);
router.get(
  '/',
  [
    query('from').optional({ values: 'falsy' }).isISO8601(),
    query('to').optional({ values: 'falsy' }).isISO8601(),
    query('granularity').optional({ values: 'falsy' }).isIn(['day', 'week']),
    query('userId').optional({ values: 'falsy' }).isUUID(),
  ],
  validate,
  reportsController.get
);

module.exports = router;
