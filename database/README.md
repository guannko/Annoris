# 🗄️ Annoris API Database

Database schema and migration scripts for the Annoris API system.

## 📁 Files

- **`schema.sql`** - Complete database schema with tables, indexes, and views
- **`apply_schema.py`** - Python script to apply schema to Railway PostgreSQL

## 🏗️ Schema Overview

### Tables:

**`sessions`** - AI session storage (30-day hot cache)
- Primary fields: id, created_at, project_id, priority, status
- Content: AES-256 encrypted
- Validation: MD5 checksum
- Sync tracking: github_path, github_sha, last_synced

**`projects`** - Project metadata
- Tracking: name, status, priority
- Revenue: target_revenue, current_revenue
- 4 initial projects: OffersPSP, Brain Index GEO, Make.com Products, Annoris

**`sync_log`** - Synchronization tracking
- GitHub ↔ Railway sync history
- JSONB details for error tracking
- Success rate monitoring

### Views:

- `recent_sessions` - Last 7 days sessions with project names
- `sync_health` - 30-day sync statistics and success rate
- `project_stats` - Project progress and session counts

### Indexes:

Performance indexes on:
- sessions: project_id, created_at, github_path, status
- projects: name, status
- sync_log: synced_at, status

## 🚀 Usage

### Apply Schema to Railway:

```bash
# Set DATABASE_URL from Railway
export DATABASE_URL="postgresql://postgres:PASSWORD@HOST:PORT/railway"

# Apply schema
python apply_schema.py
```

The script will:
1. Connect to PostgreSQL
2. Apply complete schema
3. Verify tables, indexes, and views
4. Show initial data (4 projects)

### Expected Output:

```
🔗 Connecting to PostgreSQL...
📊 Applying schema...

✅ Schema applied successfully!

📋 Created tables: 3
   - projects
   - sessions
   - sync_log

🔍 Created indexes: 8
   - idx_projects_name
   - idx_projects_status
   - idx_sessions_created_at
   - idx_sessions_github_path
   - idx_sessions_project_id
   - idx_sessions_status
   - idx_sync_log_status
   - idx_sync_log_synced_at

👁️ Created views: 3
   - project_stats
   - recent_sessions
   - sync_health

🎯 Projects initialized: 4
   - OffersPSP: PRODUCTION (€10,000.00 target)
   - Brain Index GEO: NEAR_PRODUCTION (€250,000.00 target)
   - Make.com Products: ACTIVE (€0.00 target)
   - Annoris: DEVELOPMENT (€200,000.00 target)

🎉 Database ready!
```

## 🔗 Railway Connection

The DATABASE_URL is automatically provided by Railway:
- Internal: `postgresql://postgres:PASSWORD@postgres.railway.internal:5432/railway`
- External: `postgresql://postgres:PASSWORD@yamanote.proxy.rlwy.net:PORT/railway`

## 📊 Architecture

```
GitHub (Master)
    ↓
    ↓ Webhooks + Cron
    ↓
PostgreSQL (Railway)
    ↓
    ├── sessions (30-day cache)
    ├── projects (metadata)
    └── sync_log (tracking)
    ↓
Redis (Emergency cache)
```

## ✅ Next Steps

After applying schema:
1. Create FastAPI service
2. Implement sync workers
3. Setup GitHub webhooks
4. Add monitoring
5. Test endpoints

---

**Version:** 1.0  
**Date:** 2025-10-20  
**Author:** Jean Claude v9.01-STABLE
