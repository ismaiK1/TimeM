# Récapitulatif de conformité — Barème Epitech 100 %

Toutes les actions correctives du plan ont été implémentées. Tableau de conformité :

| Domaine   | Critère                                                         | Statut    |
|-----------|------------------------------------------------------------------|-----------|
| Infra     | Volumes DB + logs (backend_logs, nginx_logs)                    | CONFORME  |
| Infra     | Mailpit en dev (docker-compose.dev.yml)                         | CONFORME  |
| Infra     | Dockerfile.dev backend + .env.example + .gitignore              | CONFORME  |
| Sécurité  | JWT sans fallback en prod (config/index.js)                     | CONFORME  |
| Sécurité  | RBAC (EMPLOYEE/MANAGER) — commentaire routes users              | CONFORME  |
| API       | Route /api/reports (lateRate + avgHours)                        | CONFORME  |
| Frontend  | Boutons Ajouter / Éditer / Mot de passe branchés API             | CONFORME  |
| Frontend  | Accessibilité (aria-label, labels, htmlFor)                     | CONFORME  |
| Doc       | README (React 18, Recharts)                                     | CONFORME  |
| CI/CD     | ESLint backend + frontend, job lint, pipeline échoue si lint KO  | CONFORME  |
| CI/CD     | Tests clocks + stats, couverture (CI avec BDD > 60 %)             | CONFORME  |

## Détail des livrables

- **Étape 1** : Volumes `backend_logs` et `nginx_logs` dans les deux compose ; logger backend vers `/app/logs` ; service Mailpit (ports 8025, 1025) ; `backend/Dockerfile.dev` ; `.env.example` à la racine ; `.gitignore` complété.
- **Étape 2** : `JWT_SECRET` obligatoire en prod (throw si absent) ; route `GET /api/reports` (agrégat late-rate + avg-hours) ; commentaire RBAC dans `users.js`.
- **Étape 3** : Modale « Ajouter membre » (POST /users) ; modale « Éditer » (PATCH /users/:id) ; formulaire mot de passe (PATCH /auth/me/password) ; aria-label sur boutons icônes ; README corrigé (React, Recharts).
- **Étape 4** : ESLint backend (.eslintrc.cjs) et frontend ; job `lint` dans CI avec `needs: [backend, frontend, lint]` pour docker ; tests `clocks.test.js` et `stats.test.js` (dont tests avec auth en CI).
