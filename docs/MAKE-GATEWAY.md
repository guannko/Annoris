# Make.com Gateway System

## 🌉 Gateway Concept

**Gateway** - единая точка входа для работы с Make.com через n8n.

**Принцип:** Весь доступ к Make.com API идёт через один n8n workflow (Gateway).

## 🔧 Gateway Workflow

### Production Workflow
- **ID:** WsVlI8ld32XAk5JV
- **Name:** Make.com Gateway
- **Project:** Make.com Control Center (Project 1)
- **Status:** ⚠️ PRODUCTION - DO NOT MODIFY
- **Webhook:** https://annoris.app.n8n.cloud/webhook/make-gateway

### Configuration
```json
{
  "token": "03106422-df8a-4378-beb0-cac8aaa78be3",
  "region": "EU2",
  "organization": "5038858",
  "team": "2552758",
  "baseUrl": "https://eu2.make.com/api/v2"
}
```

## 🎯 Why Gateway?

### Problems Without Gateway
- ❌ Direct Make.com MCP bypasses egress proxy
- ❌ Multiple workflows accessing Make.com = chaos
- ❌ Hard to track API usage
- ❌ Difficult to modify authentication
- ❌ No centralized error handling

### Benefits With Gateway
- ✅ Single point of control
- ✅ Centralized authentication
- ✅ Easy API monitoring
- ✅ Consistent error handling
- ✅ One place to update tokens
- ✅ Works through Docker (bypasses proxy issues)

## 📊 Gateway Architecture

```
Claude with n8n MCP
    ↓
POST /webhook/make-gateway
    ↓
n8n Gateway Workflow
    ↓
Switch on 'action' parameter
    ↓
├─ list → GET /scenarios
├─ get → GET /scenarios/:id
├─ run → POST /scenarios/:id/run
├─ start → PATCH /scenarios/:id (activate)
├─ stop → PATCH /scenarios/:id (deactivate)
├─ status → GET /scenarios/:id
├─ logs → GET /scenarios/:id/executions
└─ hybrid → Smart routing logic
    ↓
Make.com API (EU2)
    ↓
Response formatting
    ↓
Return to caller
```

## 🔌 API Actions

### 1. list - List All Scenarios

**Request:**
```bash
curl -X POST https://annoris.app.n8n.cloud/webhook/make-gateway \
  -H "Content-Type: application/json" \
  -d '{
    "action": "list"
  }'
```

**Make.com API Call:**
```
GET https://eu2.make.com/api/v2/scenarios
```

**Response:**
```json
{
  "scenarios": [
    {
      "id": 7850736,
      "name": "Bot Scenario 1",
      "isEnabled": true,
      "scheduling": {...}
    }
  ]
}
```

---

### 2. get - Get Scenario Details

**Request:**
```bash
curl -X POST https://annoris.app.n8n.cloud/webhook/make-gateway \
  -H "Content-Type: application/json" \
  -d '{
    "action": "get",
    "scenarioId": "7850736"
  }'
```

**Make.com API Call:**
```
GET https://eu2.make.com/api/v2/scenarios/7850736
```

**Response:**
```json
{
  "scenario": {
    "id": 7850736,
    "name": "Bot Scenario 1",
    "flow": [...],
    "scheduling": {...}
  }
}
```

---

### 3. run - Execute Scenario

**Request:**
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

**Make.com API Call:**
```
POST https://eu2.make.com/api/v2/scenarios/7850736/run
Body: {"data": {...}, "responsive": true}
```

**Response:**
```json
{
  "executionId": "abc123xyz",
  "status": "success",
  "result": {...}
}
```

**Parameters:**
- `data` (optional): Input data for scenario
- `responsive` (optional): Wait for completion (default: false)

---

### 4. start - Activate Scenario

**Request:**
```bash
curl -X POST https://annoris.app.n8n.cloud/webhook/make-gateway \
  -H "Content-Type: application/json" \
  -d '{
    "action": "start",
    "scenarioId": "7850736"
  }'
```

**Make.com API Call:**
```
PATCH https://eu2.make.com/api/v2/scenarios/7850736
Body: {"scheduling": {"type": "indefinitely"}}
```

---

### 5. stop - Deactivate Scenario

**Request:**
```bash
curl -X POST https://annoris.app.n8n.cloud/webhook/make-gateway \
  -H "Content-Type: application/json" \
  -d '{
    "action": "stop",
    "scenarioId": "7850736"
  }'
```

**Make.com API Call:**
```
PATCH https://eu2.make.com/api/v2/scenarios/7850736
Body: {"scheduling": {"type": "off"}}
```

---

### 6. status - Get Scenario Status

**Request:**
```bash
curl -X POST https://annoris.app.n8n.cloud/webhook/make-gateway \
  -H "Content-Type: application/json" \
  -d '{
    "action": "status",
    "scenarioId": "7850736"
  }'
```

**Response:**
```json
{
  "scenarioId": 7850736,
  "name": "Bot Scenario 1",
  "isEnabled": true,
  "lastRun": "2025-11-09T20:30:00Z",
  "nextRun": "2025-11-09T21:00:00Z"
}
```

---

### 7. logs - Get Execution Logs

**Request:**
```bash
curl -X POST https://annoris.app.n8n.cloud/webhook/make-gateway \
  -H "Content-Type: application/json" \
  -d '{
    "action": "logs",
    "scenarioId": "7850736",
    "limit": 10
  }'
```

**Make.com API Call:**
```
GET https://eu2.make.com/api/v2/scenarios/7850736/executions?limit=10
```

**Response:**
```json
{
  "executions": [
    {
      "id": "exec123",
      "status": "success",
      "startedAt": "2025-11-09T20:30:00Z",
      "finishedAt": "2025-11-09T20:30:05Z"
    }
  ]
}
```

---

### 8. hybrid - Smart Routing

**Purpose:** AI-powered action detection and routing

**Request:**
```bash
curl -X POST https://annoris.app.n8n.cloud/webhook/make-gateway \
  -H "Content-Type: application/json" \
  -d '{
    "action": "hybrid",
    "query": "What scenarios are currently active?"
  }'
```

**Logic:**
- Analyze query intent
- Determine appropriate action
- Execute and return results

## 🔐 Authentication

### Token Storage
- Stored in Gateway workflow credentials
- Never exposed in responses
- Rotated quarterly
- Encrypted by n8n

### API Token Details
```
Token: 03106422-df8a-4378-beb0-cac8aaa78be3
Type: Bearer token
Region: EU2
Organization: 5038858 (Brain Index)
Team: 2552758
```

### Security Best Practices
1. Never log tokens
2. Use HTTPS only
3. Validate all inputs
4. Rate limit requests
5. Monitor usage

## 🚨 Critical Rules

### DO NOT:
- ❌ Modify Gateway workflow without approval
- ❌ Create duplicate Gateway workflows
- ❌ Change authentication tokens directly
- ❌ Bypass Gateway (use Make.com MCP directly)
- ❌ Share Gateway webhook URL publicly

### ALWAYS:
- ✅ Use Gateway for ALL Make.com operations
- ✅ Test in development first
- ✅ Document API usage
- ✅ Handle errors gracefully
- ✅ Monitor Gateway health

## 🐛 Troubleshooting

### Gateway Not Responding

**Symptoms:**
- Webhook timeout
- 502/503 errors
- No response

**Solutions:**
1. Check n8n Cloud status
2. Verify Gateway workflow is active
3. Test webhook with curl
4. Check Make.com API status
5. Review n8n execution logs

### Authentication Errors

**Symptoms:**
- 401 Unauthorized
- "Invalid token" errors

**Solutions:**
1. Verify token in Gateway workflow
2. Check token hasn't expired
3. Confirm team/org IDs correct
4. Test token with Make.com API directly

### Rate Limiting

**Symptoms:**
- 429 Too Many Requests
- Slow responses

**Solutions:**
1. Implement request queuing
2. Add retry logic with backoff
3. Upgrade Make.com plan
4. Cache frequently accessed data

## 📊 Monitoring

### Key Metrics
- Request count per action
- Average response time
- Error rate
- Gateway uptime
- Make.com API quota usage

### Logging
```javascript
console.log(`Gateway Request: ${action} for scenario ${scenarioId}`);
console.log(`Make.com Response: ${status} in ${duration}ms`);
console.log(`Error: ${error.message}`);
```

### Alerts
- Gateway workflow stopped
- High error rate (>5%)
- API quota exceeded
- Slow response times (>5s)

## 🔄 Maintenance

### Regular Tasks
- [ ] Check Gateway workflow health (weekly)
- [ ] Review execution logs (weekly)
- [ ] Rotate API tokens (quarterly)
- [ ] Update documentation (as needed)
- [ ] Test all actions (monthly)

### Upgrade Process
1. Test changes in development workflow
2. Document changes
3. Schedule maintenance window
4. Create backup of current Gateway
5. Deploy updates
6. Monitor first hour closely
7. Rollback if issues

## 📝 Example Integrations

### From Claude with n8n MCP
```javascript
// List scenarios
await n8n_trigger_webhook_workflow({
  url: 'https://annoris.app.n8n.cloud/webhook/make-gateway',
  method: 'POST',
  body: { action: 'list' }
});

// Run scenario
await n8n_trigger_webhook_workflow({
  url: 'https://annoris.app.n8n.cloud/webhook/make-gateway',
  method: 'POST',
  body: { 
    action: 'run',
    scenarioId: '7850736',
    data: { input: 'test' }
  }
});
```

### From External Application
```javascript
const response = await fetch('https://annoris.app.n8n.cloud/webhook/make-gateway', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    action: 'run',
    scenarioId: '7850736'
  })
});
```

## 💡 Advanced Usage

### Batch Operations
```json
{
  "action": "batch",
  "operations": [
    {"action": "start", "scenarioId": "7850736"},
    {"action": "run", "scenarioId": "7850736"},
    {"action": "logs", "scenarioId": "7850736"}
  ]
}
```

### Conditional Execution
```json
{
  "action": "run",
  "scenarioId": "7850736",
  "conditions": {
    "onlyIf": "isEnabled === true",
    "retryOnError": 3,
    "timeout": 30000
  }
}
```

## 📞 Support

**Gateway Issues:**
- Check n8n Cloud status
- Review Gateway workflow execution
- Test webhook manually
- Contact Borys if critical

**Make.com API Issues:**
- Check Make.com status page
- Verify API token
- Review API documentation
- Contact Make.com support
