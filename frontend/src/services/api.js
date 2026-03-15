/**
 * Service API centralisé — Time Manager
 * Centralise tous les appels vers le backend (members, pointages, stats).
 */
import * as usersApi from '../api/users';
import * as clocksApi from '../api/clocks';
import * as statsApi from '../api/stats';

const JOURS_FR = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];

/**
 * Calcule from/to en ISO pour une période donnée.
 * @param {string} period - '7d' | 'month'
 * @returns {{ from: string, to: string }}
 */
function getDateRangeForPeriod(period) {
  const to = new Date();
  const from = new Date();
  if (period === '7d') {
    from.setDate(from.getDate() - 6);
    from.setHours(0, 0, 0, 0);
  } else if (period === 'month') {
    from.setMonth(from.getMonth() - 1);
    from.setDate(1);
    from.setHours(0, 0, 0, 0);
  } else {
    from.setHours(0, 0, 0, 0);
  }
  to.setHours(23, 59, 59, 999);
  return {
    from: from.toISOString(),
    to: to.toISOString(),
  };
}

/**
 * Mappe un utilisateur backend (firstName, lastName) vers le format affiché (name).
 * @param {Object} u - { id, email, firstName, lastName, role, ... }
 * @returns {Object} - { id, name, email, role, status, lateRate, hours }
 */
function mapUserToMember(u) {
  return {
    id: u.id,
    name: [u.firstName, u.lastName].filter(Boolean).join(' ') || u.email,
    email: u.email,
    role: u.role,
    status: '—',
    lateRate: 0,
    hours: 0,
  };
}

/**
 * Récupère la liste des membres (équipe du manager).
 * @returns {Promise<Array<{ id, name, email, role, status, lateRate, hours }>>}
 */
export async function getMembers() {
  const list = await usersApi.list();
  if (!Array.isArray(list)) return [];

  // On récupère la base des utilisateurs
  const members = list.map(mapUserToMember);

  // On va chercher les vraies stats pour chacun (en parallèle pour que ce soit rapide)
  const membersWithStats = await Promise.all(
    members.map(async (member) => {
      try {
        // On demande les stats des 7 derniers jours pour ce membre précis
        const stats = await getStats('7d', member.id);
        
        // On met à jour les données du tableau
        member.lateRate = stats.lateRate.rate ? Math.round(stats.lateRate.rate * 100) : 0;
        member.hours = stats.statsSummary.avgHoursPerWeek || 0;
      } catch (err) {
        // Si erreur, on laisse à 0
        console.error("Erreur stats pour", member.id, err);
      }
      return member;
    })
  );

  return membersWithStats;
}

/**
 * Pointe à l'entrée (utilisateur connecté).
 * @returns {Promise<Object>} - clock créé
 */
export async function clockIn() {
  return clocksApi.clockIn();
}

/**
 * Pointe à la sortie (utilisateur connecté).
 * @returns {Promise<Object>} - clock mis à jour
 */
export async function clockOut() {
  return clocksApi.clockOut();
}

/**
 * Récupère les données pour les graphiques (taux retard + heures par jour).
 * @param {string} period - '7d' | 'month'
 * @returns {Promise<{ lateRate: { rate, lateCount, totalCount }, lateData: Array<{ name, value, color }>, workHoursData: Array<{ day, hours }>, statsSummary: Object }>}
 */
export async function getStats(period = '7d', userId = null) {
  const { from, to } = getDateRangeForPeriod(period);
  const params = { from, to };
  if (userId) params.userId = userId; // On ajoute l'ID de l'employé
  const [lateRateRes, avgHoursRes] = await Promise.all([
    statsApi.lateRate(params),
    statsApi.avgHours({ ...params, granularity: 'day' }),
  ]);

  const rate = lateRateRes.rate ?? 0;
  const onTime = Math.round((1 - rate) * 100);
  const late = Math.round(rate * 100);
  const lateData = [
    { name: "À l'heure", value: onTime, color: '#10b981' },
    { name: 'En retard', value: late, color: '#ef4444' },
  ].filter((d) => d.value > 0);
  if (lateData.length === 0) {
    lateData.push({ name: "À l'heure", value: 100, color: '#10b981' });
  }

  const byDay = avgHoursRes.byDay ?? [];
  const orderWeekday = [1, 2, 3, 4, 5, 6, 0];
  const hoursByWeekday = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
  for (const { date, hours } of byDay) {
    const d = new Date(date);
    const w = d.getDay();
    hoursByWeekday[w] = (hoursByWeekday[w] || 0) + hours;
  }
  const workHoursData = orderWeekday.map((w) => ({
    day: JOURS_FR[w],
    hours: Math.round((hoursByWeekday[w] || 0) * 100) / 100,
  }));

  return {
    lateRate: {
      rate: lateRateRes.rate,
      lateCount: lateRateRes.lateCount ?? 0,
      totalCount: lateRateRes.totalCount ?? 0,
    },
    lateData,
    workHoursData,
    statsSummary: {
      avgHoursPerDay: avgHoursRes.avgHoursPerDay ?? 0,
      avgHoursPerWeek: avgHoursRes.avgHoursPerWeek ?? 0,
    },
  };
}

/**
 * Liste des pointages (pour détecter une session ouverte).
 * @param {Object} params - { from, to } optionnels
 * @returns {Promise<Array>}
 */
export async function getClocks(params = {}) {
  return clocksApi.list(params);
}

/**
 * Vérifie si l'utilisateur a une session ouverte (clock_out null).
 * @returns {Promise<boolean>}
 */
export async function hasOpenClock() {
  const clocks = await getClocks();
  return Array.isArray(clocks) && clocks.some((c) => c.clockOut == null);
}

/**
 * Récupère un membre par id (GET /users/:id).
 * @param {string} id - UUID
 */
export async function getMember(id) {
  return usersApi.get(id);
}

/**
 * Crée un membre (POST /users) — Manager uniquement.
 * @param {Object} payload - { email, password, firstName, lastName, role? }
 */
export async function createMember(payload) {
  return usersApi.create(payload);
}

/**
 * Met à jour un membre (PATCH /users/:id).
 * @param {string} id - UUID
 * @param {Object} payload - { firstName?, lastName?, role? }
 */
export async function updateMember(id, payload) {
  return usersApi.update(id, payload);
}

/**
 * Supprime un membre (DELETE /users/:id).
 * @param {string} id - UUID du membre
 */
export async function deleteMember(id) {
  await usersApi.remove(id);
}
