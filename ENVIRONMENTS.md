# kicknap — Environment Strategy

## The Rule

**Never test on production.** Never use live keys in development.
Every environment is a completely isolated world.

---

## Environment Overview

| Environment | Purpose | URL | Database | Stripe | Users |
|-------------|---------|-----|----------|--------|-------|
| **Local** | Your laptop, coding | localhost:3000 | SQLite or local PG | Test keys | Just you |
| **Development** | Team testing, CI/CD | dev.kicknap.com | Shared dev DB | Test keys | Developers |
| **Staging** | Pre-production, QA | staging.kicknap.com | Copy of production | Test keys | Internal testers |
| **Production** | Live, real users | kicknap.com | Production DB | Live keys | Everyone |

---

## Local Environment

### Purpose
Code on your laptop. Break things. Fix them. No impact on anyone.

### Setup
```bash
# Clone repo
git clone https://github.com/kicknap/kicknap.git
cd kicknap

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local

# Start local database (Docker)
docker-compose up -d postgres redis

# Run migrations
npm run db:migrate

# Seed test data
npm run db:seed

# Start development server
npm run dev
```

### Environment Variables (.env.local)
```bash
# Database
DATABASE_URL=postgresql://localhost:5432/kicknap_dev

# Redis
REDIS_URL=redis://localhost:6379

# Stripe (TEST keys — never use live keys locally)
STRIPE_SECRET_KEY=sk_test_xxxxx
STRIPE_PUBLISHABLE_KEY=pk_test_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx

# Auth
JWT_SECRET=your-local-secret-min-32-chars
JWT_EXPIRES_IN=24h

# Email (use Mailtrap or Ethereal for local testing)
SMTP_HOST=smtp.mailtrap.io
SMTP_PORT=587
SMTP_USER=your-mailtrap-user
SMTP_PASS=your-mailtrap-pass

# App
APP_URL=http://localhost:3000
API_URL=http://localhost:3001
NODE_ENV=development
```

### Local Development Rules
- Use SQLite for quick iterations (no Docker needed)
- Use PostgreSQL via Docker for production-like testing
- Never commit `.env.local` to git
- Use `console.log` freely (removed before deploy)
- Hot reload enabled (changes reflect immediately)

---

## Development Environment

### Purpose
Shared environment for team testing. CI/CD deploys here automatically.

### Setup
```bash
# One-time setup
heroku create kicknap-dev --region eu
heroku addons:create heroku-postgresql:mini
heroku addons:create heroku-redis:mini

# Or on Railway
railway init
railway add postgresql redis
```

### Environment Variables (set in hosting platform)
```bash
# Database
DATABASE_URL=postgresql://xxxxx:xxxxx@xxxxx.eu-west-1.compute.amazonaws.com:5432/kicknap_dev

# Redis
REDIS_URL=redis://xxxxx:xxxxx@xxxxx.eu-west-1.compute.amazonaws.com:xxxxx

# Stripe (TEST keys)
STRIPE_SECRET_KEY=sk_test_xxxxx
STRIPE_PUBLISHABLE_KEY=pk_test_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx

# Auth
JWT_SECRET=your-dev-secret-min-32-chars
JWT_EXPIRES_IN=24h

# Email (use real email provider, but test mode)
SMTP_HOST=smtp.zoho.com
SMTP_PORT=587
SMTP_USER=noreply@dev.kicknap.com
SMTP_PASS=your-zoho-app-password

# App
APP_URL=https://dev.kicknap.com
API_URL=https://api-dev.kicknap.com
NODE_ENV=development
```

### Development Deployment
```
Code Push to main branch
    → GitHub Actions runs tests
    → Tests pass?
        → Yes → Auto-deploy to dev.kicknap.com
        → No → Deploy blocked, author notified
```

### Development Rules
- Auto-deploy on push to `main` branch
- All tests must pass before deploy
- Database migrations auto-run on deploy
- No real user data (use seed scripts)
- Debug logging enabled
- Error tracking to Sentry (dev project)

---

## Staging Environment

### Purpose
Final testing before production. Must be **identical** to production in every way.

### Setup
```bash
# One-time setup
heroku create kicknap-staging --region eu
heroku addons:create heroku-postgresql:mini
heroku addons:create heroku-redis:mini
```

### Environment Variables
```bash
# Database
DATABASE_URL=postgresql://xxxxx:xxxxx@xxxxx.eu-west-1.compute.amazonaws.com:5432/kicknap_staging

# Redis
REDIS_URL=redis://xxxxx:xxxxx@xxxxx.eu-west-1.compute.amazonaws.com:xxxxx

# Stripe (TEST keys — same as dev, but staging is treated as production)
STRIPE_SECRET_KEY=sk_test_xxxxx
STRIPE_PUBLISHABLE_KEY=pk_test_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx

# Auth
JWT_SECRET=your-staging-secret-min-32-chars
JWT_EXPIRES_IN=24h

# Email
SMTP_HOST=smtp.zoho.com
SMTP_PORT=587
SMTP_USER=noreply@staging.kicknap.com
SMTP_PASS=your-zoho-app-password

# App
APP_URL=https://staging.kicknap.com
API_URL=https://api-staging.kicknap.com
NODE_ENV=production  # YES, production — staging must match production exactly
```

### Staging Deployment
```
Manual trigger (click "Deploy to Staging" in GitHub Actions)
    → GitHub Actions runs tests
    → Tests pass?
        → Yes → Deploy to staging.kicknap.com
        → No → Deploy blocked
    → QA team tests manually
    → QA passes?
        → Yes → Ready for production
        → No → Fix issues, re-deploy to staging
```

### Staging Rules
- **Manual deployment only** (never auto-deploy)
- **NODE_ENV=production** (matches production behavior exactly)
- **Same Stripe config** as production (but test keys)
- **Same database config** as production (but separate DB)
- **No debug logging** (matches production)
- **Full monitoring enabled** (matches production)
- **Anonymized production data** (real patterns, fake names)

### Staging Data Strategy
```bash
# Copy production data to staging (anonymized)
npm run db:copy-production -- --anonymize

# This:
# 1. Copies all production data
# 2. Randomizes user emails (user@example.com)
# 3. Randomizes names (User 1, User 2, etc.)
# 4. Keeps listing data intact (prices, amenities)
# 5. Keeps booking patterns intact (for testing)
# 6. Removes all payment data (cards, bank accounts)
```

---

## Production Environment

### Purpose
Live. Real users. Real money. Real stakes.

### Setup
```bash
# One-time setup (do this RIGHT the first time)
heroku create kicknap --region eu
heroku addons:create heroku-postgresql:standard-0
heroku addons:create heroku-redis:premium-0
heroku addons:create papertrail:dev  # logging
```

### Environment Variables
```bash
# Database
DATABASE_URL=postgresql://xxxxx:xxxxx@xxxxx.eu-west-1.compute.amazonaws.com:5432/kicknap_production

# Redis
REDIS_URL=redis://xxxxx:xxxxx@xxxxx.eu-west-1.compute.amazonaws.com:xxxxx

# Stripe (LIVE keys — real money!)
STRIPE_SECRET_KEY=sk_live_xxxxx
STRIPE_PUBLISHABLE_KEY=pk_live_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx

# Auth
JWT_SECRET=your-production-secret-min-32-chars-NEVER-CHANGE-THIS
JWT_EXPIRES_IN=24h

# Email
SMTP_HOST=smtp.zoho.com
SMTP_PORT=587
SMTP_USER=noreply@kicknap.com
SMTP_PASS=your-zoho-app-password

# App
APP_URL=https://kicknap.com
API_URL=https://api.kicknap.com
NODE_ENV=production

# Monitoring
SENTRY_DSN=https://xxxxx@sentry.io/xxxxx
```

### Production Deployment
```
Manual trigger (click "Deploy to Production" in GitHub Actions)
    → Pre-deployment checks:
        → All tests pass?
        → Staging tested and approved?
        → Database migrations backward-compatible?
        → No breaking changes?
    → Deploy to production
    → Post-deployment checks:
        → Health checks pass?
        → Error rate normal?
        → Response times normal?
    → Deploy successful? → Done
    → Deploy failed? → Automatic rollback to previous version
```

### Production Rules
- **Manual deployment only** (with approval)
- **Database migrations must be backward-compatible** (can't break running code)
- **Rollback plan required** for every deploy
- **No debug logging** (use structured logging)
- **Full monitoring + alerting** enabled
- **Backups tested monthly** (actually restore and verify)
- **Security audits quarterly**

---

## Environment Variable Management

### The Rule
**Never hardcode secrets.** Always use environment variables.

### What's a Secret
| Type | Example | Where to Store |
|------|---------|----------------|
| Database URL | `postgresql://...` | Environment variable |
| API keys | `sk_live_xxxxx` | Environment variable |
| JWT secrets | `your-secret-key` | Environment variable |
| SMTP credentials | `user:pass` | Environment variable |
| Webhook secrets | `whsec_xxxxx` | Environment variable |

### What's NOT a Secret
| Type | Example | Where to Store |
|------|---------|----------------|
| App name | `kicknap` | Code |
| Default port | `3000` | Code |
| Feature flags | `enable_pricing: true` | Config file (non-sensitive) |
| API version | `v1` | Code |

### .env File Template
```bash
# .env.example (committed to git — shows structure, no real values)
DATABASE_URL=
REDIS_URL=
STRIPE_SECRET_KEY=
STRIPE_PUBLISHABLE_KEY=
STRIPE_WEBHOOK_SECRET=
JWT_SECRET=
SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASS=
APP_URL=
API_URL=
NODE_ENV=
SENTRY_DSN=
```

### .env.local (never committed)
```bash
# .env.local (in .gitignore — real values, never shared)
DATABASE_URL=postgresql://localhost:5432/kicknap_dev
REDIS_URL=redis://localhost:6379
STRIPE_SECRET_KEY=sk_test_xxxxx
# ... etc
```

---

## Git Branch Strategy

```
main (production)
    │
    ├── develop (development environment)
    │   │
    │   ├── feature/auth-service (feature branch)
    │   ├── feature/booking-service (feature branch)
    │   └── feature/pricing-engine (feature branch)
    │
    ├── staging (staging environment)
    │   └── release/v1.0.0 (release branch)
    │
    └── hotfix/critical-bug (emergency fix)
```

### Branch Rules
| Branch | Purpose | Deploy To | Merge To |
|--------|---------|-----------|----------|
| `main` | Production code | Production | — |
| `develop` | Integration branch | Development | `main` (via release) |
| `feature/*` | New features | — | `develop` |
| `staging` | Pre-production | Staging | `main` |
| `release/*` | Release candidates | Staging | `main` + `develop` |
| `hotfix/*` | Emergency fixes | Production | `main` + `develop` |

### Commit Message Convention
```
feat: add booking service
fix: resolve payment timeout
docs: update API endpoints
chore: update dependencies
test: add booking service tests
```

---

## Environment Comparison

| Feature | Local | Development | Staging | Production |
|---------|-------|-------------|---------|------------|
| Database | SQLite/Local PG | Shared dev DB | Copy of prod | Production DB |
| Stripe | Test keys | Test keys | Test keys | **Live keys** |
| Email | Mailtrap | Zoho (test) | Zoho (real) | Zoho (real) |
| Debug logs | Yes | Yes | No | No |
| Error tracking | No | Sentry (dev) | Sentry (staging) | Sentry (production) |
| Monitoring | No | Basic | Full | Full |
| Auto-deploy | N/A | Yes (on push) | No (manual) | No (manual) |
| Data | Seed data | Seed data | Anonymized prod | Real data |
| Users | Just you | Developers | Internal testers | Everyone |

---

## Pre-Deployment Checklist

### Before Every Deploy
- [ ] All tests passing (`npm test`)
- [ ] Linting clean (`npm run lint`)
- [ ] TypeScript compiles (`npm run typecheck`)
- [ ] No secrets in code (grep for `sk_live`, `sk_test`, `password`)
- [ ] Database migrations backward-compatible
- [ ] Rollback plan documented
- [ ] Changelog updated

### Before Production Deploy
- [ ] Staging tested and approved
- [ ] Performance tests passed
- [ ] Security scan clean
- [ ] Backup verified
- [ ] Monitoring configured
- [ ] Alert channels tested
- [ ] Team notified

---

## Summary: Environment Rules

1. **Local = your sandbox.** Break anything. No consequences.
2. **Development = team playground.** Auto-deploy. Test together.
3. **Staging = production clone.** Manual deploy. Test thoroughly.
4. **Production = sacred ground.** Manual deploy. Monitor everything.
5. **Never mix environments.** Never use live keys anywhere but production.
6. **Staging must match production exactly.** Same config, same behavior.
7. **Test data is fake.** Real patterns, fake names, fake money.
