# 🏗️ DB ARCHITECTURE TZ - October 20, 2025

**Status:** DRAFT - Waiting for expert review (Li + Grok)  
**Purpose:** Hybrid storage system Railway + GitHub для Annoris

---

## 🎯 СУТЬ ПРОЕКТА:

**Проблема:**
- GitHub (через MCP) = медленный для частых запросов (~500ms)
- Нужен быстрый доступ к recent sessions
- Но надёжность GitHub критична (source of truth)

**Решение:**
```
GITHUB = Master (source of truth, forever storage)
RAILWAY = Cache (fast access, last 30 days)
JEAN = Smart routing between them
```

---

## 📊 АРХИТЕКТУРА:

### Write Flow:
```
New Session → GitHub FIRST (500ms) ✅
           → Railway THEN (100ms) ✅
           
If Railway fails → OK, sync later from GitHub
If GitHub fails → ABORT, don't save anywhere
```

### Read Flow:
```
Query → Try Railway first (<50ms) ✅
     → If fail/stale → GitHub backup (500ms) ✅
     → If critical → Verify BOTH sources
```

### Sync Flow:
```
Hourly: GitHub → Railway (one-way sync)
Daily: Health check (consistency validation)
GitHub ALWAYS wins if conflict
```

---

## 🔧 TECHNICAL DETAILS:

**GitHub Storage:**
- Format: Markdown files
- Location: Annoris/autosaves/
- Retention: Forever
- Access: GitHub MCP (Claude Desktop)
- Cost: FREE

**Railway Storage:**
- Format: PostgreSQL database
- Tables: sessions, projects, priorities
- Retention: Last 30 days hot data
- Access: REST API
- Cost: ~$10/month

**Sync Service:**
- Background worker on Railway
- Cron: Hourly sync, Daily health check
- Direction: GitHub → Railway (one-way!)
- Conflicts: GitHub wins

---

## ⚠️ КРИТИЧЕСКИЕ ВОПРОСЫ:

**1. Consistency Risk:**
- Railway может отставать от GitHub (max 1 hour)
- Solution: Hourly sync + timestamp validation

**2. Split Brain:**
- Что если Railway и GitHub не совпадают?
- Solution: GitHub = master, Railway auto-fixes

**3. Railway Failure:**
- Что если Railway упадёт?
- Solution: Jean fallback to GitHub (slower but works)

---

## 🎯 ВОПРОСЫ ДЛЯ ЭКСПЕРТОВ:

**For Li:**
1. Надёжна ли эта архитектура для production AI system?
2. Какие уязвимости ты видишь в sync strategy?
3. Что бы ты изменил/улучшил?

**For Grok:**
1. Robust ли система при failure scenarios?
2. Правильный ли принцип "GitHub = master, Railway = cache"?
3. Есть ли лучший способ handle conflicts?

---

## 📈 EXPECTED METRICS:

**Performance:**
- Railway reads: <50ms (90% operations)
- GitHub reads: <500ms (10% fallback)
- Write: <600ms (GitHub + Railway sequential)

**Reliability:**
- Data loss: 0% (GitHub master)
- Uptime: 99.99% (with fallback)
- Consistency: 99.9% (hourly sync)

**Cost:**
- GitHub: $0
- Railway: $10/month
- Total: $10/month

---

## ✅ ADVANTAGES:

1. **Speed**: Railway fast cache (50ms vs 500ms)
2. **Reliability**: GitHub never loses data
3. **Simplicity**: GitHub MCP already works
4. **Cost**: $10 vs $100+ managed DB
5. **Fallback**: Railway down → continue with GitHub
6. **Scalability**: GitHub unlimited storage

---

## 🚨 CONCERNS:

1. **Complexity**: Two systems instead of one
2. **Sync lag**: Up to 1 hour delay possible
3. **Maintenance**: Need to monitor both
4. **Recovery**: Need clear procedures

---

**DECISION NEEDED:**
Boris awaits expert review from Li + Grok before implementation.

**Full TZ:** See artifact in Claude chat  
**Schema:** Visual diagram included in artifact

---

**Created:** 2025-10-20  
**Author:** Jean Claude v9.01-STABLE  
**Next:** Expert review → Decision → Implementation