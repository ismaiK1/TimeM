/**
 * Service équipes — CRUD
 */
const { prisma } = require('../config/database');

async function list() {
  return prisma.team.findMany({
    include: { manager: { select: { id: true, email: true, firstName: true, lastName: true } } },
  });
}

async function findById(id) {
  return prisma.team.findUnique({
    where: { id },
    include: { manager: { select: { id: true, email: true, firstName: true, lastName: true } }, members: { select: { id: true, email: true, firstName: true, lastName: true, role: true } } },
  });
}

async function create(data) {
  return prisma.team.create({
    data: { name: data.name, managerId: data.managerId ?? undefined },
  });
}

async function update(id, data) {
  const updateData = {};
  if (data.name !== undefined) updateData.name = data.name;
  if (data.managerId !== undefined) updateData.managerId = data.managerId || null;
  return prisma.team.update({
    where: { id },
    data: updateData,
  });
}

async function remove(id) {
  const memberCount = await prisma.user.count({ where: { teamId: id } });
  if (memberCount > 0) {
    const { IntegrityError } = require('./userService');
    throw new IntegrityError("Impossible de supprimer une équipe qui a encore des membres");
  }
  return prisma.team.delete({ where: { id } });
}

module.exports = { list, findById, create, update, remove };
