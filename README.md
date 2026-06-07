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
- **SQLite by default** — drop-in PostgreSQL support via Drizzle ORM

## Tech stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 |
| Database ORM | Drizzle ORM |
| Database | SQLite (better-sqlite3) |
| Auth | NextAuth.js v5 (JWT) |
| Forms | React Hook Form + Zod |
| UI | Custom components on Radix UI primitives |

## Getting started

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

Copy `.env.local` and set your secret:

```bash
cp .env.local .env.local
```

```env
DATABASE_URL=./local.db
AUTH_SECRET=your-32-char-secret-here
NEXTAUTH_URL=http://localhost:3000
```

Generate a strong secret: `openssl rand -base64 32`

### 3. Generate and run migrations

```bash
npm run db:generate   # generates SQL migration files
npm run db:migrate    # applies migrations to local.db
```

### 4. Start dev server

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

## Database

Default: SQLite at `./local.db`.

### Switch to PostgreSQL

Five files need to change. Apply all of them, then regenerate migrations.

**1. Install the PostgreSQL driver:**

```bash
npm install pg
npm install -D @types/pg
```

**2. `drizzle.config.ts` — change dialect to postgresql:**

```ts
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/lib/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
```

**3. `src/lib/db/index.ts` — replace the SQLite connection:**

```ts
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
export const db = drizzle(pool, { schema });

export { schema };
```

**4. `src/instrumentation.ts` — use the postgres migrator:**

```ts
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { migrate } = await import("drizzle-orm/node-postgres/migrator");
    const { db } = await import("@/lib/db");
    const path = await import("path");

    await migrate(db, {
      migrationsFolder: path.join(process.cwd(), "drizzle"),
    });

    console.log("[startup] Database migrations applied");
  }
}
```

**5. `next.config.ts` — swap the external package:**

```ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  serverExternalPackages: ["pg", "pg-native"],
};

export default nextConfig;
```

**6. Regenerate migrations for PostgreSQL:**

```bash
DATABASE_URL=postgresql://user:password@host:5432/dbname npm run db:generate
```

> The existing SQLite migration files in `drizzle/` are incompatible with PostgreSQL.
> Delete them and regenerate: `rm -rf drizzle/ && npm run db:generate`

**`DATABASE_URL` format:**

```
postgresql://USER:PASSWORD@HOST:5432/DATABASE_NAME
```

Example: `postgresql://padel:secret@localhost:5432/padelscore`

### Docker Compose with PostgreSQL

A `docker-compose.postgres.yml` is provided for running the app with a managed PostgreSQL container:

```bash
docker compose -f docker-compose.postgres.yml up --build
```

Set `AUTH_SECRET`, `POSTGRES_PASSWORD`, and `ADMIN_EMAIL` in the file (or via environment) before starting. Migrations run automatically on container startup.

## Docker

A `docker-compose.yml` is included. By default it builds locally; swap the `build`/`image` lines to pull from GHCR instead.

```bash
# Build and run locally
docker compose up --build

# Pull from GHCR and run (edit docker-compose.yml to use 'image:' line)
docker compose up
```

Set `AUTH_SECRET` and `ADMIN_EMAIL` in `docker-compose.yml` before starting. The SQLite database is stored in the `padelscore-data` named volume and migrations run automatically on every container start.

### Manual docker run

```bash
docker build -t padelscore .
docker run -p 3000:3000 \
  -v padelscore-data:/app/data \
  -e AUTH_SECRET=$(openssl rand -base64 32) \
  -e ADMIN_EMAIL=admin@example.com \
  padelscore
```

## GHCR / GitHub Actions CI-CD

The workflow at `.github/workflows/docker-publish.yml`:
- **PRs** to `main` — builds the image (no push) to catch errors early
- **Push to `main`** — builds and pushes two tags to GHCR: `latest` and the commit SHA

No extra secrets needed — the workflow uses the built-in `GITHUB_TOKEN` with `packages: write` permission.

The image is published at: `ghcr.io/meloos/padelscore`

```bash
# Pull and run the published image
docker pull ghcr.io/meloos/padelscore:latest
docker run -p 3000:3000 \
  -v padelscore-data:/app/data \
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
│   │   ├── index.ts         # DB connection
│   │   └── migrate.ts       # Migration runner
│   ├── auth.ts              # NextAuth configuration
│   └── utils.ts             # cn(), generatePairings(), formatDate()
├── auth.config.ts           # Edge-safe auth config (used by proxy)
├── proxy.ts                 # Route protection
└── types/
    └── next-auth.d.ts       # NextAuth session type augmentation
```
