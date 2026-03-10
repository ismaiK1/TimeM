# Time Manager — Guide de soutenance jury

Document de présentation exhaustif pour la soutenance orale. Ce guide s’appuie sur le cahier des charges et le tableau de conformité (CONFORMITE.md) pour mettre en avant l’agilité, la scalabilité et la robustesse du projet via une approche DevOps.

---

## 1. Introduction & Vision du Projet

### Présentation du Time Manager

**Time Manager** est une application fullstack de gestion des pointages (clock in / clock out) avec tableaux de bord, indicateurs clés (KPIs) et gestion des rôles Employee / Manager.

- **Employés** : pointer à l’entrée et à la sortie, consulter ses pointages et son tableau de bord (taux de retard, moyenne d’heures travaillées).
- **Managers** : visualiser les pointages et dashboards de leur équipe, gérer les utilisateurs et les équipes.

### Enjeux métier

- **Gestion du temps** : suivi fiable des présences et des horaires (entrée/sortie).
- **KPIs managers** : taux de retard (retard = pointage après 9h00), moyenne d’heures travaillées par jour/semaine, pour piloter l’équipe.
- **Gestion d’équipe** : création et édition de membres, attribution à une équipe, droits en cascade selon le rôle.

### Objectif principal

**Agilité, scalabilité et robustesse** via la philosophie DevOps :

- **Infrastructure as Code** : Docker, Docker Compose, stratégie multi-stage, volumes pour la persistance (données et logs).
- **Sécurité** : JWT strict en production, RBAC, Helmet, CORS, validation des entrées.
- **Qualité** : CI/CD (GitHub Actions), tests automatisés, couverture > 60 % sur les routes critiques, lint bloquant.
- **Observabilité** : logs persistants (backend et Nginx) sur volumes nommés pour ne pas perdre les traces en cas de crash container.

Le respect strict du cahier des charges est tracé dans [CONFORMITE.md](CONFORMITE.md) (barème 100 %).

---

## 2. Architecture Technique & Choix (justification obligatoire)

### Stack technique

| Couche      | Technologie                          | Justification |
|------------|--------------------------------------|---------------|
| Backend    | Node.js 20, Express, Prisma, PostgreSQL | **Performance** : exécution asynchrone, adaptée aux I/O (BDD, API). **Écosystème** : npm, express-validator, bcrypt, JWT. **Typage et intégrité** : Prisma fournit un schéma déclaratif, des migrations versionnées et un client typé pour éviter les erreurs SQL. |
| Frontend   | React 18, Vite, Tailwind CSS, Recharts | **Composants réutilisables** : logique et UI modulaires. **UX soignée** : Tailwind pour des interfaces cohérentes et responsives. **Data viz fluide** : Recharts (AreaChart, PieChart) pour les KPIs (taux de retard, heures par jour) avec rendu performant. Vite pour un dev rapide et des builds optimisés. |
| Base de données | PostgreSQL 16, schéma relationnel | **Intégrité** : contraintes FK, UNIQUE (ex. un manager par équipe), règles métier (un seul pointage ouvert par utilisateur). Colonnes en **snake_case** pour cohérence avec les conventions BDD. |

### Schéma relationnel (User, Team, Clock)

Les entités principales sont **users**, **teams** et **clocks**, avec intégrité référentielle et règles métier garanties par le schéma et le code.

**Relations :**

| Relation | Cardinalité | Description |
|----------|-------------|-------------|
| User → Team | N → 1 | Un utilisateur appartient à une équipe (`team_id`). |
| Team → Manager (User) | 1 → 1 | Une équipe a un seul manager (`manager_id` UNIQUE). |
| Team → Members (User) | 1 → N | Une équipe a plusieurs membres. |
| User → Clocks | 1 → N | Un utilisateur a plusieurs pointages. |

**Diagramme relationnel (ASCII) :**

```
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│     users       │       │     teams       │       │     clocks      │
├─────────────────┤       ├─────────────────┤       ├─────────────────┤
│ id (PK)         │       │ id (PK)         │       │ id (PK)         │
│ email           │       │ name            │       │ user_id (FK)─────┼──→ users.id
│ password_hash   │       │ manager_id (FK)─┼──→─────┤                 │
│ first_name      │       │ created_at      │       │ clock_in        │
│ last_name       │       │ updated_at      │       │ clock_out       │
│ role            │       └────────▲────────┘       │ created_at     │
│ team_id (FK)────┼──→─────────────┘                │ updated_at     │
│ created_at      │                                 └─────────────────┘
│ updated_at      │
└─────────────────┘
```

**Règles métier BDD :**

- Un utilisateur ne peut avoir qu’**un seul** pointage avec `clock_out` null (session ouverte).
- `clock_out` doit être postérieur à `clock_in` si renseigné.
- Rôles : `employee` (pointe et consulte ses données), `manager` (consulte et gère son équipe).

Détail complet : [docs/DB_SCHEMA.md](docs/DB_SCHEMA.md).

---

## 3. Infrastructure & DevOps (cœur du barème)

### Dockerisation

**Stratégie multi-stage (production) —** [backend/Dockerfile](backend/Dockerfile)

- **Stage 1 — `deps`** : image `node:20-alpine`, installation des dépendances (`npm ci`), copie du schéma Prisma et `prisma generate`. Aucun code métier ; uniquement ce qui est nécessaire pour générer le client Prisma.
- **Stage 2 — `runner`** : nouvelle image légère ; copie uniquement `node_modules` (et `.prisma`) et le code source depuis `deps`. Exécution sous l’utilisateur non-root `node`. **Bénéfices** : réduction du poids de l’image, pas de devDependencies en prod, surface d’attaque réduite.

**Dockerfile.dev** — [backend/Dockerfile.dev](backend/Dockerfile.dev)

- Une seule stage, orientée développement : `npm ci`, `prisma generate`, copie du code. Utilisée avec Docker Compose et un volume `./backend:/app` pour le hot-reload. Un volume anonyme `/app/node_modules` évite que le montage de l’hôte écrase les `node_modules` du container.

**Isolation des containers**

- Chaque service tourne dans son propre container : **database** (PostgreSQL), **backend** (API Express), **frontend** (Vite en dev ou build Nginx en prod), **nginx** (reverse proxy), **mailpit** (en dev uniquement). Les dépendances entre services sont explicitées via `depends_on` et healthchecks (ex. base prête avant démarrage du backend).

### Reverse proxy Nginx

**Rôle** : point d’entrée unique côté client ; séparation nette entre ports publics et services internes.

| Règle | Cible | Port interne |
|-------|--------|--------------|
| `location /api/` | Backend Express | backend:3000 |
| `location /` | Frontend (SPA ou dev server) | frontend:5173 (dev) ou 80 (prod) |

- **Sécurité** : les ports du backend et de la base ne sont pas exposés directement sur l’hôte (sauf optionnel en dev pour debug). Headers ajoutés : `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`.
- **Routage** : en dev, l’utilisateur accède à l’app via `http://localhost:8080` ; Nginx route `/api/*` vers le backend et `/` vers le frontend.

Configuration : [nginx/conf.d/default.conf](nginx/conf.d/default.conf).

**Schéma de flux (ASCII) :**

```
                    ┌─────────────────────────────────────┐
                    │  Client (navigateur)                │
                    │  http://localhost:8080               │
                    └─────────────────┬───────────────────┘
                                      │
                                      ▼
                    ┌─────────────────────────────────────┐
                    │  Nginx (reverse proxy) :80          │
                    │  /api/ → backend  / → frontend      │
                    └──────┬──────────────────┬──────────┘
                           │                  │
              ┌────────────▼──────┐   ┌───────▼────────────┐
              │ Backend :3000     │   │ Frontend :5173     │
              │ (Express, Prisma) │   │ (Vite / build)     │
              └────────────┬──────┘   └───────────────────┘
                           │
              ┌────────────▼──────┐
              │ PostgreSQL :5432  │
              │ (database)        │
              └───────────────────┘
```

### Persistance : volumes pour données et logs

**Volumes nommés** (présents dans [docker-compose.dev.yml](docker-compose.dev.yml) et [docker-compose.yml](docker-compose.yml)) :

| Volume | Montage | Rôle |
|--------|---------|------|
| `postgres_data_dev` / `postgres_data_prod` | `/var/lib/postgresql/data` | Données PostgreSQL persistantes. |
| `backend_logs` | `/app/logs` | Répertoire des logs backend. Le logger ([backend/src/utils/logger.js](backend/src/utils/logger.js)) écrit sur stdout et dans `/app/logs/app.log` si le répertoire existe. En cas de crash ou recréation du container, le volume persiste : les logs ne sont pas perdus. |
| `nginx_logs` | `/var/log/nginx` | Logs d’accès et d’erreur Nginx. |

Le serveur backend crée `/app/logs` au démarrage ([backend/src/server.js](backend/src/server.js)) pour s’assurer que le répertoire existe lorsque le volume est monté.

### Mailpit

- Intégré en **développement** dans `docker-compose.dev.yml` (ports 8025 pour l’interface web, 1025 pour SMTP).
- Permet de tester les flux de notifications ou d’emails sans envoyer de vrais mails (fake SMTP). Conforme au barème (Mailpit en dev).

---

## 4. Sécurité & Contrôle d’accès

### Authentification JWT (sans fallback en production)

- Connexion via `POST /auth/login` (email, mot de passe). Le serveur renvoie un JWT et le profil utilisateur.
- Les routes protégées exigent le header `Authorization: Bearer <token>`.
- **Production** : en l’absence de `JWT_SECRET`, l’application **refuse de démarrer** (`throw new Error('JWT_SECRET est requis en production')` dans [backend/src/config/index.js](backend/src/config/index.js)). Aucun secret par défaut en prod.

### RBAC — Droits en cascade (MANAGER vs EMPLOYEE)

**MANAGER (vue globale équipe)** :

- `GET /users` : liste des utilisateurs de **son équipe** uniquement.
- `POST /users` : création d’un utilisateur (rattaché à l’équipe du manager).
- `GET /users/:id` / `PATCH /users/:id` : accès si l’utilisateur cible appartient à la même équipe (`teamId` du manager).
- `DELETE /users/:id` : suppression uniquement pour un membre de son équipe.
- `GET /clocks`, `GET /stats/*`, `GET /reports` : possibilité de filtrer par `userId` pour un membre de l’équipe.

**EMPLOYEE (vue personnelle)** :

- `GET /users/:id` / `PATCH /users/:id` : uniquement si `id === req.user.id` (soi-même).
- `POST /clocks` : pointage pour soi (l’`userId` est toujours pris du JWT).
- `GET /clocks`, `GET /stats/*`, `GET /reports` : uniquement ses propres données (pas de paramètre `userId` ou vérification côté contrôleur).

Le fichier [backend/src/routes/users.js](backend/src/routes/users.js) documente explicitement le RBAC en en-tête ; la logique détaillée (équipe, soi, manager) est dans [backend/src/controllers/usersController.js](backend/src/controllers/usersController.js).

### Protections XSS, CORS et entrées

- **Helmet** ([backend/src/middlewares/security.js](backend/src/middlewares/security.js)) : en-têtes de sécurité (XSS, etc.), `crossOriginResourcePolicy: same-site`.
- **CORS** : origine restreinte à `FRONTEND_ORIGIN` (pas d’origine `*` en prod), méthodes et en-têtes autorisés explicites (`Content-Type`, `Authorization`). Réduit les risques de requêtes cross-origin non désirées.
- **Validation / sanitization** : express-validator sur les body et query (email, UUID, dates ISO, etc.) pour éviter injections et données malformées. Pas de CSRF token dans le cahier des charges ; CORS + same-site contribuent à la mitigation dans le contexte d’une API consommée par une SPA.

---

## 5. Qualité logicielle & CI/CD

### Pipeline GitHub Actions

Fichier : [.github/workflows/ci.yml](.github/workflows/ci.yml). Déclenché sur push/PR vers `main` et `develop`.

| Job | Rôle | Dépendances | Étapes clés |
|-----|------|-------------|-------------|
| **backend** | Tests et couverture backend | — | Checkout, Node 20, service Postgres (healthcheck), `npm ci`, `prisma generate`, `prisma migrate deploy`, `npm run test`, `npm run test:coverage`, upload artifact `backend-coverage`. |
| **lint** | Qualité de code | — | `npm run lint` backend puis frontend. **Bloquant** : si le lint échoue, le job **docker** ne s’exécute pas. |
| **frontend** | Build et tests frontend | — | `npm ci`, `npm run build`, `npm run test`, `npm run test:coverage`, upload artifact `frontend-coverage`. |
| **docker** | Build des images | `needs: [backend, frontend, lint]` | Build de l’image backend et de l’image frontend (Dockerfile.prod). Aucune étape Docker ne tourne si lint, tests ou build ont échoué. |

**Lint bloquant** : le job `docker` dépend explicitement de `backend`, `frontend` et `lint`. Une erreur ESLint sur le backend ou le frontend fait échouer le pipeline et empêche le build Docker, conformément au barème.

### Tests et couverture (> 60 % sur routes critiques)

- **Backend** : tests dans `backend/tests/` — health, auth, **clocks**, **stats**. Les tests clocks et stats utilisent une vraie base (skip si `!process.env.DATABASE_URL` ; en CI, `DATABASE_URL` est défini et les tests s’exécutent). Couverture via `node --test --experimental-test-coverage` ; objectif > 60 % sur les routes critiques (stats, clocks), conforme à CONFORMITE.md.
- **Frontend** : tests Vitest, couverture avec artifact upload. Les scénarios critiques (auth, app) sont couverts pour renforcer la non-régression.

### ESLint et maintenabilité

- Configurations dédiées : [backend/.eslintrc.cjs](backend/.eslintrc.cjs), [frontend/.eslintrc.cjs](frontend/.eslintrc.cjs). Cibles : `src` (et `tests` pour le backend).
- Rôle : style de code homogène, détection d’erreurs courantes, meilleure maintenabilité sur le long terme. Intégré en CI comme condition de succès du pipeline.

---

## 6. Démonstration fonctionnelle

### Dashboard et KPIs

- **Taux de retard** : calcul côté backend (pointage après 9h00 = retard) ; affiché sous forme de KPI et de graphique (ex. camembert Recharts : à l’heure / en retard).
- **Moyenne d’heures** : moyenne d’heures travaillées par jour (et par semaine) ; courbe (AreaChart) des heures par jour selon la période.
- **Sélecteur de période** : 7 derniers jours ou mois ; un changement de période déclenche un refetch des stats et la mise à jour des graphiques.

### Système de pointage en temps réel

- Boutons « Pointer à l’entrée » et « Pointer à la sortie » (POST `/clocks` avec `action: "clock_in"` ou `"clock_out"`).
- Règle métier : un seul pointage ouvert par utilisateur ; impossible de faire un nouveau `clock_in` sans avoir fait un `clock_out` sur la session ouverte. Affichage de l’état (pointé / non pointé) et rafraîchissement après chaque action.
- Historique des pointages (liste des sessions avec `clock_in` / `clock_out`) pour la période demandée.

### Gestion d’équipe (Manager)

- Liste des membres de l’équipe (GET `/users`).
- **Ajouter un membre** : modale avec formulaire branché sur `POST /users` (email, mot de passe, prénom, nom, rôle).
- **Éditer un membre** : modale pré-remplie, envoi des modifications via `PATCH /users/:id`.
- **Changement de mot de passe** : formulaire dédié (ex. profil) branché sur `PATCH /auth/me/password` (ou équivalent selon l’API exposée).
- **Accessibilité** : aria-label sur les boutons icônes, labels et `htmlFor` sur les champs de formulaire, conformément au barème (CONFORMITE.md).

---

## 7. Préparation aux questions techniques (FAQ)

Réponses types alignées sur le barème et l’architecture du projet.

---

### Question Ops : « Comment assurez-vous que les logs ne sont pas perdus si le container crash ? »

**Réponse type :**

Les logs backend sont écrits dans un **volume nommé Docker** `backend_logs`, monté sur le chemin `/app/logs` dans le container. Le logger ([backend/src/utils/logger.js](backend/src/utils/logger.js)) écrit chaque ligne à la fois sur stdout et dans le fichier `/app/logs/app.log`. Ce fichier réside donc sur le volume, pas dans la couche éphémère du container. En cas de crash ou de recréation du container, le volume reste attaché au projet ; au prochain démarrage, le même volume est réutilisé et l’application continue d’écrire dans le même fichier. Les logs restent donc disponibles pour l’analyse post-incident.

La même logique s’applique aux logs Nginx : le volume `nginx_logs` est monté sur `/var/log/nginx`, ce qui persiste les journaux d’accès et d’erreur même si le container Nginx est recréé. Les deux volumes (`backend_logs` et `nginx_logs`) sont déclarés dans les deux compose (dev et prod), conformément au cahier des charges.

---

### Question Backend : « Comment gérez-vous le cas où un employé tente de modifier son temps de travail via l’API ? »

**Réponse type :**

L’API **n’expose aucune route** permettant de modifier a posteriori les horaires d’un pointage (pas de PATCH ni PUT sur `/clocks`). Seules deux actions sont possibles :

1. **clock_in** : création d’un nouvel enregistrement avec `clock_in` fixé à l’heure serveur au moment de la requête.
2. **clock_out** : mise à jour du **seul** pointage ouvert (celui dont `clock_out` est null) avec `clock_out` fixé à l’heure serveur.

L’identifiant utilisateur est **toujours** dérivé du JWT (`req.user.id`) : un employé ne peut pas pointer pour un autre, ni envoyer d’horaires personnalisés. Les champs `clock_in` et `clock_out` sont donc exclusivement définis côté serveur à l’instant de l’appel, ce qui garantit l’intégrité des temps travaillés et empêche toute falsification par le client. La règle métier « un seul pointage ouvert à la fois » est assurée dans le service ([backend/src/services/clockService.js](backend/src/services/clockService.js)) avant toute création ou mise à jour.

---

### Question Frontend : « Comment avez-vous optimisé le rendu des graphiques Recharts lors d’un changement de période ? »

**Réponse type :**

Trois leviers ont été mis en place :

1. **Refetch ciblé** : la période affichée (7 jours ou mois) est stockée dans un state `period`. Un `useEffect` dépendant de `period` appelle une fonction `loadStats(period)` qui calcule les bornes `from` / `to` (via `getDateRangeForPeriod` dans [frontend/src/services/api.js](frontend/src/services/api.js)) et lance en parallèle les appels API (taux de retard et moyenne d’heures). On ne refetch pas à chaque rendu, uniquement lorsque l’utilisateur change de période.

2. **Mise à jour unique du state** : les réponses API alimentent les states des graphiques (ex. `lateData`, `workHoursData`). Un seul re-render est déclenché avec les nouvelles données ; Recharts reçoit des props à jour sans recalcul inutile à chaque frame.

3. **Remount propre (optionnel)** : en donnant une `key` basée sur la période (ex. `key={period}`) au conteneur des graphiques, on force un remount du composant Recharts lors du changement de période. Cela évite les artefacts d’animation ou les états intermédiaires quand les séries de données changent fortement (7 points vs ~30 points pour le mois).

---

## Conformité au cahier des charges

Le tableau suivant récapitule la conformité aux critères du barème (réf. [CONFORMITE.md](CONFORMITE.md)) :

| Domaine   | Critère                                                         | Statut    |
|-----------|------------------------------------------------------------------|-----------|
| Infra     | Volumes DB + logs (backend_logs, nginx_logs)                    | CONFORME  |
| Infra     | Mailpit en dev (docker-compose.dev.yml)                         | CONFORME  |
| Infra     | Dockerfile.dev backend + .env.example + .gitignore               | CONFORME  |
| Sécurité  | JWT sans fallback en prod (config/index.js)                    | CONFORME  |
| Sécurité  | RBAC (EMPLOYEE/MANAGER) — commentaire routes users              | CONFORME  |
| API       | Route /api/reports (lateRate + avgHours)                        | CONFORME  |
| Frontend  | Boutons Ajouter / Éditer / Mot de passe branchés API           | CONFORME  |
| Frontend  | Accessibilité (aria-label, labels, htmlFor)                     | CONFORME  |
| Doc       | README (React 18, Recharts)                                    | CONFORME  |
| CI/CD     | ESLint backend + frontend, job lint, pipeline échoue si lint KO | CONFORME  |
| CI/CD     | Tests clocks + stats, couverture (CI avec BDD > 60 %)            | CONFORME  |

Ce document sert de fil conducteur pour la soutenance : chaque section peut être développée à l’oral avec les démonstrations et les références aux fichiers du dépôt.
