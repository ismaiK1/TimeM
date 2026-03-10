# Time Manager — Gestion de pointage

Application Fullstack de gestion des pointages (clock in/out) avec tableaux de bord, KPIs (taux de retard, heures travaillées) et rôles Employee / Manager.

## Objectifs

- **Employés** : pointer à l’entrée/sortie, consulter ses pointages et son tableau de bord (taux de retard, moyenne d’heures).
- **Managers** : voir les pointages et dashboards de leur équipe, gérer les utilisateurs et équipes.
- **Sécurité** : API REST protégée par JWT, rôles, protection XSS/CSRF (Helmet, CORS).

## Stack technique

| Couche      | Technologie                          |
|------------|--------------------------------------|
| Backend    | Node.js 20, Express, Prisma, PostgreSQL |
| Frontend   | React 18, Vite, TailwindCSS, Recharts |
| Infra      | Docker, Docker Compose, Nginx (reverse proxy) |
| CI/CD      | GitHub Actions (build, tests, coverage) |

## Prérequis

- **Node.js** 20+
- **Docker** et **Docker Compose** (pour lancer toute la stack)
- **PostgreSQL** 16 (optionnel si vous utilisez uniquement Docker)

## Installation

1. Cloner le dépôt :
   ```bash
   git clone <repo> timetable && cd timetable
   ```

2. Copier les variables d’environnement :
   ```bash
   cp .env.example .env
   ```
   Adapter les valeurs (mots de passe, ports, `JWT_SECRET`, `FRONTEND_ORIGIN`).

3. **Option A — Tout en Docker (recommandé pour le dev)**  
   ```bash
   docker compose -f docker-compose.dev.yml up -d --build
   ```
   - App (Nginx) : **http://localhost:8080**
   - Backend seul : **http://localhost:3000**
   - PostgreSQL : **localhost:5433** (ou `POSTGRES_PORT` dans `.env`)

4. **Option B — Backend et frontend en local**  
   - Créer la base et appliquer les migrations :
     ```bash
     cd backend && npm ci && npx prisma generate && npx prisma migrate deploy
     ```
     (avec `DATABASE_URL` dans `.env` ou `backend/.env`)
   - Optionnel : seed (compte manager + employé) :
     ```bash
     cd backend && npm run db:seed
     ```
     Comptes : `manager@timemanager.local` / `employee@timemanager.local` — mot de passe : `password123`
   - Démarrer le backend : `cd backend && npm run dev`
   - Démarrer le frontend : `cd frontend && npm ci && npm run dev`  
     Frontend : **http://localhost:5173** (configurer `VITE_API_BASE_URL` si l’API est ailleurs)

## Variables d’environnement

| Variable            | Description                          | Exemple (dev)                    |
|--------------------|--------------------------------------|-----------------------------------|
| `POSTGRES_USER`     | Utilisateur PostgreSQL              | `timemanager`                     |
| `POSTGRES_PASSWORD`| Mot de passe PostgreSQL             | (à définir)                       |
| `POSTGRES_DB`      | Nom de la base                      | `timemanager_dev`                 |
| `POSTGRES_PORT`    | Port exposé PostgreSQL (host)       | `5433`                            |
| `DATABASE_URL`     | URL de connexion (backend)          | `postgresql://user:pass@host:5432/db` |
| `BACKEND_PORT`     | Port du serveur backend             | `3000`                            |
| `NGINX_HTTP_PORT`  | Port Nginx (accès app)              | `8080`                            |
| `JWT_SECRET`       | Secret pour les tokens JWT          | (à définir, fort en prod)         |
| `FRONTEND_ORIGIN`  | Origine CORS (backend)              | `http://localhost:8080`           |
| `VITE_API_BASE_URL`| URL de l’API (frontend)             | `http://localhost:8080/api`        |

## API REST

Base URL (derrière Nginx) : `/api` (ex. `http://localhost:8080/api`).

| Méthode | Route              | Description                    | Rôle      |
|--------|--------------------|--------------------------------|-----------|
| POST   | `/auth/login`      | Connexion (email, password)    | Public    |
| GET    | `/auth/me`         | Profil connecté                | Auth      |
| GET    | `/users`           | Liste des utilisateurs (équipe)| Manager   |
| GET    | `/users/:id`       | Détail utilisateur             | Soi / Manager équipe |
| POST   | `/users`           | Créer utilisateur              | Manager   |
| PATCH  | `/users/:id`       | Modifier utilisateur           | Soi / Manager équipe |
| DELETE | `/users/:id`       | Supprimer utilisateur          | Manager   |
| GET    | `/teams`           | Liste équipes                  | Auth      |
| GET    | `/teams/:id`       | Détail équipe                  | Auth      |
| POST   | `/teams`           | Créer équipe                   | Manager   |
| PATCH  | `/teams/:id`       | Modifier équipe                | Manager   |
| DELETE | `/teams/:id`       | Supprimer équipe               | Manager   |
| POST   | `/clocks`          | Pointer (body: `{ "action": "clock_in" \| "clock_out" }`) | Auth |
| GET    | `/clocks`          | Liste pointages (query: from, to, userId) | Auth / Manager |
| GET    | `/stats/late-rate` | Taux de retard (query: from, to, userId)  | Auth / Manager |
| GET    | `/stats/avg-hours` | Moyenne heures (query: from, to, granularity, userId) | Auth / Manager |

Authentification : header `Authorization: Bearer <token>`.

Règle métier **pointages** : un utilisateur ne peut pas faire un nouveau `clock_in` s’il a déjà un pointage ouvert (`clock_out` null). Un seul pointage ouvert à la fois.

## Tests

- **Backend**  
  ```bash
  cd backend && npm run test
  ```
  Avec base de test (ex. `DATABASE_URL` vers une base dédiée) pour les tests d’auth complets.  
  Couverture : `npm run test:coverage` (sortie selon Node / NODE_V8_COVERAGE).

- **Frontend**  
  ```bash
  cd frontend && npm run test
  npm run test:coverage
  ```

## Schéma de la base de données

Voir **[docs/DB_SCHEMA.md](docs/DB_SCHEMA.md)** pour les tables `users`, `teams`, `clocks` et leurs relations.

## Structure du projet

Voir **[STRUCTURE.md](STRUCTURE.md)** pour l’arborescence. Résumé :

- `backend/` — API Express (Prisma, JWT, CRUD users/teams/clocks, stats)
- `frontend/` — SPA React (Vite, Tailwind, dashboard, graphiques Recharts, vue manager)
- `nginx/` — Configuration reverse proxy (dev)
- `docker-compose.dev.yml` — Stack de développement (PostgreSQL, backend, frontend, Nginx)
- `.github/workflows/ci.yml` — CI (build, tests, coverage, build Docker)

## Production

- Utiliser `docker-compose.yml` avec des variables d’environnement sécurisées (secrets).
- Configurer `FRONTEND_ORIGIN` et `VITE_API_BASE_URL` pour l’URL de production.
- Changer `JWT_SECRET` et tous les mots de passe.

## Licence

Voir [LICENSE](LICENSE) le cas échéant.
