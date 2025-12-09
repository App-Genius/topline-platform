# Topline

A behavior-driven business optimization platform built on the 4DX framework. Connects daily team member behaviors (lead measures) to business outcomes (lag measures).

## Quick Start

### Prerequisites

- Node.js 20+
- Docker (for PostgreSQL)
- npm 10+

### 1. Clone and Install

```bash
git clone <repo-url>
cd topline
npm install
```

### 2. Set Up Environment

```bash
# Copy environment template
cp .env.example .env

# The defaults work for local development:
# DATABASE_URL="postgresql://topline:topline_dev@localhost:5432/topline"
# JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"
# PORT=8787
# NEXT_PUBLIC_API_URL="http://localhost:8787"
```

### 3. Start Database

```bash
# Start PostgreSQL in Docker
docker-compose up -d

# Verify it's running
docker ps
# Should show: topline-db running on port 5432
```

### 4. Set Up Database Schema

```bash
# Generate Prisma client
npm run db:generate

# Push schema to database
npm run db:push

# (Optional) Seed with test data
npm run db:seed
```

### 5. Start Development Servers

```bash
# Start all apps (API + Web)
npm run dev

# API runs at: http://localhost:8787
# Web runs at: http://localhost:3000
```

## Project Structure

```
topline/
├── apps/
│   ├── api/          # Hono API server
│   └── web/          # Next.js frontend
├── packages/
│   ├── db/           # Prisma schema and client
│   └── shared/       # Shared types, schemas, utilities
├── docs/             # Comprehensive specifications
└── .claude/          # AI agent configurations
    └── agents/       # Specialized development agents
```

## Common Commands

### Development

```bash
npm run dev           # Start all apps
npm run build         # Build all apps
npm run lint          # Lint all apps
```

### Database

```bash
npm run db:generate   # Regenerate Prisma client
npm run db:push       # Push schema changes
npm run db:seed       # Seed test data
```

### Testing

```bash
npm run test          # Run all tests
npm run test:watch    # Watch mode
```

### Individual Apps

```bash
# Run specific app
cd apps/api && npm run dev
cd apps/web && npm run dev
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://topline:topline_dev@localhost:5432/topline` |
| `JWT_SECRET` | Secret for JWT tokens | (set in .env) |
| `PORT` | API server port | `8787` |
| `NEXT_PUBLIC_API_URL` | API URL for frontend | `http://localhost:8787` |
| `ADMIN_KEY` | Admin API key | (set in .env) |

## Troubleshooting

### Database Connection Failed

```bash
# Check if Docker is running
docker ps

# If topline-db not running, start it
docker-compose up -d

# Check logs if issues
docker logs topline-db
```

### Prisma Client Out of Sync

```bash
# Regenerate client after schema changes
npm run db:generate
```

### Port Already in Use

```bash
# Find process using port
lsof -i :8787  # API
lsof -i :3000  # Web

# Kill if needed
kill -9 <PID>
```

### Fresh Start

```bash
# Reset everything
docker-compose down -v  # Remove DB and volumes
rm -rf node_modules
npm install
docker-compose up -d
npm run db:push
npm run db:seed
npm run dev
```

## Documentation

Full documentation is in the `docs/` folder:

- `docs/01-PRODUCT-VISION.md` - Core concepts and business model
- `docs/04-SYSTEM-ARCHITECTURE.md` - Technical architecture
- `docs/05-DATABASE-SCHEMA.md` - Database design
- `docs/06-API-SPECIFICATION.md` - API endpoints
- `docs/12-IMPLEMENTATION-ROADMAP.md` - Build plan
- `docs/13-TESTING-STRATEGY.md` - Testing approach

See `docs/00-INDEX.md` for the complete documentation index.

## AI-Assisted Development

This project uses specialized Claude Code agents in `.claude/agents/`:

| Agent | Purpose |
|-------|---------|
| `feature-implementer` | Implements features with tests |
| `test-writer` | Writes comprehensive tests |
| `code-reviewer` | Reviews for quality and security |
| `test-fixer` | Debugs failing tests |
| `completion-checker` | Verifies features are complete |
| `schema-migrator` | Handles database migrations safely |

See `CLAUDE.md` for the complete development workflow.
