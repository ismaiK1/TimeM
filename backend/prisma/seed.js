/**
 * Seed — équipe, manager, employé de test
 */
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  const hash = await bcrypt.hash('password123', 10);
  const team = await prisma.team.upsert({
    where: { id: '00000000-0000-0000-0000-000000000001' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000001',
      name: 'Équipe Dev',
    },
  });
  const manager = await prisma.user.upsert({
    where: { email: 'manager@timemanager.local' },
    update: {},
    create: {
      email: 'manager@timemanager.local',
      passwordHash: hash,
      firstName: 'Marie',
      lastName: 'Manager',
      role: 'MANAGER',
      teamId: team.id,
    },
  });
  await prisma.team.update({
    where: { id: team.id },
    data: { managerId: manager.id },
  });
  await prisma.user.upsert({
    where: { email: 'employee@timemanager.local' },
    update: {},
    create: {
      email: 'employee@timemanager.local',
      passwordHash: hash,
      firstName: 'Jean',
      lastName: 'Employé',
      role: 'EMPLOYEE',
      teamId: team.id,
    },
  });
  console.log('Seed OK: team, manager@timemanager.local, employee@timemanager.local (password: password123)');
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
