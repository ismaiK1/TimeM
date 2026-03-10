# Schéma de la base de données — Time Manager

## Vue d'ensemble

- **Users** : employés et managers (authentification JWT, rôles).
- **Teams** : équipes ; chaque équipe a un manager et des membres.
- **Clocks** : pointages (entrée/sortie) par utilisateur.

## Relations

| Relation | Cardinalité | Description |
|----------|-------------|-------------|
| User → Team | N → 1 | Un utilisateur appartient à une équipe. |
| Team → Manager (User) | 1 → 1 | Une équipe a un seul manager. |
| Team → Members (User) | 1 → N | Une équipe a plusieurs membres. |
| User → Clocks | 1 → N | Un utilisateur a plusieurs pointages. |

---

## Tables (snake_case)

### 1. `users`

| Colonne | Type | Contraintes | Description |
|---------|------|-------------|-------------|
| `id` | UUID | PK, default gen_random_uuid() | Identifiant unique. |
| `email` | VARCHAR(255) | UNIQUE, NOT NULL | Login / email. |
| `password_hash` | VARCHAR(255) | NOT NULL | Mot de passe hashé (bcrypt). |
| `first_name` | VARCHAR(100) | NOT NULL | Prénom. |
| `last_name` | VARCHAR(100) | NOT NULL | Nom. |
| `role` | ENUM | NOT NULL | `'employee'` \| `'manager'`. |
| `team_id` | UUID | FK → teams(id), nullable | Équipe de l’utilisateur. |
| `created_at` | TIMESTAMPTZ | NOT NULL, default now() | Création. |
| `updated_at` | TIMESTAMPTZ | NOT NULL, default now() | Dernière mise à jour. |

- Un **manager** peut avoir `team_id` = l’équipe qu’il gère (ou être désigné via `teams.manager_id`).
- Un **employee** doit avoir un `team_id` non null.

---

### 2. `teams`

| Colonne | Type | Contraintes | Description |
|---------|------|-------------|-------------|
| `id` | UUID | PK, default gen_random_uuid() | Identifiant unique. |
| `name` | VARCHAR(150) | NOT NULL | Nom de l’équipe. |
| `manager_id` | UUID | FK → users(id), UNIQUE, nullable | Manager de l’équipe (1 manager = 1 équipe). |
| `created_at` | TIMESTAMPTZ | NOT NULL, default now() | Création. |
| `updated_at` | TIMESTAMPTZ | NOT NULL, default now() | Dernière mise à jour. |

- `manager_id` UNIQUE garantit qu’un manager ne gère qu’une seule équipe.

---

### 3. `clocks`

| Colonne | Type | Contraintes | Description |
|---------|------|-------------|-------------|
| `id` | UUID | PK, default gen_random_uuid() | Identifiant unique. |
| `user_id` | UUID | FK → users(id), NOT NULL | Utilisateur qui pointe. |
| `clock_in` | TIMESTAMPTZ | NOT NULL | Heure d’entrée. |
| `clock_out` | TIMESTAMPTZ | nullable | Heure de sortie (null = encore en poste). |
| `created_at` | TIMESTAMPTZ | NOT NULL, default now() | Création. |
| `updated_at` | TIMESTAMPTZ | NOT NULL, default now() | Dernière mise à jour. |

- Contrainte métier : `clock_out` doit être > `clock_in` si renseigné.
- Contrainte métier : un utilisateur ne peut avoir qu’**un seul** enregistrement avec `clock_out` null (session ouverte).

---

## Diagramme relationnel (texte)

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

---

## Règles métier résumées

1. **Rôles** : `employee` (pointe et consulte ses pointages), `manager` (consulte les pointages de son équipe, gestion équipe).
2. **Équipe** : chaque employé a une `team_id` ; chaque équipe a un `manager_id` optionnel.
3. **Pointages** : un `clock` = une entrée (`clock_in`) et optionnellement une sortie (`clock_out`). Une seule session ouverte par utilisateur à la fois.

Ce schéma peut servir de base pour les migrations Sequelize/Prisma et la validation côté API.
