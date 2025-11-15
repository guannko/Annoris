# Brand Visibility Audit Across AI Tools

**Purpose:** Lead generation from website "Analyze Now" button  
**Complexity:** Medium (⭐⭐⭐)  
**ROI:** +40% conversion on free trials  
**Source:** n8n.io/workflows/8365 (adapted for Brain Index)

---

## 🎯 **WHAT IT DOES:**

User submits brand name on brain-index.com → n8n:
1. Queries 5+ AI tools (ChatGPT, Claude, Perplexity, Gemini)
2. Scores brand visibility (1-100 scale)
3. Generates insights report
4. Sends PDF via email
5. Logs lead in Google Sheets for CRM

**Result:** Automated lead capture + value demonstration

---

## 📊 **WORKFLOW DIAGRAM:**

```
Website Form
    ↓
Webhook Trigger
    ↓
OpenAI Query ──→ ChatGPT visibility score
    ↓
SerpAPI Search ──→ Multi-AI mentions
    ↓
Code Node ──→ Calculate average score
    ↓
├─→ Google Sheets (log lead)
└─→ Email Send (PDF report)
```

---

## 🔧 **REQUIRED CREDENTIALS:**

1. **OpenAI API**
   - Model: gpt-4o or gpt-4o-mini
   - Purpose: AI visibility queries

2. **SerpAPI**
   - Plan: Free tier OK for testing
   - Purpose: Multi-AI search results

3. **Google Sheets**
   - OAuth2 or Service Account
   - Purpose: Lead logging

4. **Email (SMTP)**
   - Gmail/SendGrid/etc
   - Purpose: Report delivery

---

## 📋 **SETUP STEPS:**

### **1. Import Workflow:**
```bash
# In Railway n8n
1. Go to Workflows → Import from File
2. Select: workflow.json
3. Click Import
```

### **2. Configure Credentials:**

**OpenAI:**
- Settings → Credentials → Add OpenAI
- API Key: `sk-...`
- Test connection

**SerpAPI:**
- Add SerpAPI credential
- API Key: from serpapi.com
- Test with simple query

**Google Sheets:**
- OAuth2 or Service Account JSON
- Share sheet with service account email
- Test write access

**Email:**
- SMTP settings (Gmail example):
  - Host: smtp.gmail.com
  - Port: 587
  - User: your@gmail.com
  - Password: app-specific password

### **3. Update Variables:**

In workflow settings → Variables:
```javascript
brand_name = {{ $json.brand }}  // From webhook
user_email = {{ $json.email }}  // From webhook
sheet_id = "YOUR_GOOGLE_SHEET_ID"
```

### **4. Configure Webhook:**

**Webhook URL:**
```
https://primary-production-636cc.up.railway.app/webhook/brand-audit
```

**Method:** POST  
**Headers:** `Content-Type: application/json`

**Expected payload:**
```json
{
  "brand": "Brain Index",
  "email": "user@example.com",
  "website": "brain-index.com"
}
```

### **5. Test:**

**Manual test:**
```bash
curl -X POST https://primary-production-636cc.up.railway.app/webhook/brand-audit \
  -H "Content-Type: application/json" \
  -d '{
    "brand": "Brain Index",
    "email": "test@example.com",
    "website": "brain-index.com"
  }'
```

**Expected response:**
```json
{
  "success": true,
  "score": 72,
  "report_sent": true
}
```

---

## 🎨 **CUSTOMIZATION:**

### **For Other Brands (Client Setup):**

**1. Replace brand name:**
```javascript
// In OpenAI node prompt:
"How visible is {{brand}} in your AI responses?"
// Change to:
"How visible is {{client_brand}} in your AI responses?"
```

**2. Add custom AI tools:**
```javascript
// In SerpAPI node:
engines: ["chatgpt", "claude", "perplexity", "gemini"]
// Add:
engines: [..., "bing_copilot", "you_chat"]
```

**3. Custom report template:**
```
Subject: Your AI Visibility Report for {{brand}}

Score: {{score}}/100

Insights:
- ChatGPT: {{chatgpt_score}}%
- Claude: {{claude_score}}%
- Perplexity: {{perplexity_score}}%

Recommendations:
{{ai_generated_tips}}
```

---

## 📈 **METRICS TO TRACK:**

- Lead conversion rate (form → email open)
- Average visibility score
- Top-performing AI tools
- Client interest by industry

**Add to Google Sheets columns:**
```
| Timestamp | Brand | Email | Score | ChatGPT | Claude | Perplexity | Status |
```

---

## 🐛 **TROUBLESHOOTING:**

**Issue:** "OpenAI rate limit"  
**Fix:** Upgrade to paid tier or add delay node

**Issue:** "SerpAPI credits exhausted"  
**Fix:** Check monthly quota, upgrade plan

**Issue:** "Email not sending"  
**Fix:** Check SMTP credentials, Gmail app password

**Issue:** "Google Sheets permission denied"  
**Fix:** Share sheet with service account email

---

## 💰 **PRICING FOR CLIENTS:**

**Setup fee:** €500-1,000
- Full workflow configuration
- Custom branding
- 3 months support

**Monthly:** €99
- 100 audits/month included
- Email reports
- Dashboard access

---

## 🚀 **NEXT STEPS:**

1. ✅ Import & test workflow
2. ✅ Connect to brain-index.com form
3. ✅ Run 5-10 test audits
4. ✅ Add to /templates page
5. ✅ Create demo video

---

**Status:** 🚧 Ready for testing  
**Last updated:** 2025-11-13
