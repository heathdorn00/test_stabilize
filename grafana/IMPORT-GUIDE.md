# Grafana Dashboard Import Guide

**RDB-002 Testing Infrastructure Modernization**
**Quick Start**: 15-30 minutes to full dashboard deployment

---

## Prerequisites

- [ ] Grafana 9.0+ installed and accessible
- [ ] Prometheus data source configured
- [ ] Elasticsearch data source configured (optional, for detailed logs)
- [ ] PostgreSQL data source configured (for historical trends)
- [ ] Admin or Editor permissions in Grafana

---

## Quick Import (5 minutes)

### Option 1: Web UI Import

1. **Navigate to Grafana**
   ```
   https://grafana.refactorteam.local
   ```

2. **Import Dashboard**
   - Click **"+" → "Import"** in left sidebar
   - Click **"Upload JSON file"**
   - Select `test_stabilize/grafana/dashboard.json`
   - OR paste JSON contents directly

3. **Configure Data Sources**
   - Select data source for each panel:
     - **Prometheus**: `prometheus-testing`
     - **Elasticsearch**: `elasticsearch-testing`
     - **PostgreSQL**: `postgres-testing`
   - Click **"Import"**

4. **Verify Dashboard**
   - Navigate to: `https://grafana.refactorteam.local/d/testing-infrastructure-v1`
   - Check that panels display data (may show "No data" initially if metrics not yet collected)

---

### Option 2: API Import (Automated)

```bash
# Set Grafana API key
export GRAFANA_API_KEY="your-api-key-here"
export GRAFANA_URL="https://grafana.refactorteam.local"

# Import dashboard
curl -X POST "$GRAFANA_URL/api/dashboards/db" \
  -H "Authorization: Bearer $GRAFANA_API_KEY" \
  -H "Content-Type: application/json" \
  -d @test_stabilize/grafana/dashboard.json

# Expected output:
# {
#   "id": 123,
#   "slug": "testing-infrastructure-v1",
#   "status": "success",
#   "uid": "testing-infrastructure-v1",
#   "url": "/d/testing-infrastructure-v1/testing-infrastructure-metrics-rdb-002",
#   "version": 1
# }
```

---

### Option 3: Terraform (Infrastructure as Code)

```hcl
# terraform/grafana.tf

resource "grafana_dashboard" "testing_infrastructure" {
  config_json = file("${path.module}/../test_stabilize/grafana/dashboard.json")
  folder      = grafana_folder.testing.id
}

resource "grafana_folder" "testing" {
  title = "Testing Infrastructure"
}
```

```bash
# Apply Terraform
cd terraform
terraform init
terraform apply
```

---

## Alert Rules Import (10 minutes)

### Option 1: Web UI Import

1. **Navigate to Alerting**
   - Click **"Alerting" → "Alert rules"** in left sidebar
   - Click **"New alert rule"**

2. **Import Each Rule**
   - Copy rule definitions from `alert-rules.json`
   - Paste into alert editor
   - Configure notification policies (see below)
   - Save each rule

### Option 2: API Import (Automated)

```bash
# Import all alert rules
curl -X POST "$GRAFANA_URL/api/ruler/grafana/api/v1/rules/testing-infrastructure" \
  -H "Authorization: Bearer $GRAFANA_API_KEY" \
  -H "Content-Type: application/json" \
  -d @test_stabilize/grafana/alert-rules.json

# Expected output:
# {"message": "rule group updated successfully"}
```

---

## Data Source Configuration (15 minutes)

### 1. Prometheus Data Source

```bash
# Add Prometheus data source via API
curl -X POST "$GRAFANA_URL/api/datasources" \
  -H "Authorization: Bearer $GRAFANA_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "prometheus-testing",
    "type": "prometheus",
    "url": "http://prometheus.refactorteam.local:9090",
    "access": "proxy",
    "isDefault": false,
    "jsonData": {
      "timeInterval": "30s",
      "queryTimeout": "60s"
    }
  }'
```

**OR via Web UI**:
- Navigate to **"Configuration" → "Data sources" → "Add data source"**
- Select **"Prometheus"**
- Name: `prometheus-testing`
- URL: `http://prometheus.refactorteam.local:9090`
- Click **"Save & test"**

### 2. Elasticsearch Data Source

```bash
# Add Elasticsearch data source via API
curl -X POST "$GRAFANA_URL/api/datasources" \
  -H "Authorization: Bearer $GRAFANA_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "elasticsearch-testing",
    "type": "elasticsearch",
    "url": "http://elasticsearch.refactorteam.local:9200",
    "access": "proxy",
    "database": "test-results-*",
    "jsonData": {
      "interval": "Daily",
      "timeField": "@timestamp",
      "esVersion": "8.0.0"
    }
  }'
```

### 3. PostgreSQL Data Source

```bash
# Add PostgreSQL data source via API
curl -X POST "$GRAFANA_URL/api/datasources" \
  -H "Authorization: Bearer $GRAFANA_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "postgres-testing",
    "type": "postgres",
    "url": "postgres.refactorteam.local:5432",
    "database": "testing_metrics",
    "user": "grafana_reader",
    "secureJsonData": {
      "password": "your-password-here"
    },
    "jsonData": {
      "sslmode": "require",
      "maxOpenConns": 10,
      "postgresVersion": 1400
    }
  }'
```

---

## Notification Channels (10 minutes)

### 1. Slack Integration

```bash
# Add Slack contact point
curl -X POST "$GRAFANA_URL/api/v1/provisioning/contact-points" \
  -H "Authorization: Bearer $GRAFANA_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "slack-testing-alerts",
    "type": "slack",
    "settings": {
      "url": "https://hooks.slack.com/services/YOUR/WEBHOOK/URL",
      "recipient": "#testing-infrastructure-alerts",
      "username": "Grafana Testing Alerts",
      "icon_emoji": ":grafana:",
      "mentionChannel": "here",
      "title": "{{ .GroupLabels.alertname }}",
      "text": "{{ range .Alerts }}\n*Alert:* {{ .Labels.alertname }}\n*Severity:* {{ .Labels.severity }}\n*Summary:* {{ .Annotations.summary }}\n*Description:* {{ .Annotations.description }}\n{{ end }}"
    }
  }'
```

### 2. Email Integration

```bash
# Add email contact point
curl -X POST "$GRAFANA_URL/api/v1/provisioning/contact-points" \
  -H "Authorization: Bearer $GRAFANA_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "email-testing-alerts",
    "type": "email",
    "settings": {
      "addresses": "test-stabilize@refactorteam.local;security@refactorteam.local",
      "singleEmail": false
    }
  }'
```

### 3. PagerDuty Integration (Critical Alerts Only)

```bash
# Add PagerDuty contact point
curl -X POST "$GRAFANA_URL/api/v1/provisioning/contact-points" \
  -H "Authorization: Bearer $GRAFANA_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "pagerduty-testing-critical",
    "type": "pagerduty",
    "settings": {
      "integrationKey": "YOUR_PAGERDUTY_INTEGRATION_KEY",
      "severity": "critical",
      "class": "testing-infrastructure",
      "component": "ci-cd"
    }
  }'
```

### 4. Notification Policy

```bash
# Configure notification policy (routing)
curl -X PUT "$GRAFANA_URL/api/v1/provisioning/policies" \
  -H "Authorization: Bearer $GRAFANA_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "receiver": "slack-testing-alerts",
    "group_by": ["alertname", "severity"],
    "group_wait": "30s",
    "group_interval": "5m",
    "repeat_interval": "4h",
    "routes": [
      {
        "receiver": "pagerduty-testing-critical",
        "matchers": [
          "severity=critical"
        ],
        "continue": true
      },
      {
        "receiver": "email-testing-alerts",
        "matchers": [
          "severity=~critical|high"
        ],
        "continue": false
      }
    ]
  }'
```

---

## Verification Checklist

### Dashboard Verification

- [ ] Dashboard loads without errors
- [ ] All 13 panels render (some may show "No data" initially)
- [ ] Variables (service, coverage_type, env) populate correctly
- [ ] Time range selector works (24h, 7d, 4w, 12w, 24w)
- [ ] Hover tooltips display correctly
- [ ] Legend shows service names

### Metrics Verification

```bash
# Test Prometheus queries
curl "http://prometheus.refactorteam.local:9090/api/v1/query?query=test_coverage_percent"

# Expected output: JSON with service coverage metrics
# If empty: Prometheus exporter not configured yet (Week 1-4 task)
```

### Alert Verification

```bash
# List all alert rules
curl -X GET "$GRAFANA_URL/api/v1/provisioning/alert-rules" \
  -H "Authorization: Bearer $GRAFANA_API_KEY"

# Expected: 9 alert rules returned

# Test alert rule (trigger intentionally)
curl -X POST "$GRAFANA_URL/api/v1/provisioning/alert-rules/test" \
  -H "Authorization: Bearer $GRAFANA_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "uid": "secret-scan-violation"
  }'
```

### Notification Verification

- [ ] Send test alert to Slack: Check #testing-infrastructure-alerts channel
- [ ] Send test email: Check test-stabilize@refactorteam.local inbox
- [ ] Trigger test PagerDuty incident (critical alerts only)
- [ ] Verify alert format matches specification

---

## Troubleshooting

### Issue 1: "No data" in all panels

**Cause**: Prometheus exporter not configured or no metrics collected yet

**Solution**:
```bash
# Check Prometheus targets
curl http://prometheus.refactorteam.local:9090/api/v1/targets

# Verify exporter is running
kubectl get pods -n monitoring | grep prometheus-exporter

# If exporter missing, install (Week 1-4 task)
helm install prometheus-exporter ./charts/prometheus-exporter
```

### Issue 2: "Error loading data" for specific panels

**Cause**: Data source not configured or incorrect credentials

**Solution**:
```bash
# Test data source connection
curl -X GET "$GRAFANA_URL/api/datasources/name/prometheus-testing" \
  -H "Authorization: Bearer $GRAFANA_API_KEY"

# Test query directly
curl -X POST "$GRAFANA_URL/api/ds/query" \
  -H "Authorization: Bearer $GRAFANA_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "queries": [{
      "refId": "A",
      "datasource": {"uid": "prometheus-testing"},
      "expr": "test_coverage_percent"
    }]
  }'
```

### Issue 3: Alert not firing when condition is met

**Cause**: Alert evaluation interval too long or condition misconfigured

**Solution**:
```bash
# Check alert rule status
curl -X GET "$GRAFANA_URL/api/v1/provisioning/alert-rules" \
  -H "Authorization: Bearer $GRAFANA_API_KEY" | jq '.[] | select(.uid=="secret-scan-violation")'

# Force alert evaluation
curl -X POST "$GRAFANA_URL/api/v1/eval" \
  -H "Authorization: Bearer $GRAFANA_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "uid": "secret-scan-violation",
    "from": "now-1h",
    "to": "now"
  }'
```

### Issue 4: Slack notifications not received

**Cause**: Webhook URL incorrect or channel permissions

**Solution**:
```bash
# Test Slack webhook manually
curl -X POST "https://hooks.slack.com/services/YOUR/WEBHOOK/URL" \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Test from Grafana dashboard setup"
  }'

# Check Grafana notification history
curl -X GET "$GRAFANA_URL/api/alert-notifications" \
  -H "Authorization: Bearer $GRAFANA_API_KEY"
```

---

## Post-Import Configuration

### 1. Set Dashboard as Home Dashboard

```bash
# Set as default dashboard for team
curl -X PUT "$GRAFANA_URL/api/user/preferences" \
  -H "Authorization: Bearer $GRAFANA_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "homeDashboardUID": "testing-infrastructure-v1"
  }'
```

### 2. Create Dashboard Snapshots (Optional)

```bash
# Create snapshot for sharing
curl -X POST "$GRAFANA_URL/api/snapshots" \
  -H "Authorization: Bearer $GRAFANA_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "dashboard": <dashboard_json>,
    "name": "Testing Infrastructure - Week 4 Baseline",
    "expires": 2592000
  }'
```

### 3. Schedule PDF Reports (Optional)

```bash
# Install Grafana Image Renderer plugin
grafana-cli plugins install grafana-image-renderer

# Create weekly email report
# (Configure via Web UI: Dashboard → Share → Report)
```

---

## Maintenance

### Weekly Tasks
- [ ] Review alert history (reduce false positives)
- [ ] Check data source connectivity
- [ ] Verify metric collection (all 16 services reporting)
- [ ] Adjust thresholds based on trends

### Monthly Tasks
- [ ] Archive old dashboard versions
- [ ] Review and update alert rules
- [ ] Performance tune slow queries (add indexes)
- [ ] Update documentation (wiki)

### Quarterly Tasks
- [ ] Review data retention policies (Prometheus: 30d, Elasticsearch: 90d, PostgreSQL: 1y)
- [ ] Archive historical data to cold storage
- [ ] Security audit (rotate API keys, review permissions)
- [ ] Stakeholder review (dashboard improvements)

---

## Additional Resources

**Documentation**:
- Grafana Dashboard Spec: `test_stabilize/GRAFANA-DASHBOARD-SPEC.md`
- RDB-002: `code_architect/RDB-002-Testing-Infrastructure-Modernization.md`
- Week 1 Plan: `test_stabilize/WEEK-1-EXECUTION-PLAN.md`

**Dashboard URLs**:
- Production: https://grafana.refactorteam.local/d/testing-infrastructure-v1
- Staging: https://grafana-staging.refactorteam.local/d/testing-infrastructure-v1

**Support**:
- Slack: #testing-infrastructure-alerts
- Email: test-stabilize@refactorteam.local
- Wiki: https://wiki.refactorteam.local/dashboards/testing-infrastructure

---

**Import Completion Checklist**:
- [ ] Dashboard imported successfully
- [ ] 3 data sources configured (Prometheus, Elasticsearch, PostgreSQL)
- [ ] 9 alert rules imported
- [ ] 3 notification channels configured (Slack, email, PagerDuty)
- [ ] Verification tests passed
- [ ] Team demo scheduled (Week 1, Day 5)

**Estimated Time**: 30-45 minutes total
**Status**: ✅ Ready for Week 1 implementation
