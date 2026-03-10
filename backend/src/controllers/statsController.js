/**
 * Contrôleur stats — late-rate, avg-hours (Employee : soi ; Manager : équipe)
 */
const statsService = require('../services/statsService');
const { prisma } = require('../config/database');

async function lateRate(req, res, next) {
  try {
    const { from, to, userId } = req.query;
    let targetUserId = req.user.id;
    if (userId && req.user.role === 'MANAGER' && req.user.teamId) {
      const member = await prisma.user.findFirst({ where: { id: userId, teamId: req.user.teamId } });
      if (member) targetUserId = userId;
    }
    const result = await statsService.getLateRate(targetUserId, from, to);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

async function avgHours(req, res, next) {
  try {
    const { from, to, granularity, userId } = req.query;
    let targetUserId = req.user.id;
    if (userId && req.user.role === 'MANAGER' && req.user.teamId) {
      const member = await prisma.user.findFirst({ where: { id: userId, teamId: req.user.teamId } });
      if (member) targetUserId = userId;
    }
    const result = await statsService.getAvgHours(targetUserId, from, to, granularity);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

module.exports = { lateRate, avgHours };
