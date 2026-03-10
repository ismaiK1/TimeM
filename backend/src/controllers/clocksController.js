/**
 * Contrôleur pointages — POST clock_in/clock_out (validation stricte), GET liste
 */
const clockService = require('../services/clockService');
const { prisma } = require('../config/database');

async function postClock(req, res, next) {
  try {
    const { action } = req.body;
    if (action === 'clock_in') {
      const clock = await clockService.clockIn(req.user.id);
      return res.status(201).json(clock);
    }
    if (action === 'clock_out') {
      const clock = await clockService.clockOut(req.user.id);
      return res.json(clock);
    }
    return res.status(400).json({ error: 'action doit être "clock_in" ou "clock_out"' });
  } catch (err) {
    if (err.code === 'CLOCK_ALREADY_OPEN') return res.status(409).json({ error: err.message });
    if (err.code === 'NO_OPEN_CLOCK') return res.status(409).json({ error: err.message });
    if (err.code === 'INVALID_CLOCK_OUT') return res.status(400).json({ error: err.message });
    next(err);
  }
}

async function list(req, res, next) {
  try {
    const { from, to, userId } = req.query;
    let targetUserId = req.user.id;
    if (userId && req.user.role === 'MANAGER' && req.user.teamId) {
      const member = await prisma.user.findFirst({ where: { id: userId, teamId: req.user.teamId } });
      if (member) targetUserId = userId;
    }
    const clocks = await clockService.listClocks(targetUserId, from, to);
    res.json(clocks);
  } catch (err) {
    next(err);
  }
}

module.exports = { postClock, list };
