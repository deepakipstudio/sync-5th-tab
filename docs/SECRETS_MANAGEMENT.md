# Secrets Management Guide

Proper secrets management is critical for security. This guide covers how to handle sensitive data across environments.

## 🔐 What are "Secrets"?

Secrets are sensitive values that should never be committed to git or exposed publicly:

- Database passwords
- API keys and client secrets
- OAuth tokens
- Session encryption keys
- Any third-party credentials

## 📋 Secrets in This Project

| Secret | Used By | Storage | Rotation |
|--------|---------|---------|----------|
| `COOKIE_SECRET` | Backend | Environment variable | Every 6 months |
| `DATABASE_URL` | Backend | Environment variable | When password changes |
| `OAUTH_REDIRECT_URI` | Backend | Environment variable | Per environment |
| Marianatek `mtClientId` | Backend (from DB) | Database | Per tenant |
| Marianatek `mtClientSecret` | Backend (from DB) | Database | Per tenant |

## 🏗️ Local Development

### Setup

**DO:**
```bash
# Copy template
cp apps/backend/.env.example apps/backend/.env

# Edit with dev values
nano apps/backend/.env

# Example dev values:
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/sync5
COOKIE_SECRET=dev-secret
```

**DON'T:**
```bash
# ❌ Never commit .env
git add apps/backend/.env

# ❌ Never share .env in chat
# ❌ Never hardcode secrets in code
# ❌ Never use production secrets locally
```

### .gitignore Configuration

```gitignore
# Environment files (MUST NOT be committed)
.env
.env.local
.env.*.local

# Logs that might contain secrets
*.log
npm-debug.log*

# IDE files that might contain secrets
.vscode/
.idea/
*.swp
```

## 🏭 Production

### Environment Variable Setup

Choose one method based on your hosting platform:

#### Option 1: Platform Dashboard (Recommended)

**Railway (https://railway.app/)**
1. Go to Project → Environment
2. Click "Add Variable"
3. Enter key and value
4. Redeploy

**Render (https://render.com/)**
1. Go to Service → Environment
2. Add each variable
3. Deploy

**Vercel (https://vercel.com/)**
1. Go to Settings → Environment Variables
2. Add variables for `production` environment
3. Redeploy

**DigitalOcean App Platform**
1. Go to Apps → Edit → Components
2. Set Environment Variables
3. Redeploy

#### Option 2: Docker with Environment File

```bash
# .env.production (NOT in git, created during deployment)
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://...
COOKIE_SECRET=your_secure_secret
OAUTH_REDIRECT_URI=https://yourdomain.com/auth/callback
```

Docker command:
```bash
docker run --env-file .env.production myapp:latest
```

### Generating Secure Secrets

**COOKIE_SECRET Generation:**

```bash
# macOS/Linux
openssl rand -base64 32

# Windows (PowerShell)
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }) -as [byte[]])
```

**Example output:**
```
aB12cD34eF56gH78iJ90kL12mN34oP56=
```

**Validation:**
- ✅ Length: 32+ characters
- ✅ Mix of alphanumeric and special chars
- ✅ Unique per environment
- ✅ No repeated patterns

## 🔄 Secret Rotation

### When to Rotate

- [ ] Immediately if compromised
- [ ] Every 6 months (routine)
- [ ] When team member leaves
- [ ] After security incident
- [ ] As required by compliance policy

### How to Rotate COOKIE_SECRET

1. **Generate new secret**
   ```bash
   openssl rand -base64 32
   ```

2. **Update environment variable**
   - Platform dashboard, OR
   - Update `.env.production`

3. **Redeploy application**
   ```bash
   # Platform-specific deploy command
   railway deploy
   # or
   vercel deploy --prod
   # or
   git push heroku main
   ```

4. **Monitor for issues**
   - Existing sessions will be invalidated (users will need to re-login)
   - Watch error logs for 1 hour
   - All users should successfully re-authenticate

5. **Document rotation**
   ```
   Date: 2024-12-18
   Secret: COOKIE_SECRET
   Reason: Routine 6-month rotation
   Team: Notified via Slack
   ```

### How to Rotate Database Password

1. **Update database password**
   - DigitalOcean: Cluster → Settings → Change Password
   - AWS RDS: Modify → Master Password
   - Neon: Project Settings → Password

2. **Get new CONNECTION string**
   - It will include the new password

3. **Update DATABASE_URL**
   - Platform environment variables

4. **Test connection**
   ```bash
   psql $DATABASE_URL -c "SELECT 1"
   ```

5. **Redeploy application**
   - Must restart to pick up new DATABASE_URL

## 🚨 Incident Response

### If a Secret is Compromised

**Immediate Actions (within minutes):**

1. **Rotate the secret immediately**
   ```bash
   # Generate new secret
   openssl rand -base64 32
   
   # Update environment variable
   # Redeploy
   ```

2. **Notify stakeholders**
   - Alert security team
   - Alert DevOps
   - Consider notifying users if data was exposed

3. **Review logs**
   - Who accessed the secret?
   - When was it accessed?
   - Was data accessed?

**Longer-term Actions (within 24 hours):**

4. **Audit usage**
   - Check database access logs
   - Check API call logs
   - Look for unauthorized access

5. **Document incident**
   - What was exposed?
   - How was it exposed?
   - What was the impact?
   - How was it fixed?

6. **Prevent recurrence**
   - Update access controls
   - Improve secret storage
   - Add monitoring alerts

## 🔍 Secret Detection

### Preventing accidental commits

**Install git-secrets:**

```bash
# macOS
brew install git-secrets

# Linux
git clone https://github.com/awslabs/git-secrets.git
cd git-secrets
make install

# After install
cd /path/to/sync5
git secrets --install
git secrets --register-aws
```

**Add custom patterns:**

```bash
git secrets --add '(COOKIE_SECRET|DATABASE_URL|OAUTH_REDIRECT)=.*'
```

**Test:**
```bash
git secrets --scan  # Scans all commits
```

### Pre-commit hook

Create `.git/hooks/pre-commit`:

```bash
#!/bin/bash
git secrets --scan
```

Make it executable:
```bash
chmod +x .git/hooks/pre-commit
```

## 📚 Best Practices Checklist

- [ ] All `.env*` files are in `.gitignore`
- [ ] Production secrets are set via platform UI (not committed)
- [ ] Secrets are at least 32 characters for encryption keys
- [ ] Different secrets for each environment
- [ ] Secrets are rotated regularly (every 6 months minimum)
- [ ] Access to secrets is logged and audited
- [ ] Compromised secrets are rotated immediately
- [ ] Team is trained on secrets handling
- [ ] CI/CD does not expose secrets in logs

## 📚 Related Documentation

- [Environment Setup Guide](./ENVIRONMENT_SETUP.md)
- [Production Checklist](./PRODUCTION_CHECKLIST.md)
- [Backend Config](../apps/backend/src/config.ts)
- [Marianatek Integration](./marianatek/README.md)

## 🆘 Common Issues

### "database: FATAL: invalid authorization specification"

**Cause:** DATABASE_URL has wrong password

**Fix:**
1. Get correct password from DigitalOcean/AWS/Neon dashboard
2. Update DATABASE_URL in environment
3. Redeploy
4. Test: `psql $DATABASE_URL -c "SELECT 1"`

### Sessions breaking after COOKIE_SECRET rotation

**Expected behavior:** Existing sessions are invalidated

**Why:** Old sessions were encrypted with old secret, new secret can't decrypt them

**What users should do:** Simply log in again

### "secret must be at least 32 characters"

**Fix:** Generate with proper length:
```bash
# Generates 32 bytes = 43 chars in base64
openssl rand -base64 32
```

## 📞 Need Help?

- Check `.env.example` for variable references
- Review [Marianatek docs](./marianatek/README.md) for Marianatek-specific secrets
- Ask team for Production database connection string
- Check hosting platform's secrets management docs
