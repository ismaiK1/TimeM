
🚀 Time Manager — Guide de Présentation & Installation

Ce document récapitule la configuration technique, l'infrastructure DevOps et les procédures de lancement pour le projet Time Manager.

🛠️ Installation & Lancement Rapide (Docker)
C'est la méthode recommandée pour le développement et la démonstration du projet.

Étape	Action	Commande
1	Clonage	git clone <repo> timetable && cd timetable
2	Configuration	cp .env.example .env (Vérifiez votre JWT_SECRET)
3	Construction	docker compose -f docker-compose.yml up -d --build
4	Base de données	stucture docker compose exec backend npx prisma migrate deploy
5	Génération des donnée de pointage pour visuel docker compose exec backend node prisma/seed-global.js

🌐 Accès aux Services & Ports
Configuration corrigée pour l'environnement de développement via le Reverse Proxy Nginx.

Service	URL / Adresse	Port Hôte	Rôle
Application Web	http://localhost:8080	8080	Point d'entrée principal (Nginx)
API Backend	http://localhost:8080/api	8080	Routage intelligent vers Node.js
Base de données	localhost:5433	5433	PostgreSQL 16 stable
Mailpit	http://localhost:8025	8025	Interface Web pour mails de test
🛠️ Pipeline CI/CD : Qualité & Automatisation
Le pipeline GitHub Actions assure la robustesse du code avant chaque mise en production :

Déclenchement Automatique : S'active à chaque push ou pull request sur les branches main et develop.

Validation Backend : Tests d'intégration sur une instance PostgreSQL 16 éphémère.

Qualité & Lint (Bloquant) : Analyse de la propreté du code ; toute erreur de style ou de syntaxe stoppe le pipeline.

Frontend & Build : Vérification de la compilation (npm run build) et exécution des tests unitaires.

Validation Docker : Construction réelle des images de production (Dockerfile.prod) pour garantir un déploiement sans erreur.

🐘 Gestion de la Donnée (PostgreSQL & Prisma)
Fichier	Rôle	Utilité Technique
schema.prisma	Le Plan	Source de vérité unique définissant les modèles User, Team et Clock.
migration.sql	L'Histoire	Traduction du schéma en SQL pur pour la base PostgreSQL.
seed-global.js	Le Décorateur	Génère 20 profils et 1 mois d'historique de pointages réalistes.
Note technique : L'utilisation de Prisma permet de manipuler des objets JavaScript sécurisés plutôt que d'écrire du SQL complexe à la main, évitant ainsi les erreurs de typage et les injections.

🛡️ Comptes de Test (Mot de passe par défaut : password123)
Données injectées via le script de seed pour la démonstration :

Rôle	Email	Équipe / Comportement
Manager Dev	manager1@timemanager.local	Équipe performante et ponctuelle
Manager Data	manager2@timemanager.local	Équipe présentant de nombreux retards
Employé 1	employee1@timemanager.local	Rattaché à l'équipe de développement
🛣️ Résumé des Routes API (Routes Protégées)
Toutes les routes (sauf login) nécessitent le header Authorization: Bearer <token>.

Authentification : POST /api/auth/login | GET /api/auth/me

Utilisateurs : GET /api/users (Manager) | POST /api/users (Manager)

Pointages : POST /api/clocks (Pointage entrée/sortie)

Statistiques : GET /api/stats/late-rate | GET /api/stats/avg-hours