# FitRoam

Fitness discovery for travellers. Find gyms on the go — filtered to your training style, budget, and stay length.

## Project status

Alpha — in active development.

## Structure

This is a monorepo managed with [Turborepo](https://turbo.build).

| Package | Description |
|---------|-------------|
| `packages/api` | Node.js + Express REST API |
| `packages/mobile` | React Native + Expo mobile app |

## Documentation

| Document | Description |
|----------|-------------|
| [PRD](docs/PRD.md) | Product requirements and feature spec |
| [Architecture](docs/ARCHITECTURE.md) | System design and technical decisions |
| [Database](docs/DATABASE.md) | Schema, ERDs, and Prisma setup |
| [ADRs](docs/adr/) | Architecture decision records |

## Local setup

### Prerequisites
- Node.js v20+
- PostgreSQL 15 with PostGIS (or a Supabase project)
- Redis (or an Upstash account)

### Install dependencies
\`\`\`bash
npm install
\`\`\`

### Configure environment
\`\`\`bash
cp packages/api/.env.example packages/api/.env
# Fill in your keys
\`\`\`

### Run database migrations
\`\`\`bash
cd packages/api
npm run db:migrate
npm run db:generate
\`\`\`

### Start development servers
\`\`\`bash
npm run dev        # starts both API and mobile from root
\`\`\`

## Branch strategy

| Branch | Purpose |
|--------|---------|
| `main` | Stable, always deployable |
| `dev` | Integration branch — PRs merge here first |
| `feature/*` | Individual features |
| `fix/*` | Bug fixes |

## Commit convention

\`\`\`
feat: add gym match score endpoint
fix: correct PostGIS distance calculation
docs: update architecture diagram
chore: upgrade prisma to v5.1
\`\`\`
