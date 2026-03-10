/**
 * Service pointages — règle stricte : un seul clock ouvert (clock_out === null) par user
 */
const { prisma } = require('../config/database');

async function getOpenClock(userId) {
  return prisma.clock.findFirst({
    where: { userId, clockOut: null },
    orderBy: { clockIn: 'desc' },
  });
}

async function clockIn(userId) {
  const open = await getOpenClock(userId);
  if (open) {
    const err = new Error('Un pointage est déjà ouvert. Clôturez-le avant de pointer à l\'entrée.');
    err.code = 'CLOCK_ALREADY_OPEN';
    throw err;
  }
  return prisma.clock.create({
    data: { userId, clockIn: new Date() },
  });
}

async function clockOut(userId) {
  const open = await getOpenClock(userId);
  if (!open) {
    const err = new Error('Aucun pointage ouvert. Pointez d\'abord à l\'entrée.');
    err.code = 'NO_OPEN_CLOCK';
    throw err;
  }
  const now = new Date();
  if (now <= open.clockIn) {
    const err = new Error('L\'heure de sortie doit être postérieure à l\'heure d\'entrée.');
    err.code = 'INVALID_CLOCK_OUT';
    throw err;
  }
  return prisma.clock.update({
    where: { id: open.id },
    data: { clockOut: now },
  });
}

async function listClocks(userId, from, to) {
  const where = { userId };
  if (from || to) {
    where.clockIn = {};
    if (from) where.clockIn.gte = new Date(from);
    if (to) {
      const end = new Date(to);
      end.setHours(23, 59, 59, 999);
      where.clockIn.lte = end;
    }
  }
  return prisma.clock.findMany({
    where,
    orderBy: { clockIn: 'desc' },
  });
}

module.exports = { getOpenClock, clockIn, clockOut, listClocks };
