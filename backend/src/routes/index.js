/**
 * Agrégation des routes — préfixe /api géré par app
 */
const express = require('express');
const authRoutes = require('./auth');
const usersRoutes = require('./users');
const teamsRoutes = require('./teams');
const clocksRoutes = require('./clocks');
const statsRoutes = require('./stats');
const reportsRoutes = require('./reports');

const router = express.Router();
router.use('/auth', authRoutes);
router.use('/users', usersRoutes);
router.use('/teams', teamsRoutes);
router.use('/clocks', clocksRoutes);
router.use('/stats', statsRoutes);
router.use('/reports', reportsRoutes);

module.exports = router;
