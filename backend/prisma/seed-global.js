/**
 * Seed global — 4 Équipes, 4 Managers, 16 Employés et 1 mois d'historique profilé
 */
 const { PrismaClient } = require('@prisma/client');
 const bcrypt = require('bcrypt');
 
 const prisma = new PrismaClient();
 
 async function main() {
   console.log("🌱 Début du seed global ultra-complet...");
   const hash = await bcrypt.hash('password123', 10);
 
   // 1. Définition des 4 équipes et de leurs comportements
   const teamsConfig = [
     { id: '11111111-1111-1111-1111-111111111111', name: 'Équipe Dev', manager: { first: 'Marie', email: 'manager1@timemanager.local' }, behavior: 'parfaite' },
     { id: '22222222-2222-2222-2222-222222222222', name: 'Équipe Data', manager: { first: 'Paul', email: 'manager2@timemanager.local' }, behavior: 'eclatee' },
     { id: '33333333-3333-3333-3333-333333333333', name: 'Équipe IT', manager: { first: 'Lucie', email: 'manager3@timemanager.local' }, behavior: 'mixte' },
     { id: '44444444-4444-4444-4444-444444444444', name: 'Équipe Recherche', manager: { first: 'Thomas', email: 'manager4@timemanager.local' }, behavior: 'aleatoire' },
   ];
 
   const allUsersForClocks = [];
 
   console.log("👤 Création des 4 équipes, 4 managers et 16 employés...");
   
   for (let i = 0; i < teamsConfig.length; i++) {
     const tConf = teamsConfig[i];
 
     // Création de l'équipe
     const team = await prisma.team.upsert({
       where: { id: tConf.id },
       update: { name: tConf.name },
       create: { id: tConf.id, name: tConf.name }
     });
 
     // Création du Manager
     const manager = await prisma.user.upsert({
       where: { email: tConf.manager.email },
       update: { teamId: team.id, role: 'MANAGER' },
       create: {
         email: tConf.manager.email,
         passwordHash: hash,
         firstName: tConf.manager.first,
         lastName: 'Manager',
         role: 'MANAGER',
         teamId: team.id
       }
     });
 
     // Lier le manager à l'équipe
     await prisma.team.update({
       where: { id: team.id },
       data: { managerId: manager.id }
     });
 
     // On garde le profil sous le coude pour générer ses pointages plus tard
     allUsersForClocks.push({ id: manager.id, behavior: tConf.behavior });
 
     // Création des 4 employés pour cette équipe
     for (let j = 1; j <= 4; j++) {
       const empIndex = (i * 4) + j; // Génère les numéros de 1 à 16
       const empEmail = `employee${empIndex}@timemanager.local`;
       
       const emp = await prisma.user.upsert({
         where: { email: empEmail },
         update: { teamId: team.id, role: 'EMPLOYEE' },
         create: {
           email: empEmail,
           passwordHash: hash,
           firstName: `Employé ${empIndex}`,
           lastName: tConf.name.split(' ')[1], // Nom de famille = Dev, Data, etc.
           role: 'EMPLOYEE',
           teamId: team.id
         }
       });
       allUsersForClocks.push({ id: emp.id, behavior: tConf.behavior });
     }
   }
 
   console.log("✅ Équipes et profils générés !");
 
   // ------------------------------------------------------------------
   // PARTIE 2 : Génération de l'historique des pointages profilés
   // ------------------------------------------------------------------
   console.log("⏳ Nettoyage des anciens pointages et génération du dernier mois...");
   await prisma.clock.deleteMany({}); // On efface tout pour avoir une base propre
 
   const clocks = [];
   const now = new Date();
 
   // On génère sur 30 jours (1 mois)
   for (const user of allUsersForClocks) {
     for (let i = 30; i >= 0; i--) {
       const date = new Date();
       date.setDate(now.getDate() - i);
 
       // On ignore le week-end
       if (date.getDay() === 0 || date.getDay() === 6) continue;
       
       // Petite probabilité d'absence (5%)
       if (Math.random() < 0.05) continue;
 
       let clockInHour = 8;
       let clockInMinute = 0;
 
       // Définition de l'heure d'arrivée selon le comportement de l'équipe
       if (user.behavior === 'parfaite') {
         // Toujours à l'heure : entre 8h00 et 8h45
         clockInHour = 8;
         clockInMinute = Math.floor(Math.random() * 45);
       } else if (user.behavior === 'eclatee') {
         // Toujours en retard : entre 9h15 et 10h30
         clockInHour = 9 + Math.floor(Math.random() * 2); // 9 ou 10
         clockInMinute = clockInHour === 9 ? 15 + Math.floor(Math.random() * 45) : Math.floor(Math.random() * 30);
       } else if (user.behavior === 'mixte') {
         // Un peu des deux : entre 8h30 et 9h30
         clockInHour = 8 + Math.floor(Math.random() * 2); // 8 ou 9
         clockInMinute = Math.floor(Math.random() * 60);
       } else {
         // Aléatoire total : entre 7h00 et 11h00
         clockInHour = 7 + Math.floor(Math.random() * 4);
         clockInMinute = Math.floor(Math.random() * 60);
       }
 
       const clockIn = new Date(date);
       clockIn.setHours(clockInHour, clockInMinute, 0, 0);
 
       // Heure de départ : entre 7h00 et 8h30 de travail plus tard
       const workDurationHours = 7 + (Math.random() * 1.5); 
       const clockOut = new Date(clockIn.getTime() + workDurationHours * 60 * 60 * 1000);
 
       clocks.push({
         userId: user.id,
         clockIn: clockIn,
         clockOut: clockOut,
       });
     }
   }
 
   console.log(`🚀 Insertion rapide de ${clocks.length} pointages profilés...`);
   await prisma.clock.createMany({
     data: clocks,
   });
 
   console.log("🎉 C'est fini ! Va vite voir les graphiques dans ton navigateur.");
 }
 
 main()
   .then(() => prisma.$disconnect())
   .catch((e) => {
     console.error(e);
     prisma.$disconnect();
     process.exit(1);
   });