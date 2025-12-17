# Environment Setup Guide

This document explains how to set up environment variables for local development, staging, and production.

## 📋 Table of Contents

- [Quick Start (Local Dev)](#quick-start-local-dev)
- [Environment Variables Reference](#environment-variables-reference)
- [Local Development Setup](#local-development-setup)
- [Production Deployment](#production-deployment)
- [Secrets Management](#secrets-management)
- [Troubleshooting](#troubleshooting)

## 🚀 Quick Start (Local Dev)

### 1. Backend Setup

```bash
cd apps/backend

# Copy example to .env
cp .env.example .env

# Edit .env and fill in:
# - DATABASE_URL (use Neon or local Postgres)
# - COOKIE_SECRET (any string for dev)
# - OAUTH_REDIRECT_URI (keep as http://localhost:3000/auth/callback)
```

### 2. Frontend Setup

```bash
cd apps/frontend

# Copy example to .env
cp .env.example .env

# Edit .env and fill in:
# - NUXT_PUBLIC_BACKEND_URL=http://localhost:4000
```

### 3. Run Both Apps

```bash
# From workspace root
npm run dev

# Frontend: http://localhost:3000
# Backend: http://localhost:4000
```

## 📝 Environment Variables Reference

### Backend (`apps/backend/.env`)

| Variable | Local Dev | Staging | Production | Required | Notes |
|----------|-----------|---------|------------|----------|-------|
| `NODE_ENV` | `development` | `staging` | `production` | ✅ | Controls logging and optimization |
| `PORT` | `4000` | `4000` | `3000` (or via platform) | ✅ | Backend server port |
| `DATABASE_URL` | Neon or Local | Prod DB | Prod DB | ✅ | PostgreSQL connection string |
| `COOKIE_SECRET` | `dev-secret` | `[strong random]` | `[strong random]` | ✅ | Min 32 chars in production |
| `COOKIE_NAME` | `sync5_session` | `sync5_session` | `sync5_session` | ✅ | Same across all environments |
| `SESSION_MAX_AGE_SECONDS` | `86400` | `86400` | `86400` (1 day) | ✅ | Session expiry time |
| `OAUTH_REDIRECT_URI` | `http://localhost:3000/auth/callback` | `https://staging.yourdomain.com/auth/callback` | `https://yourdomain.com/auth/callback` | ✅ | Must match Marianatek OAuth config |

### Frontend (`apps/frontend/.env`)

| Variable | Local Dev | Production | Required | Notes |
|----------|-----------|------------|----------|-------|
| `NUXT_PUBLIC_BACKEND_URL` | `http://localhost:4000` | `https://api.yourdomain.com` | ✅ | Backend URL from frontend perspective |

## 💻 Local Development Setup

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL (via Docker/Neon) or use Neon PostgreSQL
- Git

### Step 1: Set Up Database

**Option A: Neon (Recommended for dev)**

```bash
# 1. Go to https://console.neon.tech/
# 2. Create a new project
# 3. Copy connection string
# 4. Paste into DATABASE_URL in .env
```

**Option B: Local PostgreSQL via Docker**

```bash
docker run -d \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=sync5 \
  -p 5432:5432 \
  postgres:15

# DATABASE_URL in .env:
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/sync5
```

### Step 2: Backend Setup

```bash
cd apps/backend

# Copy env file
cp .env.example .env

# Edit .env with your database URL
nano .env  # or use your editor

# Install dependencies
npm install

# Run migrations (if using Prisma migrations)
npm run prisma:push

# Start dev server
npm run dev
# Output: Backend listening on http://localhost:4000
```

### Step 3: Frontend Setup

```bash
cd apps/frontend

# Copy env file
cp .env.example .env

# Frontend should already have correct defaults, verify:
# NUXT_PUBLIC_BACKEND_URL=http://localhost:4000

# Install dependencies
npm install

# Start dev server
npm run dev
# Output: ➜ Local: http://localhost:3000/
```

### Step 4: Verify Everything Works

1. Open http://localhost:3000 in browser
2. Try the login flow (will redirect to Marianatek OAuth)
3. Check browser console for errors
4. Check backend logs for requests

## 🏭 Production Deployment

### Prerequisites for Production

Before deploying to production, ensure you have:

- ✅ Real database (DigitalOcean Postgres, AWS RDS, etc.)
- ✅ Real Marianatek OAuth credentials for each tenant
- ✅ HTTPS/SSL certificates
- ✅ Strong randomly generated secrets
- ✅ Backup strategy
- ✅ Monitoring and logging setup

### Production Environment Variables

**Backend (.env for production)**

```dotenv
# Environment
NODE_ENV=production
PORT=3000

# Database - PRODUCTION DATABASE URL
DATABASE_URL=postgresql://user:STRONG_PASSWORD@prod-db.example.com:5432/sync5

# Secrets - Generate with: openssl rand -base64 32
COOKIE_SECRET=YOUR_STRONG_RANDOM_SECRET_32_CHARS_MIN
COOKIE_NAME=sync5_session
SESSION_MAX_AGE_SECONDS=86400

# OAuth - Must match Marianatek OAuth config for production
OAUTH_REDIRECT_URI=https://yourdomain.com/auth/callback
```

**Frontend (.env for production)**

```dotenv
NUXT_PUBLIC_BACKEND_URL=https://api.yourdomain.com
```

### Generating Secure Secrets

```bash
# Generate 32-character random string
openssl rand -base64 32

# Example output:
# aB12cD34eF56gH78iJ90kL12mN34oP56qR78sT90

# Use this for COOKIE_SECRET in production
```

### Deployment Steps

**1. Build backend**
```bash
cd apps/backend
npm run build  # If TypeScript compilation is needed
```

**2. Build frontend**
```bash
cd apps/frontend
npm run build
# Output: dist/ folder ready for deployment
```

**3. Set production environment variables**

Option A: Via hosting platform (Vercel, Railway, Render, etc.)
- Set each variable in the platform's dashboard
- Example: Railway → Environment tab → Add variables

Option B: Via `.env` file (not recommended)
- Create `.env` with production values
- Never commit to git

**4. Deploy**

```bash
# Depends on your hosting platform
# Example for Railway:
railway deploy

# Example for Vercel (frontend):
vercel deploy --prod

# Example for Render:
render deploy
```

**5. Verify production**

```bash
# Test OAuth flow
# Test API endpoints
# Check logs for errors
# Monitor database connection
```

## 🔐 Secrets Management

### Development

**DO:**
- ✅ Use `.env.example` as template
- ✅ Add `.env` to `.gitignore`
- ✅ Use dev-friendly secrets (simple strings)

**DON'T:**
- ❌ Commit `.env` to git
- ❌ Share `.env` in Slack/email
- ❌ Use production secrets in development

### Production

**DO:**
- ✅ Use environment variables on hosting platform
- ✅ Rotate secrets periodically
- ✅ Use strong random secrets (32+ chars)
- ✅ Monitor secret access logs
- ✅ Use separate secrets per environment

**DON'T:**
- ❌ Commit `.env` to git
- ❌ Use same secrets across environments
- ❌ Log secrets to console
- ❌ Share secrets in documentation

### Secret Rotation Checklist

When rotating `COOKIE_SECRET`:

- [ ] Generate new secret: `openssl rand -base64 32`
- [ ] Update production environment variable
- [ ] Redeploy application
- [ ] Existing sessions will be invalidated (users re-login)
- [ ] Monitor error logs for 1 hour
- [ ] Document change in changelog

## 🚨 Troubleshooting

### Database Connection Error

**Error:** `Error: connect ECONNREFUSED 127.0.0.1:5432`

**Solution:**
1. Verify DATABASE_URL is correct
2. Check if database server is running
3. Test connection: `psql $DATABASE_URL`
4. If using Neon, verify IP whitelist settings

### Invalid Environment Configuration

**Error:** `Invalid environment configuration: { PORT: [ 'Expected string, received number' ] }`

**Solution:**
1. Check that all required env vars are present
2. Verify no extra spaces in `.env` file
3. Restart dev server

### OAuth Redirect URI Mismatch

**Error:** `redirect_uri_mismatch` from Marianatek

**Solution:**
1. Check `OAUTH_REDIRECT_URI` in backend `.env`
2. Verify it matches exactly in Marianatek OAuth settings
3. For local: `http://localhost:3000/auth/callback`
4. For production: `https://yourdomain.com/auth/callback`
5. No trailing slashes

### COOKIE_SECRET Too Short

**Error:** Not an error yet, but will cause issues

**Solution:**
1. Use `openssl rand -base64 32` to generate
2. Minimum 16 characters (32 recommended)
3. Don't reuse across environments

## 📚 Related Files

- Backend config: [apps/backend/src/config.ts](../apps/backend/src/config.ts)
- Backend example: [apps/backend/.env.example](../apps/backend/.env.example)
- Frontend example: [apps/frontend/.env.example](../apps/frontend/.env.example)
- Marianatek docs: [docs/marianatek/README.md](./marianatek/README.md)

## ❓ Questions?

Refer to:
- [docs/marianatek/README.md](./marianatek/README.md) - Multi-tenant Marianatek setup
- [README.md](../README.md) - Project overview
- Backend environment validation: [apps/backend/src/config.ts](../apps/backend/src/config.ts)
