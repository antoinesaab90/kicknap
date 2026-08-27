# kicknap — CI/CD Pipeline

## The Pipeline

Every code change follows this path:

```
Code Change
    ↓
Git Push
    ↓
GitHub Actions (automated)
    ↓
┌─────────────────────────────────────────────────┐
│  Stage 1: Validate (2-3 minutes)                │
│  ├─ Lint check                                  │
│  ├─ Type check                                  │
│  ├─ Unit tests                                  │
│  └─ Security scan                               │
└─────────────────────────────────────────────────┘
    ↓ (pass)
┌─────────────────────────────────────────────────┐
│  Stage 2: Build (2-3 minutes)                   │
│  ├─ Compile TypeScript                          │
│  ├─ Bundle frontend                             │
│  ├─ Build Docker images                         │
│  └─ Push to container registry                  │
└─────────────────────────────────────────────────┘
    ↓ (pass)
┌─────────────────────────────────────────────────┐
│  Stage 3: Test (5-10 minutes)                   │
│  ├─ Integration tests                           │
│  ├─ API tests                                   │
│  ├─ E2E tests (Playwright)                      │
│  └─ Performance tests                           │
└─────────────────────────────────────────────────┘
    ↓ (pass)
┌─────────────────────────────────────────────────┐
│  Stage 4: Deploy (3-5 minutes)                  │
│  ├─ Deploy to target environment                │
│  ├─ Run database migrations                     │
│  ├─ Health checks                               │
│  └─ Smoke tests                                 │
└─────────────────────────────────────────────────┘
    ↓ (pass)
┌─────────────────────────────────────────────────┐
│  Stage 5: Monitor (ongoing)                     │
│  ├─ Error rate monitoring                       │
│  ├─ Performance monitoring                      │
│  ├─ User behavior monitoring                    │
│  └─ Alert if issues detected                    │
└─────────────────────────────────────────────────┘
```

---

## Stage 1: Validate

### What Happens
Every push triggers validation. This is the gatekeeper.

### Checks
| Check | Tool | Time | Must Pass? |
|-------|------|------|------------|
| Lint | ESLint + Prettier | 30s | Yes |
| Type check | TypeScript compiler | 45s | Yes |
| Unit tests | Jest | 90s | Yes |
| Security scan | npm audit + Snyk | 30s | Yes (no critical vulns) |

### Configuration
```yaml
# .github/workflows/validate.yml
name: Validate
on: [push, pull_request]
jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npm run lint
      - run: npm run typecheck
      - run: npm test
      - run: npm audit --audit-level=critical
```

### Failure Behavior
- **Lint fails:** PR blocked. Fix formatting.
- **Type check fails:** PR blocked. Fix types.
- **Unit tests fail:** PR blocked. Fix tests.
- **Security scan fails:** PR blocked. Update dependencies.

---

## Stage 2: Build

### What Happens
Code compiles. Frontend bundles. Docker images build. Images push to registry.

### Build Steps
```yaml
# .github/workflows/build.yml
name: Build
needs: validate
on:
  push:
    branches: [main, develop]
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npm run build
      - name: Build Docker image
        run: docker build -t kicknap-api:${{ github.sha }} .
      - name: Push to registry
        run: docker push kicknap-api:${{ github.sha }}
```

### Build Artifacts
| Artifact | Purpose | Stored |
|----------|---------|--------|
| `dist/` | Compiled TypeScript | GitHub Artifacts |
| `build/` | Bundled frontend | Vercel (auto) |
| Docker image | API container | GitHub Container Registry |

---

## Stage 3: Test

### What Happens
Integration tests, API tests, E2E tests run against a real database.

### Test Types
| Test | What It Tests | Time | Environment |
|------|--------------|------|-------------|
| Unit | Individual functions | 90s | In-memory |
| Integration | API endpoints + DB | 3-5 min | Test database |
| E2E | Full user flows (browser) | 5-10 min | Test environment |
| Performance | Response times under load | 5 min | Test environment |

### E2E Test Example
```javascript
// tests/e2e/booking-flow.test.js
describe('Booking Flow', () => {
  it('guest can book a space', async () => {
    // 1. Guest searches for spaces
    await page.goto('http://localhost:3000/search');
    await page.fill('[data-testid="search-input"]', 'Amsterdam Centrum');
    await page.click('[data-testid="search-button"]');
    
    // 2. Guest selects a space
    await page.click('[data-testid="listing-card-1"]');
    
    // 3. Guest selects time
    await page.click('[data-testid="time-slot-13:00"]');
    await page.click('[data-testid="time-slot-14:00"]');
    await page.click('[data-testid="time-slot-15:00"]');
    
    // 4. Guest confirms booking
    await page.click('[data-testid="book-now-button"]');
    
    // 5. Guest enters payment
    await page.fill('[data-testid="card-number"]', '4242424242424242');
    await page.fill('[data-testid="card-expiry"]', '12/28');
    await page.fill('[data-testid="card-cvc"]', '123');
    await page.click('[data-testid="pay-button"]');
    
    // 6. Verify booking confirmed
    await page.waitForSelector('[data-testid="booking-confirmed"]');
    const confirmation = await page.textContent('[data-testid="booking-id"]');
    expect(confirmation).toBeTruthy();
  });
});
```

### Test Database
```bash
# Test database is separate from dev/staging/production
TEST_DATABASE_URL=postgresql://localhost:5432/kicknap_test

# Migrations run fresh for each test suite
npm run db:migrate -- --env test

# Seed minimal test data
npm run db:seed -- --env test

# Run tests
npm run test:integration

# Cleanup after tests
npm run db:cleanup -- --env test
```

---

## Stage 4: Deploy

### Deployment Targets
| Branch | Deploy To | Trigger | Approval |
|--------|-----------|---------|----------|
| `feature/*` | None (preview URL) | Push | Auto |
| `develop` | dev.kicknap.com | Push to develop | Auto |
| `staging` | staging.kicknap.com | Manual | Auto |
| `main` | kicknap.com | Manual | **Required** |

### Preview Deployments
Every PR gets a preview URL:
```
PR #42 → https://pr-42.kicknap.dev
```
Reviewers can test changes before merging.

### Production Deployment Process
```
1. Create release branch
   git checkout -b release/v1.2.0 develop

2. Final testing on staging
   - Manual QA
   - Performance testing
   - Security review

3. Merge to main
   git checkout main
   git merge release/v1.2.0
   git tag v1.2.0
   git push origin main --tags

4. Deploy to production
   - Click "Deploy to Production" in GitHub Actions
   - Enter deployment notes
   - Approve deployment

5. Post-deployment
   - Health checks pass?
   - Error rate normal?
   - Response times normal?
   - Rollback if issues detected
```

### Rollback Process
```bash
# If deployment fails, rollback immediately
git revert HEAD
git push origin main

# Or rollback to specific version
git checkout v1.1.0
git push origin main --force  # ONLY in emergency

# Or use platform rollback
heroku rollback  # Heroku
railway rollback  # Railway
```

---

## Stage 5: Monitor

### Post-Deployment Monitoring
After every deploy, monitor for 30 minutes:

| Metric | Normal | Alert Threshold | Action |
|--------|--------|-----------------|--------|
| Error rate | < 0.1% | > 1% | Investigate |
| Response time (p95) | < 500ms | > 2s | Investigate |
| Response time (p99) | < 1s | > 5s | Investigate |
| CPU usage | < 50% | > 80% | Scale up |
| Memory usage | < 60% | > 85% | Scale up |
| Database connections | < 50% | > 80% | Scale up |

### Monitoring Dashboard
```
┌─────────────────────────────────────────────────────┐
│                 KICKNAP MONITORING                  │
├─────────────────────────────────────────────────────┤
│                                                     │
│  Error Rate: 0.02% ████████░░░░░░░░░░░░ OK         │
│  Response Time (p95): 342ms ████████░░░░ OK         │
│  Active Users: 247 ████████░░░░░░░░░░░ OK          │
│  Bookings Today: 89 ████████░░░░░░░░░░ OK          │
│                                                     │
│  Services:                                          │
│  ├─ Auth:      ✅ OK (12ms)                        │
│  ├─ Listing:   ✅ OK (8ms)                         │
│  ├─ Booking:   ✅ OK (15ms)                        │
│  ├─ Payment:   ✅ OK (22ms)                        │
│  ├─ Pricing:   ✅ OK (5ms)                         │
│  ├─ Notification: ⚠️ SLOW (850ms)                 │
│  ├─ Search:    ✅ OK (10ms)                        │
│  ├─ Review:    ✅ OK (7ms)                         │
│  └─ Admin:     ✅ OK (4ms)                         │
│                                                     │
│  Last Deploy: v1.2.0 (2 hours ago)                 │
│  Status: HEALTHY                                   │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

## Automated Quality Gates

### PR Merge Requirements
Before a PR can merge to `develop`:
- [ ] All CI checks pass
- [ ] At least 1 code review approved
- [ ] No merge conflicts
- [ ] Tests added for new features
- [ ] Documentation updated (if applicable)

### Production Deploy Requirements
Before deploying to production:
- [ ] All CI checks pass
- [ ] Staging tested and approved
- [ ] Changelog updated
- [ ] Database migrations backward-compatible
- [ ] Rollback plan documented
- [ ] Team notified
- [ ] Monitoring dashboard open

---

## Rollback Strategies

### Code Rollback
```bash
# Instant rollback to previous version
git revert HEAD
git push origin main

# Rollback to specific version
git revert <commit-hash>
git push origin main
```

### Database Rollback
```bash
# If migration causes issues
npm run db:migrate:undo

# If data corruption
pg_restore -d kicknap_production backup.dump
```

### Configuration Rollback
```bash
# Revert environment variables
# (stored in version control, except secrets)
git checkout HEAD~1 -- .env.production
```

---

## Emergency Procedures

### Severity Levels
| Level | Description | Response Time | Example |
|-------|-------------|---------------|---------|
| P0 | Site down, data loss | Immediate | Database crash, payment system failure |
| P1 | Major feature broken | < 1 hour | Booking system failing, auth broken |
| P2 | Minor feature broken | < 4 hours | Search slow, email delayed |
| P3 | Cosmetic issue | Next business day | UI bug, typo |

### Emergency Deploy
```
1. Create hotfix branch
   git checkout -b hotfix/critical-fix main

2. Fix the issue
   # Make minimal changes
   # Don't refactor, don't add features

3. Test the fix
   npm test
   npm run test:integration

4. Deploy to production
   # Skip staging if P0/P1
   # Deploy directly to production
   # Monitor closely

5. Merge back to develop
   git checkout develop
   git merge hotfix/critical-fix
   git push origin develop

6. Delete hotfix branch
   git branch -d hotfix/critical-fix
   git push origin --delete hotfix/critical-fix
```

### Communication During Emergencies
| Severity | Internal | External |
|----------|----------|----------|
| P0 | Slack #incidents + SMS | Status page updated |
| P1 | Slack #incidents | Status page updated |
| P2 | Slack #incidents | No communication needed |
| P3 | GitHub issue | No communication needed |

---

## Summary: CI/CD Rules

1. **Every push is validated.** No exceptions.
2. **Tests must pass before merge.** No shortcuts.
3. **Staging is production's mirror.** Test there first.
4. **Production deploys are manual.** With approval.
5. **Rollback is always an option.** Have a plan.
6. **Monitor after every deploy.** 30 minutes minimum.
7. **Emergencies get fast lanes.** But still tested.
