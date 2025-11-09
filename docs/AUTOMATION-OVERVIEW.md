# Automation Factory - Overview

## 🎯 Concept

**Automation Factory** - система автоматизации через n8n с интеграцией Make.com сценариев.

**Основной принцип:** Всё делаем через n8n, Make.com используется через Gateway систему.

## 💼 Business Model

**Custom Solutions:**
- €500-2,000 per project
- Tailored automation workflows
- Client-specific integrations

**SaaS Products:**
- €99/month subscription
- Pre-built automation templates
- Self-service deployment

**Target Revenue:**
- Custom projects: €10K-20K/month
- SaaS: €5K-10K/month (50-100 clients)

## 🏗️ Architecture

### n8n (Primary Tool)
- **Version:** n8n MCP (czlonkowski/n8n-mcp)
- **Nodes:** 525+ available
- **Deployment:** n8n Cloud (annoris.app.n8n.cloud)
- **Projects:** 2 separate projects
  - **Project 1:** Make.com Control Center (Gateway)
  - **Project 2:** n8n Automation Factory (New workflows)

### Make.com (Secondary Integration)
- **Access:** Via n8n Gateway workflow
- **Scenarios:** 16 bot scenarios ready
- **Token:** 03106422-df8a-4378-beb0-cac8aaa78be3
- **Region:** EU2
- **Team:** 2552758 (Brain Index)

## 🔄 Gateway System

### Make.com Gateway Workflow
- **ID:** WsVlI8ld32XAk5JV
- **Webhook:** https://annoris.app.n8n.cloud/webhook/make-gateway
- **Purpose:** Bridge between n8n and Make.com API

### Available Actions
```json
{
  "list": "List all scenarios",
  "get": "Get scenario details",
  "run": "Execute scenario",
  "start": "Activate scenario",
  "stop": "Deactivate scenario",
  "status": "Get scenario status",
  "logs": "Get execution logs",
  "hybrid": "Smart routing logic"
}
```

### Usage Example
```bash
curl -X POST https://annoris.app.n8n.cloud/webhook/make-gateway \
  -H "Content-Type: application/json" \
  -d '{
    "action": "run",
    "scenarioId": "7850736",
    "data": {"test": "value"}
  }'
```

## 📊 Current Infrastructure

### n8n Projects

**Project 1: Make.com Control Center**
- Gateway workflow (production)
- Management dashboard
- Never modify existing workflows

**Project 2: n8n Automation Factory**
- New workflow development
- Custom client solutions
- Experimentation space

### Make.com Scenarios (16 Ready)
1. Bot scenario 1
2. Bot scenario 2
... (15 more)

## 🎯 Key Workflows

### 1. Make.com Gateway
- **Purpose:** API bridge to Make.com
- **Status:** Production, stable
- **Rules:** NEVER modify without explicit request

### 2. Client Dashboard
- **Purpose:** Client-facing automation control
- **Status:** In development
- **Features:** View scenarios, trigger runs, see logs

### 3. Management Dashboard
- **Purpose:** Internal n8n ↔ Make.com overview
- **Status:** In development
- **Features:** Monitor all scenarios, health checks

## 🔐 Critical Rules

### NEVER:
- ❌ Modify Make.com Gateway workflow (production!)
- ❌ Create new Gateway workflows (one is enough)
- ❌ Change tokens/URLs without Borys approval
- ❌ Use Make.com MCP directly (use Gateway!)

### ALWAYS:
- ✅ Work with Make.com through n8n Gateway
- ✅ Test in Project 2 (Automation Factory)
- ✅ Document new workflows
- ✅ Use webhook-based triggers
- ✅ Check Gateway is stable before changes

## 🚀 Development Flow

1. **Design workflow** in n8n Automation Factory (Project 2)
2. **Test locally** with sample data
3. **Deploy to n8n Cloud**
4. **Document** workflow purpose & usage
5. **Client handoff** with instructions

## 📝 Workflow Naming Convention

```
[Client]-[Purpose]-[Version]
Example: Nike-LeadGen-v1

[Category]-[Function]-[Version]
Example: Make-Scenario-7850736-v1

[Type]-[Description]
Example: Gateway-MakeCom-Production
```

## 🔌 Integration Ecosystem

### Available via n8n MCP (525+ nodes):
- HTTP Request
- Webhook
- Database (MySQL, PostgreSQL, MongoDB)
- Email (Gmail, Outlook)
- Calendar (Google Calendar)
- CRM (HubSpot, Salesforce)
- Social (LinkedIn, Twitter)
- Storage (Google Drive, Dropbox)
- Messaging (Slack, Discord, Telegram)
- E-commerce (Shopify, WooCommerce)
- Payments (Stripe, PayPal)
- Analytics (Google Analytics)
- AI (OpenAI, Anthropic)

### Available via Make.com (through Gateway):
- 25+ tools/modules
- 16 pre-built bot scenarios
- Custom webhook triggers
- Advanced routing logic

## 💰 Pricing Strategy

### Custom Projects
- **Discovery:** €500
- **Simple automation:** €1,000-1,500
- **Complex integration:** €2,000-5,000
- **Enterprise solution:** €5,000+

### SaaS Templates
- **Basic:** €49/month (3 workflows)
- **Pro:** €99/month (10 workflows)
- **Business:** €199/month (unlimited)

## 🎯 Client Onboarding

1. **Discovery call** - understand needs
2. **Workflow design** - map automation
3. **Development** - build in n8n
4. **Testing** - validate with sample data
5. **Deployment** - to client's n8n Cloud or ours
6. **Training** - teach client to use
7. **Support** - ongoing maintenance

## 📊 Success Metrics

- **Active workflows:** Target 50+
- **Client satisfaction:** >90%
- **Workflow reliability:** 99%+ uptime
- **Time to deploy:** <2 weeks
- **Support response:** <24 hours

## 🔧 Tools & Access

**n8n Cloud:**
- URL: annoris.app.n8n.cloud
- MCP: czlonkowski/n8n-mcp
- Projects: 2 (Control Center + Factory)

**Make.com:**
- Access: Via Gateway only
- Token: Hidden in Gateway workflow
- Team: Brain Index (2552758)
- Scenarios: 16 ready

**GitHub:**
- Repo: (if needed for workflow versioning)
- Private repositories for client projects

## 📝 Documentation Standards

Every workflow must have:
1. **Purpose** - what it does
2. **Trigger** - how it starts
3. **Inputs** - what data it needs
4. **Outputs** - what it produces
5. **Dependencies** - external services
6. **Error handling** - what happens on failure
7. **Testing** - how to validate

## 🚨 Critical Notes

- **Gateway is production** - don't touch without reason
- **All Make.com work through Gateway** - no exceptions
- **Document everything** - for clients and ourselves
- **Test before deploy** - no YOLO to production
- **Client data is sacred** - security first

## 🎯 Next Steps

1. Document existing 16 Make.com scenarios
2. Create workflow templates library
3. Build client portal for workflow management
4. Develop pricing calculator
5. Create demo workflows for sales

## 👥 Team

- **Borys:** Business strategy, client relations
- **Jean Claude:** Workflow development, architecture
