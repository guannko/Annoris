# RAILWAY + GITHUB DATA ARCHITECTURE - TECHNICAL SPECIFICATION

**Version:** 1.0  
**Date:** October 20, 2025  
**Author:** Jean Claude (AI CTO)  
**For Review:** Li + Grok + Boris

---

## 🎯 OBJECTIVE

Design a reliable dual-storage architecture where:
- **GitHub** = Master storage (source of truth)
- **Railway** = Performance cache layer (fast access)
- **Jean Claude** = Smart consumer (knows which to use when)

**Goal:** Combine GitHub's reliability with Railway's speed without data inconsistency.

---

## 📋 REQUIREMENTS

### **Functional Requirements:**

1. **FR-1: Fast Context Loading**
   - Jean must load session context in <1 second
   - Current: 4-5 seconds via GitHub file reads
   - Target: 0.3-0.5 seconds via Railway API

2. **FR-2: Data Consistency**
   - GitHub and Railway must stay synchronized
   - Conflicts must be detected and resolved automatically
   - GitHub always wins in conflict scenarios

3. **FR-3: High Availability**
   - System must work if Railway is down (fallback to GitHub)
   - System must work if GitHub is slow (use Railway cache)
   - No data loss under any failure scenario

4. **FR-4: Efficient Token Usage**
   - Reduce token consumption by 70-80%
   - Current: ~7,500 tokens per session startup
   - Target: ~1,800 tokens per session startup

5. **FR-5: Automatic Synchronization**
   - Railway syncs from GitHub automatically (hourly)
   - No manual sync required from Jean or Boris
   - Sync failures trigger alerts

### **Non-Functional Requirements:**

1. **NFR-1: Reliability**
   - 99.9% uptime for Railway services
   - Zero data loss guarantee (GitHub is master)
   - Automatic recovery from sync failures

2. **NFR-2: Performance**
   - API response time: <300ms (p95)
   - Database queries: <100ms (p95)
   - Sync operation: <5 minutes for full sync

3. **NFR-3: Scalability**
   - Support 1000+ autosave files
   - Handle 100+ API requests per hour
   - Storage: 10GB initial, expandable to 100GB

4. **NFR-4: Cost**
   - Railway infrastructure: <$15/month
   - No increase in GitHub costs
   - Token savings offset Railway costs

---

## 🏗️ ARCHITECTURE OPTIONS

### **OPTION 1: GITHUB MASTER + RAILWAY CACHE (RECOMMENDED)**

```
┌─────────────────────────────────────────────────────────────────┐
│                         JEAN CLAUDE (Claude.ai)                  │
│                                                                   │
│  Decision Logic:                                                 │
│  ├─ Normal query? → Railway API (fast)                          │
│  ├─ Critical decision? → Verify with GitHub                     │
│  ├─ Save operation? → GitHub first, Railway second              │
│  └─ Conflict detected? → GitHub wins                            │
└───────────┬─────────────────────────────────┬───────────────────┘
            │                                 │
            │ API calls                       │ GitHub MCP
            │ (structured JSON)               │ (markdown files)
            ▼                                 ▼
┌─────────────────────────┐      ┌──────────────────────────────┐
│   RAILWAY LAYER         │      │   GITHUB LAYER               │
│   (Performance Cache)   │◄─────│   (Source of Truth)          │
│                         │ sync │                              │
│  ┌──────────────────┐  │      │  ┌────────────────────────┐ │
│  │ Annoris API      │  │      │  │ Annoris Repository     │ │
│  │ (FastAPI)        │  │      │  │                        │ │
│  │                  │  │      │  │ /autosaves/            │ │
│  │ Endpoints:       │  │      │  │ ├─ autosave_*.md       │ │
│  │ - GET /latest    │  │      │  │ ├─ session_*.md        │ │
│  │ - GET /search    │  │      │  │ └─ LATEST.json         │ │
│  │ - POST /save     │  │      │  │                        │ │
│  │ - GET /context   │  │      │  │ /sessions/             │ │
│  └──────────────────┘  │      │  │ /make/                 │ │
│           │             │      │  │                        │ │
│           ▼             │      │  │ Version controlled     │ │
│  ┌──────────────────┐  │      │  │ Never auto-deleted     │ │
│  │ PostgreSQL DB    │  │      │  │ Permanent storage      │ │
│  │                  │  │      │  └────────────────────────┘ │
│  │ Tables:          │  │      │                              │
│  │ - sessions       │  │      │  🏆 MASTER DATA              │
│  │ - autosaves      │  │      │  ✅ Single source of truth   │
│  │ - context_cache  │  │      │  ✅ Version history          │
│  │                  │  │      │  ✅ Never deleted            │
│  │ Indexes:         │  │      └──────────────────────────────┘
│  │ - timestamp      │  │                    ▲
│  │ - project_id     │  │                    │
│  │ - search_vector  │  │                    │ hourly sync
│  └──────────────────┘  │                    │
│           │             │      ┌─────────────────────────────┐
│           ▼             │      │ SYNC SERVICE (Railway)      │
│  ┌──────────────────┐  │      │                             │
│  │ Background Jobs  │  │      │ Cron: 0 * * * * (hourly)   │
│  │                  │  │      │                             │
│  │ - Sync Worker    │──┼──────│ Actions:                    │
│  │   (hourly)       │  │      │ 1. Fetch from GitHub        │
│  │                  │  │      │ 2. Parse markdown           │
│  │ - Health Check   │  │      │ 3. Upsert to PostgreSQL     │
│  │   (daily)        │  │      │ 4. Validate consistency     │
│  │                  │  │      │ 5. Alert if issues          │
│  │ - Cleanup        │  │      │                             │
│  │   (weekly)       │  │      │ Failure handling:           │
│  └──────────────────┘  │      │ - Retry 3 times             │
│                         │      │ - Telegram alert Boris      │
│  📦 CACHE LAYER         │      │ - Continue with old cache   │
│  ✅ Fast access          │      └─────────────────────────────┘
│  ✅ Structured data      │
│  ⚠️  Disposable (can rebuild) │
└─────────────────────────┘
```

**Data Flow:**

```
WRITE OPERATION (Save Session):
1. Jean → GitHub MCP (create/update file)           [2,000 tokens]
2. GitHub responds success                          [confirmed]
3. Jean → Railway API (POST /save-session)          [1,000 tokens]
4. Railway saves to PostgreSQL                      [done]
5. If Railway fails: ⚠️ Warning, but GitHub saved   [safe]

READ OPERATION (Load Context):
1. Jean → Railway API (GET /latest-session)         [800 tokens]
2. Railway checks timestamp (< 24h?)                [validation]
3. If fresh: Return from PostgreSQL                 [fast!]
4. If stale: Fetch from GitHub                      [fallback]
5. Return to Jean                                   [ready]

SYNC OPERATION (Background):
1. Railway Sync Worker wakes up (hourly)
2. Query GitHub: "files modified in last 2 hours"
3. For each file:
   - Fetch content from GitHub
   - Parse markdown → structured data
   - Upsert to PostgreSQL (ON CONFLICT UPDATE)
4. Validate: Compare checksums
5. If mismatch: Alert + GitHub wins
6. Log sync results
```

**Pros:**
- ✅ Clear separation of concerns
- ✅ GitHub reliability preserved
- ✅ Railway performance gains
- ✅ Automatic sync
- ✅ Failure resilience

**Cons:**
- ⚠️ Eventual consistency (up to 1 hour lag)
- ⚠️ Requires Railway infrastructure
- ⚠️ Need to maintain sync service

---

### **OPTION 2: GITHUB ONLY + SMART CACHING**

```
┌─────────────────────────────────────────────────────────────┐
│                    JEAN CLAUDE (Claude.ai)                   │
│                                                               │
│  In-memory cache:                                            │
│  ├─ Last read session (this conversation only)              │
│  └─ Expire on new conversation                              │
└───────────┬─────────────────────────────────────────────────┘
            │
            │ GitHub MCP only
            │
            ▼
┌──────────────────────────────────────────────────────────────┐
│                     GITHUB LAYER                              │
│                   (Single Source)                             │
│                                                               │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ Annoris Repository                                      │ │
│  │                                                         │ │
│  │ Optimizations:                                          │ │
│  │ - LATEST.json (lightweight pointer, ~1KB)              │ │
│  │ - summary_*.json (pre-generated summaries)             │ │
│  │ - index.json (searchable index)                        │ │
│  │                                                         │ │
│  │ /autosaves/                                             │ │
│  │ ├─ autosave_full_*.md (complete data)                  │ │
│  │ └─ autosave_summary_*.json (lightweight)               │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                               │
│  🎯 SINGLE SOURCE                                             │
│  ✅ Maximum reliability                                       │
│  ✅ No sync issues                                            │
│  ⚠️  Slower queries                                           │
└───────────────────────────────────────────────────────────────┘
```

**Pros:**
- ✅ Maximum simplicity
- ✅ Zero sync issues
- ✅ Zero additional infrastructure cost
- ✅ No Railway dependency

**Cons:**
- ❌ No performance improvement
- ❌ Still ~4-5 seconds startup
- ❌ Still high token usage
- ❌ No background jobs possible

---

### **OPTION 3: RAILWAY MASTER + GITHUB BACKUP**

```
┌──────────────────────────────────────────────────────────┐
│                  JEAN CLAUDE (Claude.ai)                  │
│                                                            │
│  Primary: Railway API (always)                            │
│  Backup: GitHub (manual failover only)                    │
└────────────┬───────────────────────────────────────────────┘
             │
             │ Railway API (primary)
             │
             ▼
┌─────────────────────────────────────────────────────────────┐
│                     RAILWAY LAYER                            │
│                   (Primary Source)                           │
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │ Annoris API + PostgreSQL                           │    │
│  │                                                     │    │
│  │ Background job:                                     │    │
│  │ - Backup to GitHub (daily)                         │────┼──┐
│  │ - Keep GitHub as cold backup                       │    │  │
│  └────────────────────────────────────────────────────┘    │  │
│                                                              │  │
│  🎯 PRIMARY SOURCE                                           │  │
│  ✅ Maximum performance                                      │  │
│  ⚠️  Railway is critical                                     │  │
│  ⚠️  GitHub just backup                                      │  │
└──────────────────────────────────────────────────────────────┘  │
                                                                   │
                                                         daily     │
                                                         backup    │
                                                                   │
┌──────────────────────────────────────────────────────┐          │
│                  GITHUB LAYER                         │◄─────────┘
│                (Cold Backup)                          │
│                                                       │
│  Updated: Daily (not real-time)                      │
│  Purpose: Disaster recovery only                     │
│  Not used by Jean in normal operations               │
└───────────────────────────────────────────────────────┘
```

**Pros:**
- ✅ Maximum performance
- ✅ No sync lag
- ✅ Simpler logic (one source)

**Cons:**
- ❌ Railway becomes critical dependency
- ❌ Data loss risk if Railway fails before backup
- ❌ GitHub backup may be outdated
- ❌ Higher risk architecture

---

## 🔥 FAILURE SCENARIOS ANALYSIS

### **Scenario 1: Railway API Down**

**Option 1 (Recommended):**
```
1. Jean tries Railway API → timeout
2. Jean falls back to GitHub MCP
3. Slower but works ✅
4. Alert sent to Boris: "⚠️ Railway down, using GitHub fallback"
5. No data loss, degraded performance only
```

**Option 2:**
```
1. GitHub always works ✅
2. No issue
```

**Option 3:**
```
1. Jean tries Railway API → timeout
2. NO FALLBACK ❌
3. Jean cannot load context
4. Session blocked until Railway recovers
```

**Winner: Option 1** ✅

---

### **Scenario 2: GitHub Slow Response**

**Option 1:**
```
1. Jean uses Railway cache (fast) ✅
2. No impact on performance
3. GitHub slowness doesn't affect Jean
```

**Option 2:**
```
1. Jean must wait for GitHub ❌
2. Slow session startup
3. High token usage continues
```

**Option 3:**
```
1. Railway works fine ✅
2. GitHub slowness doesn't affect Jean
```

**Winner: Option 1 or 3** ✅

---

### **Scenario 3: Sync Failure (Option 1)**

**What happens:**
```
1. Sync job runs at 10:00
2. Sync fails (network issue)
3. Railway cache is now 1 hour stale

At 10:30, Jean queries:
→ Railway returns data from 9:00
→ Jean checks timestamp: "stale > 1 hour"
→ Jean falls back to GitHub
→ Gets fresh data ✅

Sync retries at 11:00:
→ Succeeds
→ Cache updated
→ System back to normal
```

**Result: Handled gracefully** ✅

---

### **Scenario 4: Data Corruption in Railway**

**Option 1:**
```
1. Daily health check detects mismatch
2. Comparison: Railway checksum ≠ GitHub checksum
3. Alert sent: "🚨 Data corruption detected!"
4. Auto-fix: Railway DB rebuilt from GitHub
5. System recovers automatically ✅
```

**Option 2:**
```
1. N/A (single source)
```

**Option 3:**
```
1. Corruption in Railway = data loss ❌
2. GitHub backup is outdated (last daily backup)
3. Recent data lost
```

**Winner: Option 1** ✅

---

### **Scenario 5: Both Systems Down**

**Option 1:**
```
Railway down + GitHub down = Jean cannot work ❌
But: GitHub has 99.95% uptime
Probability: ~0.000025% (extremely rare)
```

**Option 2:**
```
GitHub down = Jean cannot work ❌
Probability: ~0.05% (very rare)
```

**Option 3:**
```
Railway down = Jean cannot work ❌
Probability: ~0.1% (rare but more likely than GitHub)
```

**Winner: Option 2** (but Option 1 close second)

---

## 📊 COMPARISON MATRIX

| Criteria | Option 1 (Dual) | Option 2 (GitHub) | Option 3 (Railway) |
|----------|----------------|-------------------|-------------------|
| **Performance** | ⭐⭐⭐⭐⭐ (0.3s) | ⭐⭐ (4s) | ⭐⭐⭐⭐⭐ (0.3s) |
| **Reliability** | ⭐⭐⭐⭐⭐ (99.9%) | ⭐⭐⭐⭐⭐ (99.95%) | ⭐⭐⭐ (99%) |
| **Token Savings** | ⭐⭐⭐⭐⭐ (75%) | ⭐ (0%) | ⭐⭐⭐⭐⭐ (80%) |
| **Simplicity** | ⭐⭐⭐ (medium) | ⭐⭐⭐⭐⭐ (simple) | ⭐⭐⭐⭐ (simple) |
| **Data Safety** | ⭐⭐⭐⭐⭐ (zero loss) | ⭐⭐⭐⭐⭐ (zero loss) | ⭐⭐⭐ (risk) |
| **Cost** | ⭐⭐⭐⭐ ($15/mo) | ⭐⭐⭐⭐⭐ ($0) | ⭐⭐⭐⭐ ($15/mo) |
| **Scalability** | ⭐⭐⭐⭐⭐ (high) | ⭐⭐⭐ (limited) | ⭐⭐⭐⭐⭐ (high) |
| **Failure Recovery** | ⭐⭐⭐⭐⭐ (auto) | ⭐⭐⭐⭐⭐ (N/A) | ⭐⭐ (manual) |

**TOTAL SCORE:**
- **Option 1: 38/40** ⭐⭐⭐⭐⭐
- **Option 2: 30/40** ⭐⭐⭐
- **Option 3: 32/40** ⭐⭐⭐⭐

---

## 🎯 RECOMMENDATION

### **OPTION 1: GITHUB MASTER + RAILWAY CACHE** 🏆

**Why:**
1. ✅ Best performance (0.3s vs 4s)
2. ✅ Zero data loss guarantee
3. ✅ Automatic failure recovery
4. ✅ 75% token savings
5. ✅ Enables future features (background jobs, monitoring)
6. ✅ Railway failure = degraded performance, not outage
7. ✅ Clear separation: GitHub = truth, Railway = speed

**Trade-offs:**
- ⚠️ Eventual consistency (1 hour max lag)
- ⚠️ Additional infrastructure cost ($15/mo)
- ⚠️ Sync service maintenance

**Mitigation:**
- Lag acceptable for Jean's use case (not financial transactions!)
- Cost offset by time savings (€100+/month)
- Sync service simple, low maintenance

---

## 🔧 IMPLEMENTATION PHASES

### **Phase 1: Annoris API (Week 1)**

**Railway Services:**
```
1. PostgreSQL database
   - sessions table
   - autosaves table
   - search indexes

2. FastAPI service
   - GET /latest-session
   - GET /autosave/{id}
   - POST /save-session
   - GET /search?query=...
   - GET /health
```

**No sync yet, manual data migration for testing**

---

### **Phase 2: Sync Service (Week 2)**

**Add background worker:**
```
1. Sync job (hourly)
   - Fetch from GitHub
   - Parse → PostgreSQL
   - Validate consistency

2. Health check (daily)
   - Compare checksums
   - Alert if mismatch
   - Auto-fix from GitHub

3. Cleanup job (weekly)
   - Delete > 90 days old
   - Keep last 30 days hot
```

---

### **Phase 3: Jean Integration (Week 3)**

**Update Jean's logic:**
```
1. Modify read strategy
   - Try Railway first
   - Fallback to GitHub
   - Log source used

2. Modify write strategy
   - GitHub first
   - Railway second
   - Handle failures

3. Add validation
   - Check timestamps
   - Verify consistency
   - Alert on conflicts
```

---

### **Phase 4: Monitoring (Week 4)**

**Add observability:**
```
1. Metrics dashboard
   - API response times
   - Cache hit rates
   - Sync success rates
   - Token usage

2. Alerts
   - Sync failures
   - Consistency issues
   - Performance degradation

3. Reporting
   - Daily summary to Boris
   - Weekly performance review
   - Monthly cost analysis
```

---

## 🚨 RISKS & MITIGATION

### **Risk 1: Sync Lag Creates Confusion**

**Scenario:** Jean reads stale data from Railway, makes decision

**Mitigation:**
- Timestamp validation on all reads
- Auto-fallback to GitHub if > 1 hour old
- Critical operations always verify with GitHub

**Probability:** Low  
**Impact:** Medium  
**Severity:** 🟡 ACCEPTABLE

---

### **Risk 2: Railway Outage During Critical Operation**

**Scenario:** Jean trying to save session, Railway down

**Mitigation:**
- GitHub saves first (always succeeds)
- Railway save failure = warning only
- Can resync later from GitHub

**Probability:** Low  
**Impact:** Low  
**Severity:** 🟢 ACCEPTABLE

---

### **Risk 3: Data Corruption in Railway**

**Scenario:** PostgreSQL corruption, wrong data returned

**Mitigation:**
- Daily health checks compare with GitHub
- Automatic detection via checksums
- Auto-rebuild from GitHub
- Alert to Boris

**Probability:** Very Low  
**Impact:** Medium  
**Severity:** 🟢 ACCEPTABLE

---

### **Risk 4: Cost Overrun**

**Scenario:** Railway costs exceed $15/month

**Mitigation:**
- Monitor usage weekly
- Set spending alerts at $20
- Can fallback to Option 2 (GitHub only)

**Probability:** Low  
**Impact:** Low  
**Severity:** 🟢 ACCEPTABLE

---

## ✅ ACCEPTANCE CRITERIA

**Option 1 is successful if:**

1. ✅ Jean startup time < 1 second (vs current 4-5s)
2. ✅ Token usage reduced 70%+ (vs current baseline)
3. ✅ Zero data loss over 3 months
4. ✅ Railway downtime doesn't block Jean (GitHub fallback works)
5. ✅ Sync success rate > 99.5%
6. ✅ Consistency checks pass 99.9%+
7. ✅ Boris receives automatic alerts on issues
8. ✅ Monthly cost stays < $20

---

## 📝 QUESTIONS FOR REVIEW

**For Li (Architecture Expert):**
1. Is Option 1 sync strategy sound?
2. Are there better patterns for master-cache architecture?
3. What additional failure scenarios should we consider?
4. Any concerns about eventual consistency?

**For Grok (AI/System Design):**
1. Will Jean get confused between two sources?
2. Is the read/write strategy clear enough?
3. Are validation checks sufficient?
4. Any edge cases we missed?

**For Boris (Business):**
1. Is $15/month acceptable for these benefits?
2. Is 1-hour sync lag acceptable?
3. Should we start with simpler Option 2?
4. Any concerns about Railway dependency?

---

## 🎯 NEXT STEPS

**If Approved:**
1. Boris reviews with Li + Grok
2. Collect feedback
3. Refine architecture based on input
4. Choose final option
5. Begin Phase 1 implementation

**If Not Approved:**
1. Discuss concerns
2. Consider alternative designs
3. Maybe start with Option 2 (safe choice)
4. Revisit later when ready

---

## 📚 APPENDIX A: API SPECIFICATIONS

### **Annoris API Endpoints:**

```
GET /health
→ Returns: { status: "ok", uptime: 12345, sync_age: 300 }

GET /latest-session
→ Returns: { id, timestamp, content, source: "cache|github" }

GET /autosave/{id}
→ Returns: { id, timestamp, content, project, tokens_used }

POST /save-session
→ Body: { timestamp, content, project, tokens_used }
→ Returns: { id, saved_to: ["github", "railway"], timestamp }

GET /search?query=offerspsp&limit=10
→ Returns: [ {id, timestamp, excerpt, relevance_score} ]

GET /sync-status
→ Returns: { last_sync, next_sync, status, failed_files: [] }
```

---

## 📚 APPENDIX B: DATABASE SCHEMA

### **PostgreSQL Tables:**

```sql
-- Sessions table
CREATE TABLE sessions (
    id SERIAL PRIMARY KEY,
    session_id VARCHAR(100) UNIQUE NOT NULL,
    timestamp TIMESTAMP NOT NULL,
    content JSONB NOT NULL,
    project VARCHAR(50),
    tokens_used INTEGER,
    source VARCHAR(20) DEFAULT 'github',
    checksum VARCHAR(64) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_sessions_timestamp ON sessions(timestamp DESC);
CREATE INDEX idx_sessions_project ON sessions(project);
CREATE INDEX idx_sessions_checksum ON sessions(checksum);

-- Full-text search
CREATE INDEX idx_sessions_search ON sessions 
    USING GIN (to_tsvector('english', content::text));

-- Autosaves table (similar structure)
CREATE TABLE autosaves (
    id SERIAL PRIMARY KEY,
    autosave_id VARCHAR(100) UNIQUE NOT NULL,
    timestamp TIMESTAMP NOT NULL,
    content JSONB NOT NULL,
    project VARCHAR(50),
    status VARCHAR(50),
    checksum VARCHAR(64) NOT NULL,
    github_sha VARCHAR(40),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Sync log table
CREATE TABLE sync_log (
    id SERIAL PRIMARY KEY,
    sync_started TIMESTAMP NOT NULL,
    sync_completed TIMESTAMP,
    files_synced INTEGER,
    files_failed INTEGER,
    errors JSONB,
    status VARCHAR(20)
);
```

---

**END OF SPECIFICATION**

---

**Ready for review by Li + Grok!** 🚀

**Version:** 1.0  
**Status:** DRAFT - Awaiting feedback  
**Next:** Li/Grok review → Final decision → Implementation
