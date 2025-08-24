# Brain System v2.0 - Production Backend

## Features
- ✅ pgvector for semantic search
- ✅ Hybrid RAG search (vector + keyword + fuzzy)
- ✅ Feature flags with Redis
- ✅ Blue-green deployment
- ✅ Partitioning for scale
- ✅ Autosave to DB and GitHub

## Setup

### 1. Install PostgreSQL Extensions
\`\`\`sql
CREATE EXTENSION vector;
CREATE EXTENSION pg_trgm;
\`\`\`

### 2. Set Environment Variables
\`\`\`bash
DATABASE_URL=postgresql://user:pass@host:5432/brain
OPENAI_API_KEY=sk-...
REDIS_URL=redis://localhost:6379
AUTH_TOKEN=your-secret-token
GITHUB_TOKEN=ghp_...
GITHUB_REPO=guannko/offerspsp.com
GITHUB_PATH=autosaves
GIT_AUTHOR_NAME=Iskra
GIT_AUTHOR_EMAIL=iskra@offerspsp.com
\`\`\`

### 3. Run Migrations
\`\`\`bash
npm run db:migrate
\`\`\`

### 4. Enable Feature Flags
\`\`\`bash
redis-cli SET ff:hybridSearch 1
redis-cli SET ff:indexBlueGreen 1
redis-cli SET ff:pulseDynamicRate 1
\`\`\`

### 5. Start Server
\`\`\`bash
npm run dev  # Development
npm start    # Production
\`\`\`

## API Endpoints

- \`GET /health\` - Health check
- \`GET /brain/search?q=query&user=boris\` - Hybrid search
- \`POST /brain/index/swap\` - Blue-green deployment
- \`POST /autosave\` - Save to DB and GitHub
