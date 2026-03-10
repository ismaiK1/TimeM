/**
 * Service stats — taux de retard (9h fixe), moyenne heures travaillées
 */
const { prisma } = require('../config/database');
const config = require('../config');

/**
 * Retard = clock_in après 9h00 (heure fixe)
 */
function isLate(clockIn) {
  const d = new Date(clockIn);
  const hour = d.getHours();
  const minute = d.getMinutes();
  return hour > config.expectedClockInHour || (hour === config.expectedClockInHour && minute > config.expectedClockInMinute);
}

async function getLateRate(userId, from, to) {
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
  const clocks = await prisma.clock.findMany({ where, select: { clockIn: true } });
  const totalCount = clocks.length;
  const lateCount = clocks.filter((c) => isLate(c.clockIn)).length;
  const rate = totalCount === 0 ? 0 : lateCount / totalCount;
  return { lateCount, totalCount, rate };
}

/**
 * Moyenne d'heures travaillées (clocks avec clock_out non null)
 * byDay: { date, hours }
 * byWeek: { weekStart, hours } (optionnel)
 */
async function getAvgHours(userId, from, to, _granularity = 'day') {
  const where = { userId, clockOut: { not: null } };
  if (from || to) {
    where.clockIn = {};
    if (from) where.clockIn.gte = new Date(from);
    if (to) {
      const end = new Date(to);
      end.setHours(23, 59, 59, 999);
      where.clockIn.lte = end;
    }
  }
  const clocks = await prisma.clock.findMany({
    where,
    select: { clockIn: true, clockOut: true },
  });
  const hoursByDay = {};
  const hoursByWeek = {};
  for (const c of clocks) {
    const durationMs = new Date(c.clockOut) - new Date(c.clockIn);
    const hours = durationMs / (1000 * 60 * 60);
    const d = new Date(c.clockIn);
    const dateKey = d.toISOString().slice(0, 10);
    hoursByDay[dateKey] = (hoursByDay[dateKey] || 0) + hours;
    const weekStart = new Date(d);
    weekStart.setDate(d.getDate() - d.getDay());
    const weekKey = weekStart.toISOString().slice(0, 10);
    hoursByWeek[weekKey] = (hoursByWeek[weekKey] || 0) + hours;
  }
  const byDay = Object.entries(hoursByDay).map(([date, hours]) => ({ date, hours: Math.round(hours * 100) / 100 }));
  byDay.sort((a, b) => a.date.localeCompare(b.date));
  const byWeek = Object.entries(hoursByWeek).map(([weekStart, hours]) => ({ weekStart, hours: Math.round(hours * 100) / 100 }));
  byWeek.sort((a, b) => a.weekStart.localeCompare(b.weekStart));
  const avgDay = byDay.length ? byDay.reduce((s, x) => s + x.hours, 0) / byDay.length : 0;
  const avgWeek = byWeek.length ? byWeek.reduce((s, x) => s + x.hours, 0) / byWeek.length : 0;
  return {
    byDay,
    byWeek,
    avgHoursPerDay: Math.round(avgDay * 100) / 100,
    avgHoursPerWeek: Math.round(avgWeek * 100) / 100,
  };
}

module.exports = { getLateRate, getAvgHours, isLate };
