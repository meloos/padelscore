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

## Tech stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 |
| Database ORM | Drizzle ORM |
| Database | PostgreSQL (pg) |
| Auth | NextAuth.js v5 (JWT) |
| Forms | React Hook Form + Zod |
| UI | Custom components on Radix UI primitives |
| Tests | Vitest (integration tests against real PostgreSQL) |

## Getting started

### 1. Install dependencies

```bash
npm install
```

### 2. Start a local PostgreSQL instance

```bash
# With Docker (quickest):
docker run -d \
  --name padelscore-db \
  -e POSTGRES_DB=padelscore \
  -e POSTGRES_USER=padel \
  -e POSTGRES_PASSWORD=password \
  -p 5432:5432 \
  postgres:16-alpine
```

### 3. Configure environment

Edit `.env.local`:

```env
DATABASE_URL=postgresql://padel:password@localhost:5432/padelscore
AUTH_SECRET=your-32-char-secret-here
NEXTAUTH_URL=http://localhost:3000
ADMIN_EMAIL=admin@example.com
```

Generate a strong secret: `openssl rand -base64 32`

### 4. Run migrations

```bash
npm run db:migrate
```

### 5. Start dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## How to run a tournament

1. **Register** an account (at `/auth/register`)
2. Click **New tournament** on the dashboard
3. Name the tournament and add 4 players — link registered accounts or type guest names
4. Round 1 starts automatically with random pairs
5. Play the match, enter the score (must sum to 21), and click **Save Score**
6. Click **Start round N** to draw new random pairs and repeat
7. When done, click **End tournament** to lock in final standings
8. Final placements (1st–4th) are shown with points, wins, and losses

## Mexicano scoring

- Each game is played to 21 points total (e.g. 11–10, 7–14, 5–16)
- The score each player receives = their team's points in that game
- Points accumulate across rounds
- Ranking: most points first, with wins as tiebreaker
- Random pairing rotates through the 3 possible 2v2 combinations

## Tests

Tests run against a real PostgreSQL database (no mocks). The test suite includes unit tests for utility functions and integration tests for the database layer.

```bash
# Requires DATABASE_URL pointing at a test database
DATABASE_URL=postgresql://padel:password@localhost:5432/padelscore_test npm test
```

In CI, GitHub Actions spins up a `postgres:16-alpine` service container automatically.

## Docker

A `docker-compose.yml` is included. It starts PostgreSQL alongside the app. By default it builds locally; swap the `build`/`image` lines to pull from GHCR instead.

```bash
# Build and run locally (with postgres)
docker compose up --build

# Pull from GHCR and run (edit docker-compose.yml to use 'image:' line)
docker compose up
```

Edit `docker-compose.yml` to set `POSTGRES_PASSWORD`, `AUTH_SECRET`, and `ADMIN_EMAIL` before starting. Migrations run automatically on every container start.

### Manual docker run (external postgres)

```bash
docker build -t padelscore .
docker run -p 3000:3000 \
  -e DATABASE_URL=postgresql://user:password@host:5432/padelscore \
  -e AUTH_SECRET=$(openssl rand -base64 32) \
  -e ADMIN_EMAIL=admin@example.com \
  padelscore
```

## GHCR / GitHub Actions CI-CD

The workflow at `.github/workflows/docker-publish.yml`:
1. **Test** — spins up `postgres:16-alpine` and runs the full test suite
2. **Build** — builds the Docker image (runs on both PRs and pushes; PRs skip the push)
3. **Push** — on merge to `main`, pushes two tags to GHCR: `latest` and the commit SHA

No extra secrets needed — the workflow uses the built-in `GITHUB_TOKEN` with `packages: write` permission.

The image is published at: `ghcr.io/meloos/padelscore`

```bash
# Pull and run the published image
docker pull ghcr.io/meloos/padelscore:latest
docker run -p 3000:3000 \
  -e DATABASE_URL=postgresql://user:password@host:5432/padelscore \
  -e AUTH_SECRET=$(openssl rand -base64 32) \
  -e ADMIN_EMAIL=admin@example.com \
  ghcr.io/meloos/padelscore:latest
```

## Admin

An admin account can:

- See **all** tournaments across all users
- Edit any tournament name or status (active ↔ completed) — click the status badge to toggle
- Delete any tournament (including all its rounds and scores)
- Edit **any completed round score** — an "Edit score" link appears under each completed round for admins
- Manage users — promote/demote admins, delete accounts

### Granting admin access

Set `ADMIN_EMAIL` in `.env.local` to automatically grant admin on registration:

```env
ADMIN_EMAIL=you@example.com
```

Alternatively, promote an existing user in the **Admin → Users** panel by clicking **Make admin**.

The admin panel is at `/admin` and is only visible in the navbar for admin users.

## Available scripts

| Script | Description |
|---|---|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm test` | Run test suite (requires `DATABASE_URL`) |
| `npm run test:watch` | Run tests in watch mode |
| `npm run db:generate` | Generate Drizzle migration files |
| `npm run db:migrate` | Apply migrations to database |
| `npm run db:studio` | Open Drizzle Studio (visual DB browser) |

## Project structure

```
src/
├── app/
│   ├── (dashboard)/         # Protected pages (Navbar layout)
│   │   ├── dashboard/       # Tournament list overview
│   │   ├── tournaments/
│   │   │   ├── new/         # Create tournament form
│   │   │   └── [id]/        # Tournament detail + round management
│   │   └── players/         # Global player rankings
│   ├── auth/
│   │   ├── login/           # Login page
│   │   └── register/        # Registration page
│   ├── api/
│   │   ├── auth/            # NextAuth handler
│   │   ├── register/        # User registration
│   │   ├── tournaments/     # Tournament CRUD + round/score endpoints
│   │   └── players/         # Global player stats
│   ├── layout.tsx           # Root layout
│   └── page.tsx             # Landing page
├── components/
│   ├── ui/                  # Base UI components (Button, Card, Input…)
│   ├── tournament/          # Leaderboard, MatchCard, ScoreForm
│   └── layout/              # Navbar
├── lib/
│   ├── db/
│   │   ├── schema.ts        # Drizzle schema (users, tournaments, rounds…)
│   │   ├── index.ts         # DB connection (pg Pool)
│   │   └── migrate.ts       # Migration runner
│   ├── auth.ts              # NextAuth configuration
│   └── utils.ts             # cn(), generatePairings(), formatDate()
├── auth.config.ts           # Edge-safe auth config (used by proxy)
├── proxy.ts                 # Route protection
└── types/
    └── next-auth.d.ts       # NextAuth session type augmentation
tests/
├── global-setup.ts          # Runs migrations once before all tests
├── setup.ts                 # Truncates tables between tests
├── helpers.ts               # Test data factories
├── lib/
│   └── utils.test.ts        # Unit tests for utility functions
└── db/
    ├── users.test.ts        # User and player_stats integration tests
    └── tournaments.test.ts  # Tournament, round, match integration tests
```
