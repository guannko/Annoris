# n8n Templates for Brain Index GEO

**Generated:** 2025-11-13  
**Purpose:** AI Visibility Analytics & GEO automation workflows  
**Platform:** n8n (Railway self-hosted)

---

## 📂 **STRUCTURE:**

```
/n8n-templates/
  /showcase/              # 🌟 Top 3 для витрины
    1-brand-visibility-audit/
    2-ai-overview-tracker/
    3-competitor-geo-analysis/
  /library/               # 📚 Полная библиотека (6 workflows)
  /client-ready/          # 💼 Готовые для продажи
  README.md               # Этот файл
```

---

## 🌟 **SHOWCASE (Витрина):**

### **1. Brand Visibility Audit Across AI Tools**
**Цель:** Lead generation для free trials  
**Сложность:** ⭐⭐⭐ (Medium)  
**Wow-фактор:** ⭐⭐⭐⭐⭐  
**ROI:** +40% conversion на trials

**Что делает:**
- Webhook от формы на сайте
- AI-запросы к ChatGPT/Claude/Perplexity
- Visibility score (1-100)
- Email с PDF report
- Логирование в Google Sheets

**Использует:**
- OpenAI API
- SerpAPI (multi-AI search)
- Google Sheets
- Email Send

**Файлы:**
- `/showcase/1-brand-visibility-audit/workflow.json`
- `/showcase/1-brand-visibility-audit/README.md`
- `/showcase/1-brand-visibility-audit/SETUP.md`

---

### **2. Track Website Visibility in AI Overviews**
**Цель:** Real-time brand monitoring  
**Сложность:** ⭐⭐ (Easy)  
**Wow-фактор:** ⭐⭐⭐⭐  
**ROI:** Internal dashboard + client demos

**Что делает:**
- Daily автоматический скан
- Проверка mention в AI results
- Trend tracking (+/- visibility)
- Slack alerts
- Airtable logging

**Использует:**
- SerpAPI (AI Overviews)
- OpenAI (relevance analysis)
- Slack
- Airtable

**Файлы:**
- `/showcase/2-ai-overview-tracker/workflow.json`
- `/showcase/2-ai-overview-tracker/README.md`
- `/showcase/2-ai-overview-tracker/SETUP.md`

---

### **3. Competitor GEO Analysis**
**Цель:** Weekly competitor tracking  
**Сложность:** ⭐⭐⭐ (Medium)  
**Wow-фактор:** ⭐⭐⭐⭐  
**ROI:** Client insights + competitive advantage

**Что делает:**
- Weekly scan конкурентов
- AI visibility scores
- Comparison с Brain Index
- Notion dashboard update
- Slack summary

**Использует:**
- Airtable (competitor list)
- SerpAPI
- OpenAI (comparison)
- Notion
- Slack

**Файлы:**
- `/showcase/3-competitor-geo-analysis/workflow.json`
- `/showcase/3-competitor-geo-analysis/README.md`
- `/showcase/3-competitor-geo-analysis/SETUP.md`

---

## 📚 **FULL LIBRARY (6 workflows):**

4. **GEO Optimization for Content** - Content optimization
5. **Brand Reputation Sentiment Analysis** - Client onboarding reports
6. **AI-Powered Lead Enrichment** - Lead tracking from AI mentions

(See `/library/` folder for details)

---

## 💼 **CLIENT-READY:**

**Custom Setup Packages:**
- **Starter** (€500): 1 workflow + setup + 1 month support
- **Professional** (€1,500): 3 workflows + custom integration
- **Enterprise** (€5,000+): Full suite + ongoing optimization

---

## 🚀 **QUICK START:**

### **For Testing:**
```bash
# Import to Railway n8n
1. Open https://primary-production-636cc.up.railway.app
2. Workflows → Import from File
3. Select workflow.json
4. Configure credentials (see SETUP.md)
5. Activate & test
```

### **Required APIs:**
- OpenAI API key
- SerpAPI key (for AI search)
- Google Sheets credentials
- Slack webhook (optional)
- Airtable API key (optional)

---

## 📋 **TESTING CHECKLIST:**

Before adding to showcase:
- [ ] Import to n8n Railway
- [ ] Configure all credentials
- [ ] Test with real data
- [ ] Document setup steps
- [ ] Create demo video
- [ ] Add to brain-index.com/templates

---

## 🔧 **CUSTOMIZATION:**

**For clients:**
- Replace `brain-index.com` → client domain
- Update brand name variables
- Customize report templates
- Add client-specific integrations

---

**Source:** Grok AI + n8n.io community templates 2025  
**Maintained by:** Jean Claude (AI CTO) + Borys (CEO)  
**Status:** 🚧 In Development
