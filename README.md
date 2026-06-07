# PadelScore

Mexicano padel tournament tracker with live leaderboards, random pair generation, and global player statistics.

## Features

- **Tournament management** — create and run Mexicano format tournaments
- **4 players per tournament** — registered users or guest names
- **Random pair generation** — each round draws new pairs from all 3 possible 2v2 combinations
- **Scoring** — enter results that always sum to 21 (e.g. 11–10, 8–13)
- **Live leaderboard** — points, wins, and losses tracked per round
- **Final standings** — 1st–4th place with winner announcement
- **Global stats** — registered players accumulate cross-tournament totals
- **Authentication** — email/password registration and login
- **Admin panel** — full control over all tournaments, scores, and users

## Tech stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router, standalone output) |
| Language | TypeScript 5 |
| Styling | Tailwind CSS v4 |
| Database | PostgreSQL 16 |
| ORM | Drizzle ORM |
| Auth | NextAuth.js v5 (JWT, Credentials provider) |
| Forms | React Hook Form + Zod |
| UI primitives | Radix UI |
| Tests | Vitest — integration tests against real PostgreSQL |
| Container | Docker (multi-stage, Node 22 Alpine) |
| CI/CD | GitHub Actions → GHCR |

---

## Local development

### Prerequisites

- Node.js 22+
- A running PostgreSQL 16 instance (see below)

### 1. Start PostgreSQL

```bash
docker run -d \
  --name padelscore-db \
  -e POSTGRES_DB=padelscore \
  -e POSTGRES_USER=padel \
  -e POSTGRES_PASSWORD=password \
  -p 5432:5432 \
  postgres:16-alpine
```

Or use any existing PostgreSQL instance — just update `DATABASE_URL` below.

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment

Create `.env.local` in the project root:

```env
DATABASE_URL=postgresql://padel:password@localhost:5432/padelscore
AUTH_SECRET=<run: openssl rand -base64 32>
NEXTAUTH_URL=http://localhost:3000
ADMIN_EMAIL=you@example.com
```

`ADMIN_EMAIL` — the first account registered with this address gets admin rights automatically.

### 4. Apply database migrations

```bash
npm run db:migrate
```

Migrations live in `drizzle/` and are also applied automatically on container startup.

### 5. Start the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Running tests

Tests run against a **real PostgreSQL database** — no mocks. Point `DATABASE_URL` at a dedicated test database (it will be truncated between tests):

```bash
# Create a test database first (one-time)
createdb padelscore_test   # or via psql / docker exec

DATABASE_URL=postgresql://padel:password@localhost:5432/padelscore_test npm test
```

In CI, GitHub Actions provisions a `postgres:16-alpine` service container automatically — no setup needed.

---

## Docker

### Option A — Docker Compose (app + postgres, recommended)

`docker-compose.yml` starts a PostgreSQL container alongside the app. Before running, open it and change the three placeholder values:

```yaml
# docker-compose.yml — values to change before first run
POSTGRES_PASSWORD: "change-me"           # under db → environment
DATABASE_URL: "postgresql://padel:change-me@db:5432/padelscore"
AUTH_SECRET:  "change-me-before-production"   # generate: openssl rand -base64 32
ADMIN_EMAIL:  "admin@example.com"
```

Then:

```bash
# Build the image locally and start everything
docker compose up --build

# Or pull the published image from GHCR (comment out 'build:', uncomment 'image:' in docker-compose.yml)
docker compose up
```

Postgres data persists in the `postgres-data` named volume. Migrations run automatically on every app start.

### Option B — App only (external postgres)

```bash
docker build -t padelscore .

docker run -p 3000:3000 \
  -e DATABASE_URL=postgresql://user:password@host:5432/padelscore \
  -e AUTH_SECRET=$(openssl rand -base64 32) \
  -e ADMIN_EMAIL=admin@example.com \
  padelscore
```

### Option C — Pull from GHCR

```bash
docker pull ghcr.io/meloos/padelscore:latest
# or a specific version:
docker pull ghcr.io/meloos/padelscore:1.0.0

docker run -p 3000:3000 \
  -e DATABASE_URL=postgresql://user:password@host:5432/padelscore \
  -e AUTH_SECRET=$(openssl rand -base64 32) \
  -e ADMIN_EMAIL=admin@example.com \
  ghcr.io/meloos/padelscore:1.0.0
```

---

## CI/CD and published images

The workflow at `.github/workflows/docker-publish.yml` runs on every push and pull request:

| Trigger | Tests | Image pushed |
|---|---|---|
| Pull request → `main` | ✓ | — (build only) |
| Push to `main` | ✓ | `latest`, `sha-<short>` |
| Tag `v*.*.*` | ✓ | `1.0.0`, `1.0`, `latest`, `sha-<short>` |

No extra repository secrets are needed — the workflow uses the built-in `GITHUB_TOKEN` with `packages: write` permission.

**Image registry:** `ghcr.io/meloos/padelscore`

---

## Admin panel

An admin account can:

- View **all** tournaments across all users
- Edit any tournament name or toggle its status (active ↔ completed)
- Delete any tournament (cascades rounds and scores)
- Re-edit any completed round's score
- Promote/demote users to admin, delete accounts

### Granting admin access

Set `ADMIN_EMAIL` — the first registration with that address gets admin automatically. Or promote any existing user in the **Admin → Users** panel.

The admin panel is at `/admin` — only visible in the navbar for admin accounts.

---

## How to run a tournament

1. Register at `/auth/register`
2. Click **New tournament** on the dashboard
3. Name the tournament and add 4 players (registered users or guest names)
4. Round 1 starts automatically with random pairs
5. Enter the score (must sum to 21) and click **Save Score**
6. Click **Start round N** to draw new pairs for the next round
7. Click **End tournament** to lock final standings
8. Final placements (1st–4th) are displayed with points, wins, and losses

## Mexicano format

- Each game is played to 21 points total (e.g. 11–10, 7–14, 5–16)
- Points scored = your team's score in that match
- Ranking: most points first; wins as tiebreaker
- Pairs rotate through the 3 possible 2v2 combinations of 4 players

---

## Available scripts

| Script | Description |
|---|---|
| `npm run dev` | Start development server (with Turbopack) |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm test` | Run test suite (requires `DATABASE_URL`) |
| `npm run test:watch` | Run tests in watch mode |
| `npm run db:generate` | Generate Drizzle migration files from schema |
| `npm run db:migrate` | Apply pending migrations |
| `npm run db:studio` | Open Drizzle Studio (visual DB browser) |

---

## Project structure

```
src/
├── app/
│   ├── (dashboard)/            # Protected pages — Navbar layout
│   │   ├── dashboard/          # Tournament list + stats
│   │   ├── tournaments/
│   │   │   ├── new/            # Create tournament form
│   │   │   └── [id]/           # Tournament detail, rounds, scoring
│   │   └── players/            # Global player rankings
│   ├── admin/                  # Admin-only pages (all tournaments, users)
│   ├── auth/
│   │   ├── login/
│   │   └── register/
│   ├── api/
│   │   ├── auth/               # NextAuth.js handler
│   │   ├── register/           # User registration endpoint
│   │   ├── tournaments/        # Tournament CRUD + rounds + scoring
│   │   ├── players/            # Global stats endpoint
│   │   └── admin/              # Admin-only API routes
│   ├── layout.tsx
│   └── page.tsx                # Landing page
├── components/
│   ├── ui/                     # Button, Card, Input, Badge, Toast…
│   ├── tournament/             # Leaderboard, MatchCard, ScoreForm, AdminScoreEdit
│   └── layout/                 # Navbar
├── lib/
│   ├── db/
│   │   ├── schema.ts           # Drizzle schema — 6 tables
│   │   ├── index.ts            # pg Pool + drizzle instance
│   │   └── migrate.ts          # CLI migration runner
│   ├── auth.ts                 # NextAuth full config (DB-aware)
│   ├── admin-guard.ts          # Server-side admin check helper
│   └── utils.ts                # cn(), generatePairings(), formatDate()
├── auth.config.ts              # Edge-safe auth config (no DB imports)
├── proxy.ts                    # Route protection (Next.js 16 middleware)
├── instrumentation.ts          # Auto-run migrations on startup
└── types/
    └── next-auth.d.ts          # Session type augmentation
tests/
├── global-setup.ts             # Run migrations once before all test files
├── setup.ts                    # TRUNCATE all tables between tests
├── helpers.ts                  # Factory functions for test data
├── lib/
│   └── utils.test.ts           # Unit tests: generatePairings, formatDate, getOrdinal
└── db/
    ├── users.test.ts           # Integration: users, player_stats, constraints
    └── tournaments.test.ts     # Integration: tournaments, rounds, matches, scoring
```
