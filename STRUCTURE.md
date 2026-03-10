# Time Manager — Structure du projet

```
timetable/
├── .github/
│   └── workflows/
│       └── ci.yml                    # Pipeline GitHub Actions (Build, Tests, Coverage)
├── docs/
│   └── DB_SCHEMA.md                  # Schéma BDD (Users, Teams, Clocks)
├── backend/                          # API Node.js + Express + Prisma
│   ├── prisma/
│   │   ├── schema.prisma
│   │   ├── seed.js
│   │   └── migrations/
│   ├── src/
│   │   ├── config/ (database.js, index.js)
│   │   ├── controllers/ (auth, users, teams, clocks, stats)
│   │   ├── middlewares/ (auth, authorize, security, validate)
│   │   ├── routes/ (auth, users, teams, clocks, stats, index)
│   │   ├── services/ (user, team, clock, stats)
│   │   ├── app.js
│   │   └── server.js
│   ├── tests/ (health.test.js, auth.test.js)
│   ├── Dockerfile (multi-stage)
│   ├── package.json
│   └── .env.example
├── frontend/                         # Vue 3 (Composition API) + Vite + Tailwind
│   ├── src/
│   │   ├── api/ (client, auth, users, teams, clocks, stats)
│   │   ├── assets/ (main.css)
│   │   ├── components/ (Layout, ChartLateRate, ChartAvgHours)
│   │   ├── views/ (Login, Dashboard, Clocks, Team)
│   │   ├── router/
│   │   ├── stores/ (auth)
│   │   ├── App.vue
│   │   └── main.js
│   ├── Dockerfile + Dockerfile.prod
│   ├── nginx.conf (prod SPA)
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.js
├── nginx/
│   └── conf.d/
│       └── default.conf              # Reverse proxy (API + SPA) + headers sécurité
├── docker-compose.yml                # Compose PROD (à finaliser)
├── docker-compose.dev.yml            # Compose DEV (PostgreSQL, backend, frontend, nginx)
├── .env.example
├── .gitignore
└── README.md
```
