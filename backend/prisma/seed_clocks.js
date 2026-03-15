/**
 * Script de génération d'historique de pointages (3 mois)
 */
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🔍 Récupération des utilisateurs...');
  const users = await prisma.user.findMany();

  if (users.length === 0) {
    console.log('⚠️ Aucun utilisateur trouvé.');
    return;
  }

  console.log(`⏳ Génération des pointages pour ${users.length} utilisateurs sur les 90 derniers jours...`);
  const clocks = [];
  const now = new Date();

  for (const user of users) {
    // Boucle sur les 90 derniers jours
    for (let i = 90; i >= 0; i--) {
      const date = new Date();
      date.setDate(now.getDate() - i);

      // Ignorer les week-ends (Samedi = 6, Dimanche = 0)
      if (date.getDay() === 0 || date.getDay() === 6) continue;

      // Aléatoire : 10% de chance d'être absent ce jour-là
      if (Math.random() < 0.1) continue;

      // Heure d'arrivée : entre 8h00 et 9h29
      // (Rappel : ton config fixe le retard à partir de 9h00)
      const clockInHour = 8;
      const clockInMinute = Math.floor(Math.random() * 90); 
      const clockIn = new Date(date);
      clockIn.setHours(clockInHour, clockInMinute, 0, 0);

      // Heure de départ : entre 7h30 et 9h00 plus tard
      const workDurationHours = 7.5 + (Math.random() * 1.5); 
      const clockOut = new Date(clockIn.getTime() + workDurationHours * 60 * 60 * 1000);

      clocks.push({
        userId: user.id,
        clockIn: clockIn,
        clockOut: clockOut,
      });
    }
  }

  console.log(`🚀 Insertion de ${clocks.length} pointages en base de données...`);
  
  // createMany permet d'insérer des centaines de lignes en une seule requête très rapide
  await prisma.clock.createMany({
    data: clocks,
  });

  console.log('✅ Terminé avec succès ! Tes graphiques vont être magnifiques.');
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });