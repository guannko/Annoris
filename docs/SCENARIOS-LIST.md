# Scenarios List - Make.com + n8n

## 📊 Overview

**Total Scenarios:** 16 Make.com bot scenarios + custom n8n workflows

**Access Method:** All Make.com scenarios accessed through n8n Gateway

## 🤖 Make.com Scenarios (16)

### Bot Scenarios (Ready)

All scenarios are pre-built and available through Gateway:

```bash
# List all scenarios
POST https://annoris.app.n8n.cloud/webhook/make-gateway
{
  "action": "list"
}
```

### Scenario Categories

**Category 1: Social Media Automation**
- Auto-posting to multiple platforms
- Content scheduling
- Engagement tracking
- Analytics reporting

**Category 2: Lead Generation**
- Form data capture
- CRM integration
- Lead scoring
- Follow-up automation

**Category 3: E-commerce**
- Order processing
- Inventory sync
- Customer notifications
- Sales reporting

**Category 4: Communication**
- Email campaigns
- SMS notifications
- Slack/Discord alerts
- Calendar sync

**Category 5: Data Processing**
- Data extraction
- Format conversion
- Database sync
- Report generation

## 🔧 n8n Workflows (Custom)

### Production Workflows

**1. Make.com Gateway (WsVlI8ld32XAk5JV)**
- **Purpose:** API bridge to Make.com
- **Type:** Core infrastructure
- **Status:** Production ⚠️ DO NOT MODIFY
- **Project:** Make.com Control Center

**2. Management Dashboard**
- **Purpose:** n8n ↔ Make.com overview
- **Type:** Internal tool
- **Status:** Development
- **Project:** Make.com Control Center

**3. Client Dashboard**
- **Purpose:** Client-facing control
- **Type:** Client tool
- **Status:** Development
- **Project:** Automation Factory

### Template Workflows

**Email Automation Template**
- Trigger: Webhook / Schedule
- Process: Fetch data, format, send
- Output: Email delivery + logs

**Database Sync Template**
- Trigger: Schedule (cron)
- Process: Query source, transform, insert
- Output: Sync report

**API Integration Template**
- Trigger: Webhook
- Process: API call, transform, store
- Output: API response

**Form Processing Template**
- Trigger: Webhook (form submit)
- Process: Validate, enrich, route
- Output: CRM entry + notification

## 📋 Scenario Management

### Listing Scenarios

**Request:**
```bash
curl -X POST https://annoris.app.n8n.cloud/webhook/make-gateway \
  -H "Content-Type: application/json" \
  -d '{"action": "list"}'
```

**Response Format:**
```json
{
  "scenarios": [
    {
      "id": 7850736,
      "name": "Bot Scenario 1",
      "isEnabled": true,
      "scheduling": {
        "type": "indefinitely",
        "interval": 15
      },
      "lastRun": "2025-11-09T20:30:00Z"
    }
  ],
  "total": 16
}
```

### Getting Scenario Details

**Request:**
```bash
curl -X POST https://annoris.app.n8n.cloud/webhook/make-gateway \
  -H "Content-Type: application/json" \
  -d '{
    "action": "get",
    "scenarioId": "7850736"
  }'
```

**Response includes:**
- Full configuration
- Module details
- Connections
- Data structure
- Webhooks
- Scheduling

### Running Scenarios

**Simple Execution:**
```bash
curl -X POST https://annoris.app.n8n.cloud/webhook/make-gateway \
  -H "Content-Type: application/json" \
  -d '{
    "action": "run",
    "scenarioId": "7850736"
  }'
```

**With Input Data:**
```bash
curl -X POST https://annoris.app.n8n.cloud/webhook/make-gateway \
  -H "Content-Type: application/json" \
  -d '{
    "action": "run",
    "scenarioId": "7850736",
    "data": {
      "input1": "value1",
      "input2": "value2"
    },
    "responsive": true
  }'
```

## 🎯 Scenario Use Cases

### Use Case 1: Lead Capture + CRM
**Scenario:** Form submission → HubSpot
```
Webhook (form) → Parse data → Validate → HubSpot Create Contact → Send notification
```

**Make.com Scenario ID:** TBD  
**n8n Equivalent:** Yes, available

### Use Case 2: Social Media Scheduler
**Scenario:** Content calendar → Multi-platform posting
```
Schedule → Fetch content → Loop platforms → Post → Track engagement
```

**Make.com Scenario ID:** TBD  
**n8n Equivalent:** Yes, template available

### Use Case 3: E-commerce Order Processing
**Scenario:** New order → Multi-step fulfillment
```
Shopify webhook → Update inventory → Email customer → Notify warehouse → Update analytics
```

**Make.com Scenario ID:** TBD  
**n8n Equivalent:** Yes, complex workflow

### Use Case 4: Data Sync
**Scenario:** Database A ↔ Database B sync
```
Schedule → Query source → Transform → Insert destination → Log results
```

**Make.com Scenario ID:** TBD  
**n8n Equivalent:** Yes, template available

### Use Case 5: Email Campaign
**Scenario:** Automated email sequences
```
Trigger → Fetch contacts → Segment → Personalize → Send → Track
```

**Make.com Scenario ID:** TBD  
**n8n Equivalent:** Yes, advanced template

## 📊 Scenario Monitoring

### Health Check
```bash
# Check all scenarios status
POST /webhook/make-gateway
{
  "action": "health_check"
}

Response:
{
  "total": 16,
  "active": 12,
  "inactive": 4,
  "errors": 0
}
```

### Execution Logs
```bash
# Get logs for specific scenario
POST /webhook/make-gateway
{
  "action": "logs",
  "scenarioId": "7850736",
  "limit": 10
}

Response:
{
  "executions": [
    {
      "id": "exec123",
      "status": "success",
      "startedAt": "2025-11-09T20:30:00Z",
      "duration": 2.5
    }
  ]
}
```

## 🔄 Scenario Lifecycle

### Development
1. Design in Make.com or n8n
2. Test with sample data
3. Deploy to staging
4. Client review

### Testing
1. Unit tests (individual modules)
2. Integration tests (end-to-end)
3. Load tests (if needed)
4. Security audit

### Production
1. Deploy to production
2. Monitor first 24 hours
3. Collect metrics
4. Optimize if needed

### Maintenance
1. Monitor performance
2. Handle errors
3. Update as needed
4. Quarterly review

## 📝 Scenario Documentation Template

```markdown
# Scenario: [Name]

## Overview
- **ID:** [Make.com ID or n8n workflow ID]
- **Type:** [Make.com / n8n]
- **Status:** [Active/Inactive/Development]
- **Owner:** [Client/Internal]

## Purpose
What does this scenario do?

## Trigger
How does it start?
- Webhook URL (if applicable)
- Schedule (if applicable)
- Manual trigger

## Input Data
What data does it expect?
```json
{
  "field1": "type",
  "field2": "type"
}
```

## Process Flow
1. Step 1: Description
2. Step 2: Description
3. Step 3: Description

## Integrations
- Service 1 (API details)
- Service 2 (API details)

## Output
What does it produce?
```json
{
  "result1": "value",
  "result2": "value"
}
```

## Error Handling
- Error type 1: How handled
- Error type 2: How handled

## Monitoring
- Metrics to track
- Alert conditions
- Dashboard link

## Maintenance
- Update frequency
- Known issues
- Optimization notes
```

## 🚀 Adding New Scenarios

### Make.com Scenarios
1. Create in Make.com interface
2. Test thoroughly
3. Document scenario ID
4. Add to this list
5. Access via Gateway

### n8n Workflows
1. Create in Automation Factory (Project 2)
2. Test with sample data
3. Deploy to n8n Cloud
4. Document workflow ID
5. Add to monitoring

## 🔐 Access Control

### Make.com Scenarios
- Access: Via Gateway only
- Authentication: Gateway handles
- Rate limits: Make.com plan limits

### n8n Workflows
- Access: n8n Cloud credentials
- Authentication: n8n MCP / Direct
- Rate limits: n8n plan limits

## 💰 Cost Tracking

### Make.com Costs
- Operations per scenario
- Total operations per month
- Plan limits
- Overage costs

### n8n Costs
- Workflow executions
- Cloud hosting
- Data transfer
- Storage

## 📈 Success Metrics

### Per Scenario
- Execution count
- Success rate
- Average duration
- Error rate

### Overall
- Total active scenarios: 16+
- Average uptime: 99%+
- Client satisfaction: 9/10+
- Monthly operations: Track

## 🎯 Roadmap

### Q1 2026
- Document all 16 Make.com scenarios
- Create 10 n8n templates
- Build scenario marketplace
- Client self-service portal

### Q2 2026
- AI-powered scenario creation
- Advanced analytics
- Multi-tenancy support
- API marketplace

## 📞 Support

**Scenario Issues:**
- Check execution logs
- Review error messages
- Test with sample data
- Contact support if needed

**Gateway Issues:**
- Verify Gateway is running
- Test webhook URL
- Check Make.com API status
- Review n8n Cloud status
