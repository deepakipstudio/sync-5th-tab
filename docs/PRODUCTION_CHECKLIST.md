# Production Deployment Checklist

Use this checklist before deploying to production to ensure all security, configuration, and operational concerns are addressed.

## 🔒 Security

- [ ] **Environment Variables**
  - [ ] `COOKIE_SECRET` is 32+ random characters (generated with `openssl rand -base64 32`)
  - [ ] `COOKIE_SECRET` is NOT the same as dev/staging
  - [ ] `DATABASE_URL` uses strong password
  - [ ] `DATABASE_URL` points to production database
  - [ ] All environment variables are set on hosting platform (not `.env` file)
  - [ ] No secrets are committed to git

- [ ] **Database**
  - [ ] PostgreSQL is version 13+ 
  - [ ] SSL/TLS is enabled for database connections
  - [ ] Database user has minimal required permissions (no superuser)
  - [ ] Automated backups are configured (daily minimum)
  - [ ] Backup restoration tested
  - [ ] Database logs are monitored

- [ ] **OAuth / Marianatek**
  - [ ] `OAUTH_REDIRECT_URI` matches exactly in Marianatek OAuth settings
  - [ ] Each tenant's OAuth credentials (mtClientId, mtClientSecret) are securely stored
  - [ ] Staging and production use separate Marianatek OAuth apps
  - [ ] Token storage is secure (HTTP-only cookies)
  - [ ] Refresh token rotation is implemented (if applicable)

- [ ] **SSL/HTTPS**
  - [ ] Domain has valid SSL certificate
  - [ ] HTTPS is enforced (redirect HTTP → HTTPS)
  - [ ] Certificate auto-renewal is configured

## 🏗️ Infrastructure

- [ ] **Hosting Platform**
  - [ ] Hosting provider is chosen (Vercel, Railway, Render, DigitalOcean, AWS, etc.)
  - [ ] Auto-scaling is configured (if needed)
  - [ ] Health checks are configured
  - [ ] Zero-downtime deployments are enabled

- [ ] **Database**
  - [ ] Production database is provisioned (DigitalOcean, AWS RDS, etc.)
  - [ ] Database is NOT publicly accessible
  - [ ] Connection pooling is configured (for better performance)
  - [ ] Monitoring/alerts are set up (CPU, memory, connections)

- [ ] **Monitoring & Logging**
  - [ ] Application error logging is configured
  - [ ] Error tracking (Sentry, LogRocket, etc.) is set up
  - [ ] Uptime monitoring is set up (Pingdom, UptimeRobot, etc.)
  - [ ] Database query logs are monitored
  - [ ] Alerts are configured for critical issues

## 🚀 Deployment

- [ ] **Code Quality**
  - [ ] All tests pass: `npm test`
  - [ ] Linting passes: `npm run lint`
  - [ ] No TypeScript errors: `npm run type-check`
  - [ ] Code review completed
  - [ ] Commits are meaningful and documented

- [ ] **Build & Release**
  - [ ] Frontend builds successfully: `npm run build`
  - [ ] Backend builds successfully
  - [ ] No build warnings or errors
  - [ ] Bundle size is reasonable (frontend < 500KB gzipped)
  - [ ] Source maps are disabled in production

- [ ] **Environment Configuration**
  - [ ] `NODE_ENV=production`
  - [ ] `PORT` is correct for hosting platform
  - [ ] All required env vars are set and validated
  - [ ] Dev/staging configs are NOT in production
  - [ ] Hardcoded localhost references are removed

## ✅ Functionality Testing

- [ ] **Critical User Paths**
  - [ ] User can log in via Marianatek OAuth
  - [ ] User session is created and persisted
  - [ ] User can view tenant dashboard
  - [ ] Admin can create banners
  - [ ] API endpoints return correct data

- [ ] **Multi-Tenant Verification**
  - [ ] Different tenants see different data
  - [ ] Tenant A cannot access Tenant B's data
  - [ ] URLs are correctly built per tenant (e.g., `studio1.marianatek.com`)
  - [ ] Each tenant's Marianatek credentials work correctly

- [ ] **Error Handling**
  - [ ] API errors return proper HTTP status codes
  - [ ] Invalid requests are handled gracefully
  - [ ] Database errors don't expose sensitive info
  - [ ] 404 errors return correct response

## 📊 Performance

- [ ] **Frontend**
  - [ ] Page load time is < 3 seconds
  - [ ] Lighthouse score is > 80
  - [ ] No console errors in production
  - [ ] CSS/JS are minified and bundled

- [ ] **Backend**
  - [ ] API response time is < 200ms
  - [ ] Database queries are optimized
  - [ ] No N+1 query problems
  - [ ] Caching is implemented where appropriate

## 📋 Operations

- [ ] **Runbooks & Documentation**
  - [ ] Runbook for common issues exists
  - [ ] Deployment procedure is documented
  - [ ] Rollback procedure is documented
  - [ ] Team knows who to contact for emergencies

- [ ] **Backup & Disaster Recovery**
  - [ ] Database backups are automated
  - [ ] Backups are tested (restore procedure verified)
  - [ ] Backup retention policy is clear (30+ days minimum)
  - [ ] Disaster recovery plan exists

- [ ] **Maintenance**
  - [ ] Scheduled maintenance window is planned (if needed)
  - [ ] Users will be notified of downtime
  - [ ] Rollback plan is ready

## 🔄 Post-Deployment

- [ ] **Verification**
  - [ ] All critical features work in production
  - [ ] No errors in application logs
  - [ ] Database is performing well
  - [ ] Metrics show expected traffic

- [ ] **Monitoring**
  - [ ] Real-user monitoring (RUM) is active
  - [ ] Error tracking is receiving events
  - [ ] Alerts are configured and tested
  - [ ] Team is alerted for critical issues

- [ ] **Communication**
  - [ ] Deploy was announced to team/users
  - [ ] Release notes are published
  - [ ] Known issues are documented

## 🚨 Rollback Plan

If production deployment fails:

1. **Immediate Action**
   - [ ] Revert application code to last known good version
   - [ ] Verify database backups are valid
   - [ ] Clear any caches
   - [ ] Redeploy previous version

2. **Investigation**
   - [ ] Check error logs
   - [ ] Check database connectivity
   - [ ] Check environment variables
   - [ ] Review recent changes

3. **Communication**
   - [ ] Notify team of issue
   - [ ] Update status page
   - [ ] Document incident

## 📝 Pre-Deployment Sign-Off

- [ ] Lead Developer: _________________ Date: _______
- [ ] DevOps/Infrastructure: _________________ Date: _______
- [ ] QA Lead: _________________ Date: _______
- [ ] Product Owner: _________________ Date: _______

---

**Last Updated:** [Your Date]  
**Next Review Date:** [30 days from deployment]
