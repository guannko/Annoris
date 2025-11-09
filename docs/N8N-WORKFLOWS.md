# n8n Workflows Documentation

## 🔧 n8n MCP Integration

### Tool: czlonkowski/n8n-mcp
- **Nodes Available:** 525+
- **Access:** Via Claude MCP
- **Authentication:** n8n Cloud credentials
- **Base URL:** https://annoris.app.n8n.cloud

## 📂 Project Structure

### Project 1: Make.com Control Center
**Purpose:** Production Gateway system  
**Status:** ⚠️ DO NOT MODIFY  
**Contains:**
- Make.com Gateway workflow (WsVlI8ld32XAk5JV)
- Management Dashboard
- Supporting workflows

### Project 2: n8n Automation Factory
**Purpose:** Development & client work  
**Status:** ✅ Active development  
**Contains:**
- Custom client workflows
- Experimental automations
- Template workflows

## 🌐 Gateway Workflow (Production)

### Workflow ID: WsVlI8ld32XAk5JV
**Name:** Make.com Gateway  
**Webhook:** https://annoris.app.n8n.cloud/webhook/make-gateway  
**Method:** POST

### Architecture
```
Client Request
    ↓
n8n Webhook Trigger
    ↓
Parse Action (list/get/run/start/stop/status/logs/hybrid)
    ↓
HTTP Request to Make.com API
    ↓
Response Formatting
    ↓
Return to Client
```

### Node Structure
1. **Webhook Trigger** - Listens on /webhook/make-gateway
2. **Switch Node** - Routes based on action parameter
3. **HTTP Request Nodes** - Make.com API calls
4. **Set Nodes** - Format responses
5. **Response Nodes** - Return data to client

### Supported Actions

#### 1. list
**Purpose:** Get all scenarios  
**Request:**
```json
{
  "action": "list"
}
```

**Response:**
```json
{
  "scenarios": [
    {
      "id": "7850736",
      "name": "Bot Scenario 1",
      "isEnabled": true
    }
  ]
}
```

#### 2. get
**Purpose:** Get scenario details  
**Request:**
```json
{
  "action": "get",
  "scenarioId": "7850736"
}
```

**Response:**
```json
{
  "id": "7850736",
  "name": "Bot Scenario 1",
  "isEnabled": true,
  "config": {...}
}
```

#### 3. run
**Purpose:** Execute scenario  
**Request:**
```json
{
  "action": "run",
  "scenarioId": "7850736",
  "data": {"test": "value"},
  "responsive": true
}
```

**Response:**
```json
{
  "executionId": "abc123",
  "status": "success"
}
```

#### 4. start
**Purpose:** Activate scenario  
**Request:**
```json
{
  "action": "start",
  "scenarioId": "7850736"
}
```

#### 5. stop
**Purpose:** Deactivate scenario  
**Request:**
```json
{
  "action": "stop",
  "scenarioId": "7850736"
}
```

#### 6. status
**Purpose:** Get scenario status  
**Request:**
```json
{
  "action": "status",
  "scenarioId": "7850736"
}
```

#### 7. logs
**Purpose:** Get execution logs  
**Request:**
```json
{
  "action": "logs",
  "scenarioId": "7850736",
  "limit": 10
}
```

#### 8. hybrid
**Purpose:** Smart routing logic  
**Request:**
```json
{
  "action": "hybrid",
  "query": "What scenarios are active?"
}
```

## 🔨 Common Workflow Patterns

### Pattern 1: Webhook → Process → Response
```
Webhook Trigger
    ↓
HTTP Request (external API)
    ↓
Set (format data)
    ↓
Respond to Webhook
```

### Pattern 2: Schedule → Fetch → Store
```
Schedule Trigger (cron)
    ↓
HTTP Request (fetch data)
    ↓
Filter (process)
    ↓
Database Insert
```

### Pattern 3: Form Submit → Validate → Notify
```
Webhook (form data)
    ↓
IF (validation)
    ↓
├─ Valid → Send Email
└─ Invalid → Error Response
```

## 🎯 Best Practices

### Naming Conventions
```
[Type]-[Purpose]-[Version]
Examples:
- Gateway-MakeCom-v1
- Client-Nike-LeadGen-v1
- Automation-EmailFollowup-v2
```

### Error Handling
```
Try Node
    ↓
├─ Success → Continue
└─ Error → Error Handler
        ↓
    ├─ Log Error
    ├─ Send Notification
    └─ Return Error Response
```

### Authentication
- Use n8n Credentials Manager
- Never hardcode API keys
- Rotate credentials quarterly
- Use environment variables

### Testing
1. **Manual Test** - Use "Test Workflow" button
2. **Sample Data** - Create test nodes with dummy data
3. **Webhook Testing** - Use curl or Postman
4. **Production Test** - Always test before deploying

## 📊 Workflow Templates

### Template 1: API Integration
**Purpose:** Connect to external REST API  
**Nodes:**
- Webhook Trigger
- HTTP Request
- Set (transform response)
- Respond to Webhook

### Template 2: Database Sync
**Purpose:** Sync data between databases  
**Nodes:**
- Schedule Trigger
- Database Query (source)
- Loop
- Database Insert (destination)
- Email Notification (summary)

### Template 3: Email Automation
**Purpose:** Send automated emails  
**Nodes:**
- Trigger (webhook/schedule)
- Fetch Recipients
- Loop
- Send Email
- Log Results

## 🔐 Security Best Practices

### Webhook Security
- Use authentication headers
- Validate input data
- Implement rate limiting
- Log all requests
- Use HTTPS only

### Data Protection
- Never log sensitive data
- Encrypt credentials
- Use secure connections
- Implement data retention policies
- GDPR compliance

### Access Control
- Limit workflow visibility
- Use role-based access
- Audit workflow changes
- Monitor execution logs
- Restrict webhook access

## 🐛 Troubleshooting

### Common Issues

**1. Webhook not triggering**
- Check webhook URL is correct
- Verify authentication headers
- Test with curl/Postman
- Check n8n Cloud status

**2. HTTP Request failing**
- Verify API endpoint
- Check authentication
- Validate request body
- Check for rate limits

**3. Data transformation errors**
- Use Set node to debug
- Check data structure
- Validate JSON format
- Test with sample data

**4. Workflow execution timeout**
- Optimize HTTP requests
- Add timeout handling
- Split into smaller workflows
- Use async execution

## 📈 Performance Optimization

### Tips
1. **Minimize HTTP Requests** - Batch when possible
2. **Use Webhooks** - Instead of polling
3. **Cache Data** - Reduce API calls
4. **Parallel Execution** - Use Split/Merge nodes
5. **Error Recovery** - Implement retry logic

### Monitoring
- Check execution times
- Monitor error rates
- Track API usage
- Set up alerts
- Review logs regularly

## 🔄 Deployment Process

### Development
1. Create workflow in Project 2
2. Test with sample data
3. Validate error handling
4. Document usage

### Testing
1. Deploy to test environment
2. Run integration tests
3. Load testing (if needed)
4. Security review

### Production
1. Deploy to n8n Cloud
2. Monitor first executions
3. Set up alerts
4. Document for client

## 📝 Documentation Template

For each workflow:
```markdown
# Workflow Name

## Purpose
What does this workflow do?

## Trigger
How does it start?

## Inputs
What data does it need?

## Process
Step-by-step flow

## Outputs
What does it produce?

## Error Handling
How does it handle failures?

## Testing
How to test it?

## Maintenance
Any special considerations?
```

## 🎯 Client Workflows

### Workflow Categories

**Lead Generation:**
- Capture leads from forms
- Enrich with data
- Route to CRM
- Send notifications

**Email Marketing:**
- Automated campaigns
- Follow-up sequences
- Engagement tracking
- List management

**Data Sync:**
- Database synchronization
- API integrations
- File transfers
- Backup automation

**Reporting:**
- Automated reports
- Data aggregation
- Email distribution
- Dashboard updates

## 🔌 Integration Examples

### CRM Integration (HubSpot)
```
Webhook (new lead)
    ↓
HubSpot Create Contact
    ↓
Add to List
    ↓
Send Welcome Email
    ↓
Notify Sales Team
```

### E-commerce (Shopify)
```
Shopify Trigger (new order)
    ↓
Update Inventory
    ↓
Send to Fulfillment
    ↓
Email Customer
    ↓
Update Analytics
```

### Social Media (LinkedIn)
```
Schedule Trigger
    ↓
Fetch Content
    ↓
LinkedIn Post
    ↓
Track Engagement
    ↓
Report to Dashboard
```

## 💡 Advanced Techniques

### Conditional Branching
```
IF Node
    ↓
├─ Condition A → Path 1
├─ Condition B → Path 2
└─ Default → Path 3
```

### Loop Processing
```
Loop Over Items
    ↓
Process Each Item
    ↓
Aggregate Results
    ↓
Return Summary
```

### Error Recovery
```
Try
    ↓
Execute Workflow
    ↓
Catch Error
    ↓
Retry (3 times)
    ↓
Fail Gracefully
```

## 🎓 Learning Resources

- **n8n Docs:** https://docs.n8n.io
- **Community:** https://community.n8n.io
- **Templates:** https://n8n.io/workflows
- **YouTube:** n8n official channel
- **Discord:** n8n Community Server

## 📞 Support

**For Gateway Issues:**
- Check Gateway workflow is running
- Verify webhook URL
- Test with curl
- Check Make.com API status

**For Custom Workflows:**
- Review execution logs
- Test individual nodes
- Check credentials
- Validate data format
