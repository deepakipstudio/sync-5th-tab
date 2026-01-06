# Development Skills

Monorepo with npm workspaces. Concurrent development servers. Prisma for database management.

## Monorepo Structure

```
sync-5th-tab/
  apps/
    backend/
    frontend/
  package.json (root)
```

### Workspaces

**Root `package.json`:**

```json
{
  "workspaces": [
    "apps/backend",
    "apps/frontend"
  ]
}
```

## Development Commands

### Root Level

```bash
# Run both backend and frontend concurrently
npm run dev

# Install all dependencies
npm run install:all

# Build all apps
npm run build
```

### Backend

```bash
cd apps/backend

# Development server (tsx watch)
npm run dev

# Generate Prisma client
npm run prisma:generate

# Push schema to database
npm run prisma:push

# Build
npm run build

# Production start
npm start
```

### Frontend

```bash
cd apps/frontend

# Development server
npm run dev

# Build
npm run build

# Generate static site
npm run generate

# Preview
npm run preview
```

## File Organization

### Backend

```
apps/backend/
  src/
    routes/        # Route handlers
    services/      # Business logic
    config.ts      # Configuration
    server.ts      # Express app
  prisma/
    schema.prisma  # Database schema
  uploads/         # File storage
```

### Frontend

```
apps/frontend/
  pages/           # Routes
  composables/     # Reusable logic
  middleware/      # Route guards
  layouts/         # Page layouts
  assets/          # Static assets
```

## Prisma Commands

```bash
# Generate Prisma Client after schema changes
npm run prisma:generate

# Push schema changes to database (dev only)
npm run prisma:push

# Create migration (when migrations enabled)
npx prisma migrate dev

# View database in Prisma Studio
npx prisma studio
```

## File Locations

- Root config: `package.json`
- Backend config: `apps/backend/package.json`
- Frontend config: `apps/frontend/package.json`
- Prisma schema: `apps/backend/prisma/schema.prisma`

## Important Notes

- Use `npm run dev` from root to run both servers
- Prisma client must be generated after schema changes
- Backend runs on port 4000, frontend on 3000
- Use workspace commands: `npm run dev -w apps/backend`






