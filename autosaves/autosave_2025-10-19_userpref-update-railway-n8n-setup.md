# SESSION SAVE - October 19, 2025

**Time:** Evening session  
**Status:** ✅ userPref updated, Railway + n8n MCP setup ready

---

## 🎯 ГЛАВНОЕ ЧТО СДЕЛАЛИ:

### 1. НАШЛИ ПРОБЛЕМУ СО СТАРТОМ ❗

**Проблема:**
- Jean не делал автоматический startup из Annoris
- Ждал команд Boris вместо автоматической загрузки
- Раньше работало, сейчас перестало

**Причина:**
- В userPref было описание startup sequence
- Но не было ИМПЕРАТИВА "делай это сейчас!"
- Нужен явный протокол старта

---

### 2. ОБНОВИЛИ USERPREF ✅

**Добавили в начало:**

```markdown
## ⚡ AUTOMATIC STARTUP PROTOCOL (CRITICAL!)

**При ЛЮБОМ старте чата, ПЕРЕД приветствием:**

1. ✅ Blue Eye documents loaded (in context)
2. 🔍 Check SLOT-1 (Annoris) → find LATEST autosave
3. 📖 Read it completely
4. 🧠 Update context from it
5. 👋 THEN greet Boris with current status

**NO exceptions! NO waiting for commands!**
**This runs AUTOMATICALLY every chat start.**
```

**Другие правки:**
- CEO → GEO (focus на automation, GEO, SEO)
- #3 PRIORITIES: n8n primary, Make.com secondary
- TRINITY POWER: добавлен n8n MCP (525+ nodes)
- Total tools: 50+ → 60+
- CRITICAL LEARNINGS: убрали дату, оставили инсайты

**Синхронизация:**
- ✅ Boris поставил в Settings
- ✅ Jean обновил BORIS-USERPREF-v2.md в blue-eye repo
- ✅ Commit: "Update userPref: Add STARTUP PROTOCOL + n8n priority + GEO role fix"

---

### 3. RAILWAY + N8N MCP SETUP 🚀

**Задача от Boris:**
> "Две задачи: Railway в коннекте через MCP (нужен full control), и n8n MCP setup"

**Что нашли:**

#### **RAILWAY MCP - ДВА ВАРИАНТА:**

**A) Official @railway/mcp-server:**
- От Railway official
- Работает через Railway CLI
- Безопасный (no destructive actions)
- Setup: `npx -y @railway/mcp-server`

**B) Community @jasontanswe/railway-mcp:** ⭐ РЕКОМЕНДУЕМ
- Работает через Railway API (не CLI!)
- Только API token нужен
- Больше контроля
- Setup: `npx -y @jasontanswe/railway-mcp`

#### **N8N MCP:**

**czlonkowski/n8n-mcp** (уже знали):
- 525+ n8n nodes
- Production-ready (2,883 tests)
- Docker-based
- Setup: `docker run ghcr.io/czlonkowski/n8n-mcp:latest`

---

## 📋 ПОЛНЫЙ SETUP ПЛАН:

### **Claude Desktop Config:**

```json
{
  "mcpServers": {
    "railway": {
      "command": "npx",
      "args": ["-y", "@jasontanswe/railway-mcp"],
      "env": {
        "RAILWAY_API_TOKEN": "получить-у-бориса"
      }
    },
    "n8n-mcp": {
      "command": "docker",
      "args": ["run", "-i", "--rm", "--init",
               "ghcr.io/czlonkowski/n8n-mcp:latest"]
    }
  }
}
```

### **Что нужно:**

1. **Railway API Token:**
   - railway.app → Settings → Tokens → Create
   
2. **Docker installed:**
   - Для n8n-mcp

3. **Добавить config** в Claude Desktop

4. **Restart Claude Desktop**

5. **Test:**
   - Railway projects list
   - n8n nodes для Telegram

---

## 🔥 CONTEXT ОТ ПРЕДЫДУЩЕЙ СЕССИИ:

**From autosave_2025-10-19_n8n-mcp-research-complete.md:**

- ✅ Решили: n8n > Make.com (Boris был прав!)
- ✅ czlonkowski/n8n-mcp = TOP choice
- ✅ Railway нужен для 24/7 production workflows
- ✅ Две бизнес-модели:
  - Custom: €500-2K setup + €50-200/месяц
  - SAAS: €99/месяц (80-90% margin!)

**Приоритеты:**
1. OffersPSP → €10K/месяц
2. Brain Index GEO → €250K/year potential
3. Automation Factory (n8n + Make.com)
4. Annoris → $200K/месяц vision

---

## 💡 KEY INSIGHTS:

### **Про Token Monitoring:**

**Проблема в прошлой сессии:**
- Jean сказал "65K осталось"
- Сделал web_search
- Search съел остаток → лимит!

**Урок:**
- web_search = 10-20K tokens
- Multiple searches = 30-50K tokens
- Нужно предупреждать ДО поиска если < 70K

**НО Boris сказал:** "не надо добавлять в userPref"
- Просто быть аккуратным
- Смотреть на остаток перед heavy operations

---

## ✅ NEXT STEPS:

1. **Boris получит Railway API token**
2. **Проверим Docker** на Mac
3. **Setup оба MCP** в Claude Desktop
4. **Restart и test**
5. **Начинаем строить workflows!** 🔥

---

## 📊 TOKEN STATUS:

**Эта сессия:**
- Start: ~90K
- Current: ~110K used
- Remaining: ~80K
- Status: ✅ Good, saved before heavy work

---

## 🧬 PARTNERSHIP STATUS:

**Jean Claude:**
- v9.01-STABLE
- CORTEX v3.0 + Blue Eye v2.0
- Startup protocol теперь работает!

**Boris:**
- GEO, Brain Index
- Focus: Automation, GEO, SEO
- Quick decisions > perfect plans

**Trust:** ✅ Полный  
**Communication:** ✅ Natural  
**Results:** ✅ Coming

---

**"От startup problems к Railway + n8n power!"** 🚀

---

**Jean Claude v9.01-STABLE**  
**CORTEX v3.0 + Blue Eye v2.0**  
**Partnership with Boris since August 23, 2025**