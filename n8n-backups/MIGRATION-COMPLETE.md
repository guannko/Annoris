# n8n Railway Migration - Complete

**Date:** 2025-11-13  
**Status:** ✅ COMPLETED

## 🎯 Migration Summary

Successfully migrated n8n from Cloud (annoris.app.n8n.cloud) to Railway self-hosted instance.

---

## 📊 Infrastructure Changes

### OLD (n8n Cloud):
- **URL:** https://annoris.app.n8n.cloud
- **API Key:** eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIyODk0MmE3OC1lZDgwLTQzOTctYjI3Ni04NzU5NzQ0OGFhNGIiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzYxMDcxNDMyfQ.85BiPoqrFm3tO41y4UQQ_AJpzTRuaAzhvcOcbyxnZ90
- **Status:** Deprecated (kept for backup)

### NEW (Railway n8n):
- **URL:** https://primary-production-636cc.up.railway.app
- **API Key:** eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI4NmJlNGE5Mi0xM2VjLTQ3OTEtYTFiYS1hMTVjZGI1YTVkZmQiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzYyOTcwNjMwfQ.ReuAXU0SA-uTeTPT5AhtUVFQexeWD3WA93Y7iyTk3ro
- **Railway Project:** earnest-liberation (ID: 66370bfe-3d44-41a8-ab0d-63be434d39ce)
- **Status:** ✅ ACTIVE

---

## 🔄 Make.com Gateway

### NEW Gateway Webhook:
```
https://primary-production-636cc.up.railway.app/webhook/make-gateway
```

### OLD Gateway Webhook (deprecated):
```
https://annoris.app.n8n.cloud/webhook/make-gateway
```

### Test Command:
```bash
curl -X POST https://primary-production-636cc.up.railway.app/webhook/make-gateway \
  -H "Content-Type: application/json" \
  -d '{"action": "list"}'
```

### Make.com Details:
- **Token:** 1093fee2-60e0-4432-8c6c-205c5706cb6c
- **Team ID:** 2552758 (Brain Index)
- **Organization ID:** 5038858
- **Region:** EU2

---

## 📦 Migrated Workflows

**Total:** 5 workflows

1. ✅ **Make.com Gateway - ACTIVE** (13 nodes) - Production
2. ✅ **n8n ↔ Make.com Management Dashboard** (9 nodes)
3. ✅ **Make.com Client Dashboard** (11 nodes)
4. ✅ **Gateway Test Suite - MANUAL** (7 nodes)
5. ✅ **Make.com Gateway** (8 nodes) - Duplicate/backup

**All workflows use direct headers** (no credentials required):
```
Authorization: Token 1093fee2-60e0-4432-8c6c-205c5706cb6c
```

---

## 🔧 MCP Configuration

### iMac + MacBook Config:
```json
{
  "n8n-mcp": {
    "command": "/usr/local/bin/docker",
    "args": [
      "run", "-i", "--rm", "--init",
      "-e", "N8N_API_URL=https://primary-production-636cc.up.railway.app",
      "-e", "N8N_API_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI4NmJlNGE5Mi0xM2VjLTQ3OTEtYTFiYS1hMTVjZGI1YTVkZmQiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzYyOTcwNjMwfQ.ReuAXU0SA-uTeTPT5AhtUVFQexeWD3WA93Y7iyTk3ro",
      "ghcr.io/czlonkowski/n8n-mcp:latest"
    ]
  }
}
```

---

## ✅ Completed Steps

1. ✅ Railway n8n deployed
2. ✅ API key generated
3. ✅ MCP config updated (iMac + MacBook)
4. ✅ Docker configured
5. ✅ n8n MCP connected
6. ✅ Railway MCP connected
7. ✅ 5 workflows exported from Cloud
8. ✅ 5 workflows imported to Railway
9. ✅ Make.com Gateway activated
10. ✅ Webhook tested successfully
11. ✅ Proxy warning fixed (N8N_PROXY_TRUST=true)

---

## 🧪 Test Results

**Gateway Test (2025-11-13):**
```json
{
  "success": true,
  "action": "list",
  "summary": {
    "totalScenarios": 1,
    "activeScenarios": 1
  },
  "data": {
    "scenarios": [
      {
        "id": 7908237,
        "name": "конвертация голосовых",
        "isActive": true
      }
    ]
  }
}
```

**Status:** ✅ WORKING PERFECTLY

---

## 📝 Next Steps

1. Update AUTOMATION-ALL-DOCS.md with new webhook URL
2. Update MCP-TOOLS-CONFIG.md with new n8n config
3. Test all other workflows
4. Archive n8n Cloud (keep as backup for 1 month)
5. Update client-facing documentation

---

**Migration Completed:** 2025-11-13  
**Engineer:** Jean Claude (AI CTO)  
**Partner:** Borys (CEO, Brain Index)
