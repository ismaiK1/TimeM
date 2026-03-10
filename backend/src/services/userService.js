/**
 * Service utilisateurs — CRUD + logique métier
 */
const bcrypt = require('bcrypt');
const { prisma } = require('../config/database');

async function findByEmail(email) {
  return prisma.user.findUnique({ where: { email } });
}

async function findById(id) {
  return prisma.user.findUnique({
    where: { id },
    select: { id: true, email: true, firstName: true, lastName: true, role: true, teamId: true, createdAt: true, updatedAt: true },
  });
}

async function findManyByTeamId(teamId) {
  return prisma.user.findMany({
    where: { teamId },
    select: { id: true, email: true, firstName: true, lastName: true, role: true, teamId: true, createdAt: true, updatedAt: true },
  });
}

async function listForManager(managerTeamId) {
  if (!managerTeamId) return [];
  return findManyByTeamId(managerTeamId);
}

async function create(data) {
  const hash = await bcrypt.hash(data.password, 10);
  return prisma.user.create({
    data: {
      email: data.email,
      passwordHash: hash,
      firstName: data.firstName,
      lastName: data.lastName,
      role: data.role || 'EMPLOYEE',
      teamId: data.teamId ?? undefined,
    },
    select: { id: true, email: true, firstName: true, lastName: true, role: true, teamId: true, createdAt: true, updatedAt: true },
  });
}

async function update(id, data) {
  const allowed = ['firstName', 'lastName', 'role', 'teamId'];
  const updateData = {};
  for (const k of allowed) {
    if (data[k] !== undefined) updateData[k] = data[k];
  }
  if (data.password) {
    updateData.passwordHash = await bcrypt.hash(data.password, 10);
  }
  return prisma.user.update({
    where: { id },
    data: updateData,
    select: { id: true, email: true, firstName: true, lastName: true, role: true, teamId: true, createdAt: true, updatedAt: true },
  });
}

/** Erreur métier pour contraintes d'intégrité (ex. suppression refusée) */
class IntegrityError extends Error {
  constructor(message) {
    super(message);
    this.name = 'IntegrityError';
    this.code = 'INTEGRITY';
  }
}

async function remove(id) {
  const team = await prisma.team.findFirst({ where: { managerId: id } });
  if (team) {
    const memberCount = await prisma.user.count({ where: { teamId: team.id } });
    if (memberCount > 0) {
      throw new IntegrityError("Impossible de supprimer un manager dont l'équipe a encore des membres");
    }
  }
  return prisma.user.delete({ where: { id } });
}

function canAccessUser(requester, targetUserId) {
  if (requester.id === targetUserId) return true;
  if (requester.role === 'MANAGER' && requester.teamId) {
    // Vérification que targetUserId est dans la même équipe se fera en base
    return true;
  }
  return false;
}

module.exports = {
  findByEmail,
  findById,
  findManyByTeamId,
  listForManager,
  create,
  update,
  remove,
  canAccessUser,
  IntegrityError,
};
