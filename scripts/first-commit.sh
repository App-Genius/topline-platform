#!/bin/bash
# First commit script for Topline monorepo setup

cd /Users/joeldean/Apps/topline

echo "📁 Current directory structure:"
ls -la

echo ""
echo "📦 Installing dependencies..."
npm install

echo ""
echo "🔧 Generating Prisma client..."
cd packages/db && npx prisma generate && cd ../..

echo ""
echo "📝 Git status:"
git status

echo ""
echo "➕ Adding files..."
git add .

echo ""
echo "📝 Creating commit..."
git commit -m "$(cat <<'EOF'
feat: Initialize Turborepo monorepo with Hono API

## Changes

### Monorepo Structure
- Set up Turborepo workspace with apps/ and packages/
- Move existing Next.js app to apps/web/
- Create apps/api/ with Hono framework
- Create packages/db/ with Prisma ORM
- Create packages/shared/ with Zod schemas and utilities

### Hono API (apps/api/)
- OpenAPI/Swagger documentation at /docs
- JWT authentication with refresh tokens
- CRUD routes for: users, roles, behaviors, behavior-logs, daily-entries
- Organization management and dashboard endpoints
- Public questionnaire endpoint with scoring

### Database (packages/db/)
- Complete Prisma schema with all entities
- Seed script with demo data
- Support for multi-tenant organizations

### Shared Package (packages/shared/)
- Zod validation schemas for all entities
- TypeScript types and interfaces
- Utility functions for calculations and formatting
- Comprehensive test coverage

### Testing
- Vitest configuration
- Schema validation tests
- Utility function tests
- Test helpers for API testing

### Infrastructure
- Docker Compose for PostgreSQL
- Environment configuration
- Git ignore patterns

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
EOF
)"

echo ""
echo "✅ Commit complete!"
git log -1 --oneline
