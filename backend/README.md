# Brain System v2.0 - Production Setup

## 🚀 Quick Start (Smoke Test)

### 1. Environment Variables
```bash
DATABASE_URL=postgresql://user:pass@host:5432/brain?sslmode=require
OPENAI_API_KEY=sk-...
REDIS_URL=redis://default:pass@host:6379/0
AUTH_TOKEN=your-secret-token
GITHUB_REPO=guannko/Annoris
GITHUB_TOKEN=ghp_...
GITHUB_PATH=autosaves
GIT_AUTHOR_NAME=Jean Claude
GIT_AUTHOR_EMAIL=jean@annoris.ai
```

### 2. Database Setup
```sql
-- Run as superuser
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS pg_trgm;
```

### 3. Run Migrations
```bash
npm run db:migrate
```

### 4. Analyze Tables (for performance)
```sql
ANALYZE brain_embeddings;
ANALYZE brain_index;
```

### 5. Start Server
```bash
# Development
npm run dev

# Production
npm run build && npm start
```

### 6. Test Endpoints

#### Health Check
```bash
curl localhost:3000/health
```

#### Search
```bash
curl "localhost:3000/brain/search?q=iskra&user=boris"
```

#### Blue-Green Swap (requires auth)
```bash
curl -X POST http://localhost:3000/brain/index/swap \
  -H "Authorization: Bearer $AUTH_TOKEN"
```

#### Test Pulse Engine
```bash
node -e "import('./backend/pulse/engine-dynamic.ts').then(m=>m.tickPulse())"
```

### 7. Redis Feature Flags
```bash
redis-cli SET ff:hybridSearch 1
redis-cli SET ff:indexBlueGreen 1
redis-cli SET ff:pulseDynamicRate 1
```

## 📊 Load Testing
```bash
npm run test:load
```

## 🔧 Production Checklist

- [ ] PostgreSQL with pgvector extension
- [ ] Redis for caching and feature flags
- [ ] All ENV variables configured
- [ ] Migrations executed
- [ ] Tables analyzed
- [ ] Feature flags enabled
- [ ] Auth token secured
- [ ] GitHub Actions secrets configured

## 🚀 Features

- **pgvector** - Vector similarity search
- **Hybrid RAG** - 3-algorithm search (text + vector + index)
- **Partitioning** - Daily partitions for scalability
- **Blue-Green** - Zero-downtime deployments
- **Feature Flags** - Toggle features without restart
- **Dynamic Pulse** - Adaptive rate based on load
- **Quiet Windows** - 22:30-06:30 no pulses

## 📈 Metrics

Expected improvements:
- Search: 100ms → 50ms (pgvector)
- Scale: 1K → 1M+ events (partitions)
- Deploy: downtime → zero (blue-green)
- Quality: single → 3x hybrid search

---
*Brain System v2.0 - Production Ready*