/**
 * Contrôleur reports — agrège late-rate et avg-hours (alias cahier des charges)
 */
const statsService = require('../services/statsService');
const { prisma } = require('../config/database');

async function get(req, res, next) {
  try {
    const { from, to, granularity, userId } = req.query;
    let targetUserId = req.user.id;
    if (userId && req.user.role === 'MANAGER' && req.user.teamId) {
      const member = await prisma.user.findFirst({ where: { id: userId, teamId: req.user.teamId } });
      if (member) targetUserId = userId;
    }
    const [lateRate, avgHours] = await Promise.all([
      statsService.getLateRate(targetUserId, from, to),
      statsService.getAvgHours(targetUserId, from, to, granularity || 'day'),
    ]);
    res.json({ lateRate, avgHours });
  } catch (err) {
    next(err);
  }
}

module.exports = { get };
