# kicknap — Scaling Strategy

## Scaling Philosophy

Scale **before you need it**, not after you're on fire.

The goal: Handle 10x more users than you expect, with infrastructure
that can grow without rewriting code.

---

## Scaling Tiers

### Tier 1: Launch (0-1,000 users)
**Infrastructure:**
- Single server (4 vCPU, 8GB RAM)
- PostgreSQL on same server
- Redis on same server
- Vercel for frontend (static)
- Cloudflare for CDN

**Cost:** ~€80/month
**Capacity:** ~500 concurrent users, ~10,000 requests/minute

```
┌─────────────────────────────────────┐
│         SINGLE SERVER (€50/mo)      │
│  API + PostgreSQL + Redis           │
└─────────────────────────────────────┘
        │
   ┌────┴────┐
   │ Vercel  │ (frontend, €0)
   │Cloudflare│ (CDN, €0)
   └─────────┘
```

**When to upgrade:** When you hit 300+ concurrent users consistently.

---

### Tier 2: Growth (1,000-10,000 users)
**Infrastructure:**
- Separate API server (4 vCPU, 8GB RAM)
- Managed PostgreSQL (4 vCPU, 8GB RAM, automatic backups)
- Managed Redis (2GB, clustering)
- Load balancer (1 server)
- Vercel for frontend
- Cloudflare for CDN

**Cost:** ~€300/month
**Capacity:** ~3,000 concurrent users, ~50,000 requests/minute

```
┌─────────────────────────────────────┐
│        LOAD BALANCER (€20/mo)       │
└─────────────────────────────────────┘
        │              │
   ┌────┴────┐   ┌────┴────┐
   │ API #1  │   │ API #2  │ (€50/mo each)
   └────┬────┘   └────┬────┘
        │              │
   ┌────┴──────────────┴────┐
   │ PostgreSQL Managed     │ (€100/mo)
   │ + Redis Managed        │ (€30/mo)
   └────────────────────────┘
```

**When to upgrade:** When you hit 3,000+ concurrent users consistently.

---

### Tier 3: Scale (10,000-100,000 users)
**Infrastructure:**
- Kubernetes cluster (3+ nodes)
- Each bubble in its own container
- Auto-scaling (2-10 pods per service)
- Managed PostgreSQL (8 vCPU, 16GB RAM, read replicas)
- Managed Redis cluster (4GB, 3 nodes)
- Load balancer (managed)
- Vercel for frontend
- Cloudflare for CDN + WAF

**Cost:** ~€1,500/month
**Capacity:** ~30,000 concurrent users, ~500,000 requests/minute

```
┌─────────────────────────────────────────────────┐
│              MANAGED LOAD BALANCER               │
└─────────────────────────────────────────────────┘
        │              │              │
   ┌────┴────┐   ┌────┴────┐   ┌────┴────┐
   │ K8s Node│   │ K8s Node│   │ K8s Node│
   │ (API +  │   │ (API +  │   │ (API +  │
   │ bubbles)│   │ bubbles)│   │ bubbles)│
   └────┬────┘   └────┬────┘   └────┬────┘
        │              │              │
   ┌────┴──────────────┴──────────────┴────┐
   │ PostgreSQL (primary + 2 read replicas) │
   │ + Redis Cluster (3 nodes)              │
   └────────────────────────────────────────┘
```

**When to upgrade:** When you hit 30,000+ concurrent users consistently.

---

### Tier 4: Enterprise (100,000+ users)
**Infrastructure:**
- Multi-region deployment (EU + US)
- Global load balancer (Cloudflare Load Balancer)
- PostgreSQL with cross-region replication
- Redis with cross-region replication
- CDN edge caching (Cloudflare)
- Dedicated monitoring team

**Cost:** ~€5,000-10,000/month
**Capacity:** 100,000+ concurrent users, unlimited

---

## Database Scaling

### Write Scaling (Handling more bookings)
| Phase | Strategy | Details |
|-------|----------|---------|
| Tier 1 | Single PostgreSQL | Handles ~1,000 writes/second |
| Tier 2 | Connection pooling (PgBouncer) | Handles ~5,000 writes/second |
| Tier 3 | Write partitioning | Partition bookings by month |
| Tier 4 | Sharding | Split by city/region |

### Read Scaling (Handling more searches/views)
| Phase | Strategy | Details |
|-------|----------|---------|
| Tier 1 | Redis cache | Cache search results, listing details |
| Tier 2 | Read replica | Separate read traffic from writes |
| Tier 3 | Multiple read replicas | Load balance reads across replicas |
| Tier 4 | Edge caching | Cache at CDN level |

### Connection Pooling (PgBouncer)
```
Without PgBouncer:
API Server → PostgreSQL (100 connections)
API Server → PostgreSQL (100 connections)
API Server → PostgreSQL (100 connections)
= 300 connections (PostgreSQL max: 200) → CRASH

With PgBouncer:
API Server → PgBouncer (pool: 20 connections each)
API Server → PgBouncer (pool: 20 connections each)
API Server → PgBouncer (pool: 20 connections each)
= 60 connections to PostgreSQL → HEALTHY
```

---

## Caching Strategy

### What We Cache
| Data | TTL | Cache Layer | Invalidated When |
|------|-----|-------------|-----------------|
| Search results | 5 minutes | Redis | Listing updated/deleted |
| Listing details | 10 minutes | Redis | Listing updated/deleted |
| Pricing suggestions | 6 hours | Redis | New Airbnb data scraped |
| User session | 24 hours | Redis | User logs out |
| Static assets | 1 week | Cloudflare CDN | New deployment |
| API responses | 1 minute | Redis | Any write operation |

### Cache Invalidation Rules
```
Listing updated → Invalidate: listing:{id}, search:*
Booking created → Invalidate: availability:{listing_id}:*
User updated → Invalidate: user:{id}
Price updated → Invalidate: pricing:{listing_id}
```

### Cache Stampede Prevention
When cache expires, only ONE request rebuilds it. Others wait.

```
Request 1 → Cache MISS → Acquires lock → Rebuilds cache → Releases lock
Request 2 → Cache MISS → Sees lock → Waits 100ms → Reads cached value
Request 3 → Cache MISS → Sees lock → Waits 100ms → Reads cached value
```

---

## Rate Limiting

### Limits per Endpoint
| Endpoint | Limit | Window | Why |
|----------|-------|--------|-----|
| `POST /auth/login` | 5 requests | 1 minute | Prevent brute force |
| `POST /auth/register` | 3 requests | 1 hour | Prevent spam |
| `GET /listings` | 100 requests | 1 minute | Prevent scraping |
| `POST /bookings` | 10 requests | 1 minute | Prevent booking spam |
| `POST /booking-requests` | 10 requests | 1 minute | Prevent request spam |
| `GET /search` | 60 requests | 1 minute | Prevent abuse |
| `POST /pricing/advise` | 30 requests | 1 minute | Prevent abuse |
| All other endpoints | 60 requests | 1 minute | General protection |

### Rate Limit Response
```json
{
    "error": "Rate limit exceeded",
    "message": "Too many requests. Please try again in 30 seconds.",
    "retryAfter": 30
}
```

### Rate Limit Headers
```
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 45
X-RateLimit-Reset: 1693000000
```

---

## Queue System (Background Jobs)

### What Goes in the Queue
| Job | Priority | Retry | Max Retries |
|-----|----------|-------|-------------|
| Booking confirmation email | High | Immediate | 3 |
| Price change notification | Medium | 5 min delay | 3 |
| Weekly earnings summary | Low | Scheduled (Monday 8am) | 2 |
| Security deposit release | Medium | Daily | 3 |
| Airbnb data scraping | Low | Every 6 hours | 2 |
| Pricing recalculation | Medium | After scraping | 2 |

### Queue Architecture
```
API Server → Redis Queue → Worker Process → Job Completed
                         ↓
                    Job Failed
                         ↓
                    Retry (up to 3 times)
                         ↓
                    Max Retries Hit
                         ↓
                    Dead Letter Queue
                         ↓
                    Alert Sent to Admin
```

### Dead Letter Queue
When a job fails 3 times, it goes to a dead letter queue.
We get an alert. We investigate. We fix the issue. We replay the job.

---

## Auto-Scaling Rules

### When to Scale Up
| Metric | Threshold | Action |
|--------|-----------|--------|
| CPU usage | > 70% for 5 minutes | Add 1 API server |
| Memory usage | > 75% for 5 minutes | Add 1 API server |
| Queue depth | > 500 for 10 minutes | Add 1 worker |
| DB connections | > 80% of max | Add read replica |

### When to Scale Down
| Metric | Threshold | Action |
|--------|-----------|--------|
| CPU usage | < 30% for 30 minutes | Remove 1 API server |
| Memory usage | < 40% for 30 minutes | Remove 1 API server |
| Queue depth | < 50 for 30 minutes | Remove 1 worker |

### Scaling Limits
| Resource | Min | Max | Cooldown |
|----------|-----|-----|----------|
| API servers | 2 | 10 | 5 minutes |
| Workers | 1 | 5 | 5 minutes |
| Read replicas | 0 | 3 | 30 minutes |

---

## Disaster Recovery

### Backup Strategy
| Data | Frequency | Retention | Storage |
|------|-----------|-----------|---------|
| PostgreSQL | Every 6 hours | 30 days | S3 (encrypted) |
| PostgreSQL WAL | Continuous | 7 days | S3 (encrypted) |
| Redis | Every hour | 7 days | S3 (encrypted) |
| User uploads | Real-time | Forever | S3 (versioned) |
| Configuration | Every deploy | Forever | Git |

### Recovery Time Objectives
| Scenario | RTO (Recovery Time) | RPO (Data Loss) |
|----------|---------------------|-----------------|
| Single bubble crash | < 2 minutes | 0 (no data loss) |
| Database crash | < 15 minutes | < 6 hours (last backup) |
| Server crash | < 30 minutes | < 6 hours (last backup) |
| Region outage | < 4 hours | < 1 hour (WAL shipping) |
| Complete disaster | < 24 hours | < 6 hours (last backup) |

### Failover Process
```
1. Primary database fails
2. Read replica detected as stale
3. Promote read replica to primary
4. Update connection strings
5. Alert sent to admin
6. Old primary rebuilt from backup
7. New primary starts accepting writes
```

---

## Cost Projections

| Phase | Users | Monthly Cost | Revenue Needed | Break-Even |
|-------|-------|-------------|----------------|------------|
| Tier 1 | 1,000 | €80 | €800 | 10 bookings/day |
| Tier 2 | 10,000 | €300 | €3,000 | 30 bookings/day |
| Tier 3 | 100,000 | €1,500 | €15,000 | 150 bookings/day |
| Tier 4 | 1,000,000 | €5,000 | €50,000 | 500 bookings/day |

**Rule:** Infrastructure cost should never exceed 10% of revenue.
If it does, you're scaling too fast or undercharging.

---

## Summary: Scaling Checklist

- [ ] Tier 1 infrastructure ready for launch
- [ ] Redis caching implemented
- [ ] Rate limiting configured
- [ ] Queue system for background jobs
- [ ] Health checks on all endpoints
- [ ] Monitoring + alerting configured
- [ ] Backup strategy tested
- [ ] Auto-scaling rules defined
- [ ] Disaster recovery plan documented
- [ ] Cost monitoring in place
