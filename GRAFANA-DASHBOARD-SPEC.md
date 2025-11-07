# Grafana Dashboard Specification: Testing Infrastructure Metrics

**RDB-002 Testing Infrastructure Modernization**
**Version**: 1.0
**Date**: 2025-11-06
**Owner**: @test_stabilize
**Status**: READY FOR IMPLEMENTATION

---

## Overview

Comprehensive Grafana dashboard for monitoring testing infrastructure quality, performance, and security metrics across all 16 microservices.

**Purpose**: Real-time visibility into test quality trends, CI/CD pipeline health, and security compliance.

**Target Users**:
- Development teams (daily monitoring)
- @test_stabilize (quality gates, trend analysis)
- @security_verification (security compliance)
- Leadership (weekly/monthly reports)

**Refresh Rate**: 30 seconds (configurable per panel)

---

## Dashboard Structure

### Layout: 6 Rows, Responsive Design

```
┌─────────────────────────────────────────────────────────────────┐
│ Row 1: Executive Summary (Single-Value Panels, Red/Yellow/Green)│
├─────────────────────────────────────────────────────────────────┤
│ Row 2: Test Coverage Trends (Time Series)                       │
├─────────────────────────────────────────────────────────────────┤
│ Row 3: Test Quality & Mutation Score (Time Series + Gauges)     │
├─────────────────────────────────────────────────────────────────┤
│ Row 4: CI/CD Pipeline Performance (Time Series + Heatmap)       │
├─────────────────────────────────────────────────────────────────┤
│ Row 5: Security Metrics (Gauges + Tables)                       │
├─────────────────────────────────────────────────────────────────┤
│ Row 6: Flakiness & Test Health (Time Series + Tables)           │
└─────────────────────────────────────────────────────────────────┘
```

---

## Data Sources

### 1. Prometheus (Primary - Metrics)
```yaml
name: prometheus-testing
type: prometheus
url: http://prometheus.refactorteam.local:9090
access: proxy
jsonData:
  timeInterval: 30s
  queryTimeout: 60s
```

**Exported Metrics** (via custom exporters):
- `test_coverage_percent{service, type}` - Coverage by service (line/branch/function)
- `test_mutation_score{service}` - Mutation score per service
- `test_suite_duration_seconds{service, type}` - Test execution time
- `test_flaky_rate{service}` - Flaky test percentage
- `test_count{service, type, status}` - Test counts (passed/failed/skipped)
- `ci_pipeline_duration_seconds{stage}` - CI/CD stage durations
- `contract_coverage_percent` - % of 256 connections with Pact contracts
- `secret_scan_violations{severity}` - Secret scanning violations
- `cve_count{severity, service}` - CVE counts per service

### 2. Elasticsearch (Logs & Test Results)
```yaml
name: elasticsearch-testing
type: elasticsearch
url: http://elasticsearch.refactorteam.local:9200
access: proxy
database: test-results-*
jsonData:
  interval: Daily
  timeField: "@timestamp"
  esVersion: 8
```

**Indexed Data**:
- Test execution logs (pass/fail/skip, duration, error messages)
- Mutation testing reports (surviving mutants, killed mutants)
- Secret scan reports (violations, file paths, severity)
- CVE scan results (image, CVE ID, severity, package)
- Contract test results (consumer, provider, status)

### 3. PostgreSQL (Historical Trends)
```yaml
name: postgres-testing
type: postgres
url: postgres.refactorteam.local:5432
database: testing_metrics
user: grafana_reader
jsonData:
  sslmode: require
  maxOpenConns: 10
```

**Tables**:
- `test_coverage_history` (service, date, coverage_type, percent)
- `mutation_score_history` (service, date, score, surviving_mutants)
- `flaky_tests` (test_id, service, flake_rate, last_failure)
- `ci_pipeline_runs` (run_id, date, stage, duration, status)
- `security_scans` (scan_id, date, tool, violations, severity)

### 4. Loki (Log Aggregation - Optional)
```yaml
name: loki-testing
type: loki
url: http://loki.refactorteam.local:3100
access: proxy
```

**Log Streams**:
- `{job="ci-pipeline", stage="fast-fail"}`
- `{job="mutation-testing", service=~".+"}`
- `{job="secret-scan", tool=~"trufflehog|gitleaks"}`

---

## Row 1: Executive Summary

### Panel 1.1: Overall Test Coverage (Stat Panel)
**Type**: Stat (Single Value)
**Size**: 3 columns × 4 rows

**Query (Prometheus)**:
```promql
avg(test_coverage_percent{type="line"})
```

**Thresholds**:
- ❌ Red: < 60%
- ⚠️ Yellow: 60-79%
- ✅ Green: ≥ 80%

**Display**:
- Current value: 65.3%
- Trend sparkline (last 7 days)
- Target: 80%
- Progress bar

### Panel 1.2: Mutation Score (Stat Panel)
**Type**: Stat (Single Value)
**Size**: 3 columns × 4 rows

**Query (Prometheus)**:
```promql
avg(test_mutation_score)
```

**Thresholds**:
- ❌ Red: < 70%
- ⚠️ Yellow: 70-79%
- ✅ Green: ≥ 80%

**Display**:
- Current value: 76.8%
- Trend sparkline (last 7 days)
- Target: 80%

### Panel 1.3: Flaky Test Rate (Stat Panel)
**Type**: Stat (Single Value)
**Size**: 3 columns × 4 rows

**Query (Prometheus)**:
```promql
avg(test_flaky_rate) * 100
```

**Thresholds**:
- ✅ Green: ≤ 1%
- ⚠️ Yellow: 1-3%
- ❌ Red: > 3%

**Display**:
- Current value: 2.1%
- Trend sparkline (last 7 days)
- Target: <1%

### Panel 1.4: Test Suite Duration (Stat Panel)
**Type**: Stat (Single Value)
**Size**: 3 columns × 4 rows

**Query (Prometheus)**:
```promql
sum(rate(test_suite_duration_seconds_sum[5m])) / sum(rate(test_suite_duration_seconds_count[5m]))
```

**Thresholds**:
- ✅ Green: ≤ 5min
- ⚠️ Yellow: 5-10min
- ❌ Red: > 10min

**Display**:
- Current value: 7m 32s
- Trend sparkline (last 7 days)
- Target: <5min

---

## Row 2: Test Coverage Trends

### Panel 2.1: Coverage by Service (Time Series)
**Type**: Time Series
**Size**: 12 columns × 8 rows

**Query (Prometheus)**:
```promql
test_coverage_percent{type="line"}
```

**Legend**: `{{service}} - {{type}}`

**Visualization**:
- Lines mode
- Show points on hover
- Fill opacity: 10%
- Line width: 2px

**Y-axis**:
- Min: 0
- Max: 100
- Unit: percent (0-100)

**Thresholds** (horizontal lines):
- 80% (green) - Target
- 60% (yellow) - Minimum acceptable
- 42% (red dashed) - Baseline

**Time range**: Last 24 weeks (default), filterable

### Panel 2.2: Coverage by Type (Time Series)
**Type**: Time Series (Stacked Area)
**Size**: 12 columns × 8 rows

**Queries (Prometheus)**:
```promql
# Unit test coverage
avg(test_coverage_percent{type="unit"})

# Contract test coverage
avg(test_coverage_percent{type="contract"})

# Integration test coverage
avg(test_coverage_percent{type="integration"})

# E2E test coverage
avg(test_coverage_percent{type="e2e"})
```

**Visualization**:
- Stacked area chart
- Fill opacity: 60%
- Colors: Blue (unit), Green (contract), Yellow (integration), Red (e2e)

**Legend**:
- Unit Tests (50% target)
- Contract Tests (30% target)
- Integration Tests (15% target)
- E2E Tests (5% target)

---

## Row 3: Test Quality & Mutation Score

### Panel 3.1: Mutation Score Trend (Time Series)
**Type**: Time Series
**Size**: 8 columns × 8 rows

**Query (Prometheus)**:
```promql
test_mutation_score
```

**Legend**: `{{service}}`

**Thresholds** (horizontal lines):
- 90% (light green) - Aspirational
- 80% (green) - Target for new code
- 75% (yellow) - Minimum (legacy)
- 68% (red dashed) - Week 4 baseline

**Annotations**:
- Week 4: Baseline established
- Week 16: Mutation testing gate enabled
- Week 24: Target achieved

### Panel 3.2: Mutation Score Gauge (Gauge Panel)
**Type**: Gauge
**Size**: 4 columns × 8 rows

**Query (Prometheus)**:
```promql
avg(test_mutation_score)
```

**Thresholds**:
- 0-70%: Red
- 70-80%: Yellow
- 80-90%: Green
- 90-100%: Light Green

**Display**:
- Show threshold markers
- Show threshold labels
- Min: 0, Max: 100

### Panel 3.3: Surviving Mutants by Service (Bar Gauge)
**Type**: Bar Gauge
**Size**: 12 columns × 6 rows

**Query (Elasticsearch)**:
```json
{
  "query": {
    "bool": {
      "must": [
        {"range": {"@timestamp": {"gte": "now-7d"}}},
        {"term": {"status": "survived"}}
      ]
    }
  },
  "aggs": {
    "by_service": {
      "terms": {"field": "service.keyword", "size": 16},
      "aggs": {
        "mutant_count": {"value_count": {"field": "mutant_id"}}
      }
    }
  }
}
```

**Visualization**:
- Horizontal bar gauge
- Sort: Descending (most surviving mutants first)
- Color: Red gradient

**Thresholds**:
- 0-10: Green
- 10-50: Yellow
- 50+: Red

---

## Row 4: CI/CD Pipeline Performance

### Panel 4.1: Pipeline Stage Duration (Time Series)
**Type**: Time Series (Stacked)
**Size**: 8 columns × 8 rows

**Queries (Prometheus)**:
```promql
# Fast-fail gate (Stage 1)
avg(ci_pipeline_duration_seconds{stage="fast-fail"})

# Full test suite (Stage 2)
avg(ci_pipeline_duration_seconds{stage="full-suite"})

# Mutation testing (Stage 3)
avg(ci_pipeline_duration_seconds{stage="mutation"})

# Performance testing (Stage 4)
avg(ci_pipeline_duration_seconds{stage="performance"})
```

**Visualization**:
- Stacked bars
- Colors: Blue (fast-fail), Green (full-suite), Yellow (mutation), Orange (performance)

**Y-axis**: Duration (seconds)

**Thresholds** (annotations):
- 2min: Fast-fail target
- 5min: Full suite target
- 13min: Total pipeline target

### Panel 4.2: Fast-Fail Success Rate (Stat Panel)
**Type**: Stat
**Size**: 4 columns × 4 rows

**Query (Prometheus)**:
```promql
sum(rate(ci_pipeline_runs{stage="fast-fail", status="failed"}[1h])) /
sum(rate(ci_pipeline_runs{stage="fast-fail"}[1h])) * 100
```

**Display**:
- Title: "Fast-Fail Catch Rate"
- Current value: 82.3%
- Target: ≥80% (failures caught in Stage 1)

**Thresholds**:
- ✅ Green: ≥ 80%
- ⚠️ Yellow: 70-80%
- ❌ Red: < 70%

### Panel 4.3: Pipeline Duration Heatmap (Heatmap)
**Type**: Heatmap
**Size**: 12 columns × 8 rows

**Query (Prometheus)**:
```promql
histogram_quantile(0.95, sum(rate(ci_pipeline_duration_seconds_bucket[5m])) by (le, hour))
```

**X-axis**: Hour of day (0-23)
**Y-axis**: Day of week (Mon-Sun)
**Color**: Duration (seconds)

**Color Scale**:
- Green: <5min
- Yellow: 5-10min
- Red: >10min

**Purpose**: Identify slow pipeline periods (e.g., peak hours)

---

## Row 5: Security Metrics

### Panel 5.1: Secret Scan Pass Rate (Gauge)
**Type**: Gauge
**Size**: 3 columns × 6 rows

**Query (Prometheus)**:
```promql
(sum(secret_scan_violations{severity="high"}) == bool 0) * 100
```

**Thresholds**:
- ❌ Red: < 100% (ANY violations)
- ✅ Green: 100% (zero violations)

**Display**:
- Binary: PASS (100%) or FAIL (<100%)
- BLOCKING status indicator

### Panel 5.2: CVE Threshold Compliance (Gauge)
**Type**: Gauge
**Size**: 3 columns × 6 rows

**Query (Prometheus)**:
```promql
# Compliant if: 0 CRITICAL, ≤3 HIGH per service
(sum(cve_count{severity="critical"}) == bool 0) *
(sum(cve_count{severity="high"} <= bool 3) * 100
```

**Thresholds**:
- ❌ Red: Non-compliant (any CRITICAL or >3 HIGH)
- ⚠️ Yellow: 1-3 HIGH CVEs
- ✅ Green: 0 CRITICAL, ≤3 HIGH

### Panel 5.3: CVE Count by Service (Table)
**Type**: Table
**Size**: 6 columns × 6 rows

**Query (Elasticsearch)**:
```json
{
  "query": {
    "bool": {
      "must": [
        {"range": {"@timestamp": {"gte": "now-24h"}}},
        {"exists": {"field": "cve_id"}}
      ]
    }
  },
  "aggs": {
    "by_service": {
      "terms": {"field": "service.keyword", "size": 16},
      "aggs": {
        "critical": {
          "filter": {"term": {"severity": "CRITICAL"}}
        },
        "high": {
          "filter": {"term": {"severity": "HIGH"}}
        },
        "medium": {
          "filter": {"term": {"severity": "MEDIUM"}}
        }
      }
    }
  }
}
```

**Columns**:
- Service
- CRITICAL (❌ if > 0)
- HIGH (⚠️ if > 3)
- MEDIUM (info)
- Last Scan (timestamp)
- Compliance (✅/❌)

**Sort**: CRITICAL DESC, HIGH DESC

### Panel 5.4: Test Data Synthetic % (Stat)
**Type**: Stat
**Size**: 3 columns × 6 rows

**Query (PostgreSQL)**:
```sql
SELECT
  COUNT(CASE WHEN data_source = 'synthetic' THEN 1 END)::float / COUNT(*) * 100
FROM test_data_sources
WHERE timestamp >= NOW() - INTERVAL '24 hours'
```

**Thresholds**:
- ❌ Red: < 100% (ANY production data)
- ✅ Green: 100% (synthetic only)

**Display**:
- Current: 100.0%
- Target: 100% (BLOCKING)

---

## Row 6: Flakiness & Test Health

### Panel 6.1: Flaky Test Rate Trend (Time Series)
**Type**: Time Series
**Size**: 8 columns × 8 rows

**Query (Prometheus)**:
```promql
test_flaky_rate * 100
```

**Legend**: `{{service}}`

**Y-axis**: Flaky rate (%)

**Thresholds** (horizontal lines):
- 0.5% (light green) - Week 32 target
- 1.0% (green) - Week 24 target
- 3.0% (yellow) - Week 12 target
- 8.0% (red dashed) - Baseline

**Annotations**:
- Week 8: First flake reduction milestone
- Week 24: <1% target

### Panel 6.2: Top 10 Flaky Tests (Table)
**Type**: Table
**Size**: 12 columns × 8 rows

**Query (PostgreSQL)**:
```sql
SELECT
  test_id,
  service,
  flake_rate * 100 as flake_percent,
  total_runs,
  failures,
  last_failure,
  status,
  assigned_to
FROM flaky_tests
WHERE timestamp >= NOW() - INTERVAL '7 days'
ORDER BY flake_rate DESC
LIMIT 10
```

**Columns**:
- Test ID (clickable link to source)
- Service
- Flake Rate (%) [color-coded: green <1%, yellow 1-3%, red >3%]
- Total Runs
- Failures
- Last Failure (relative time)
- Status (active/quarantined/fixed)
- Assigned To

**Cell Colors**:
- Flake Rate:
  - Green: <1%
  - Yellow: 1-3%
  - Red: >3%
  - Dark red: >5%

**Actions**:
- Click test ID → View test source in GitHub
- Click service → Filter dashboard by service

### Panel 6.3: Test Count by Status (Pie Chart)
**Type**: Pie Chart
**Size**: 4 columns × 8 rows

**Query (Prometheus)**:
```promql
sum by (status) (test_count)
```

**Legend**:
- ✅ Passed (green)
- ❌ Failed (red)
- ⏭️ Skipped (gray)
- ⚠️ Flaky (yellow)
- 🚫 Quarantined (orange)

**Display**:
- Show percentages
- Show legend
- Donut chart (inner radius: 50%)

---

## Dashboard Variables (Filters)

### Variable 1: Service Filter
**Name**: `service`
**Type**: Query (Prometheus)
**Query**: `label_values(test_coverage_percent, service)`
**Multi-select**: Yes
**Include All**: Yes
**Default**: All

### Variable 2: Time Range
**Name**: `time_range`
**Type**: Custom
**Options**:
- Last 24 hours
- Last 7 days
- Last 4 weeks (default)
- Last 12 weeks
- Last 24 weeks (full project)

### Variable 3: Coverage Type
**Name**: `coverage_type`
**Type**: Custom
**Options**:
- Line (default)
- Branch
- Function
- All

### Variable 4: Environment
**Name**: `env`
**Type**: Query (Prometheus)
**Query**: `label_values(test_coverage_percent, env)`
**Options**: dev, staging, ci
**Default**: ci

---

## Alert Rules

### Alert 1: Coverage Regression
**Name**: `TestCoverageRegression`
**Condition**:
```promql
(avg(test_coverage_percent{type="line"}) < 80) AND
(delta(avg(test_coverage_percent{type="line"})[1d]) < -2)
```
**Severity**: Warning
**For**: 1 hour
**Annotations**:
- Summary: "Test coverage dropped below 80% and decreased >2% in 24h"
- Description: "Current: {{ $value }}%, Target: 80%"

### Alert 2: Mutation Score Below Threshold
**Name**: `MutationScoreBelowThreshold`
**Condition**:
```promql
avg(test_mutation_score) < 75
```
**Severity**: Critical
**For**: 30 minutes
**Annotations**:
- Summary: "Mutation score below 75% (CI gate threshold)"
- Description: "Current: {{ $value }}%, Target: 80%, Minimum: 75%"

### Alert 3: Flaky Test Rate High
**Name**: `FlakyTestRateHigh`
**Condition**:
```promql
avg(test_flaky_rate) > 0.03
```
**Severity**: Warning
**For**: 6 hours
**Annotations**:
- Summary: "Flaky test rate exceeded 3%"
- Description: "Current: {{ $value }}%, Target: <1%"

### Alert 4: Test Suite Timeout
**Name**: `TestSuiteTimeout`
**Condition**:
```promql
avg(test_suite_duration_seconds) > 600
```
**Severity**: Warning
**For**: 1 hour
**Annotations**:
- Summary: "Test suite duration exceeded 10 minutes"
- Description: "Current: {{ $value }}s ({{ humanizeDuration $value }}), Target: <5min"

### Alert 5: Fast-Fail Gate Slow
**Name**: `FastFailGateSlow`
**Condition**:
```promql
avg(ci_pipeline_duration_seconds{stage="fast-fail"}) > 120
```
**Severity**: Warning
**For**: 30 minutes
**Annotations**:
- Summary: "Fast-fail gate exceeded 2-minute target"
- Description: "Current: {{ $value }}s, Target: <2min (120s)"

### Alert 6: Secret Scan Violation (CRITICAL)
**Name**: `SecretScanViolation`
**Condition**:
```promql
sum(secret_scan_violations{severity="high"}) > 0
```
**Severity**: Critical
**For**: 0 (immediate)
**Annotations**:
- Summary: "🚨 SECRET DETECTED - BLOCKING DEPLOYMENT"
- Description: "{{ $value }} secret(s) detected. Deployment BLOCKED until resolved."
- Runbook: "https://wiki.refactorteam.local/runbooks/secret-leak-response"

### Alert 7: CVE Threshold Exceeded
**Name**: `CVEThresholdExceeded`
**Condition**:
```promql
(sum(cve_count{severity="critical"}) > 0) OR
(sum(cve_count{severity="high"}) > 3)
```
**Severity**: High
**For**: 1 hour
**Annotations**:
- Summary: "CVE threshold exceeded (0 CRITICAL, ≤3 HIGH)"
- Description: "CRITICAL: {{ $values.critical }}, HIGH: {{ $values.high }}"

### Alert 8: Production Data in Tests
**Name**: `ProductionDataDetected`
**Condition**:
```sql
-- PostgreSQL query
SELECT COUNT(*) FROM test_data_sources
WHERE data_source != 'synthetic' AND timestamp >= NOW() - INTERVAL '1 hour'
```
**Severity**: Critical
**For**: 0 (immediate)
**Annotations**:
- Summary: "🚨 PRODUCTION DATA DETECTED IN TESTS - COMPLIANCE VIOLATION"
- Description: "{{ $value }} test(s) using production data. GDPR/HIPAA violation risk."

---

## Notification Channels

### Slack Integration
**Channel**: `#testing-infrastructure-alerts`
**Severity Routing**:
- Critical → @test_stabilize @security_verification (immediate)
- High → @test_stabilize (within 1 hour)
- Warning → #testing-infrastructure-alerts (no ping)

**Alert Format**:
```
🔔 [SEVERITY] Alert Name
📊 Current Value: X (Target: Y)
🕐 Triggered: 15 minutes ago
📝 Description: ...
🔗 Dashboard: <link>
📖 Runbook: <link>
```

### Email Integration
**Recipients**:
- Critical alerts: test-stabilize@refactorteam.local, security@refactorteam.local
- High alerts: test-stabilize@refactorteam.local
- Weekly digest: team@refactorteam.local

### PagerDuty Integration (Production Only)
**Service**: Testing Infrastructure
**Escalation Policy**: On-call → @test_stabilize → Engineering Manager
**Critical Alerts Only**:
- SecretScanViolation
- ProductionDataDetected

---

## Implementation Guide

### Week 1: Dashboard Setup

**Day 1-2: Data Sources**
```bash
# Install Prometheus exporters
helm install prometheus-exporter ./charts/prometheus-exporter

# Configure Elasticsearch index templates
curl -X PUT "elasticsearch:9200/_index_template/test-results" \
  -H 'Content-Type: application/json' \
  -d @elasticsearch-template.json

# Create PostgreSQL tables
psql -h postgres.refactorteam.local -d testing_metrics -f schema.sql
```

**Day 3-4: Dashboard Creation**
```bash
# Import Grafana dashboard JSON
curl -X POST "http://grafana.refactorteam.local/api/dashboards/db" \
  -H "Authorization: Bearer $GRAFANA_API_KEY" \
  -H "Content-Type: application/json" \
  -d @grafana-dashboard.json

# Or use Terraform
terraform apply -var="dashboard_json=$(cat grafana-dashboard.json)"
```

**Day 5: Alert Configuration**
```bash
# Apply alert rules
curl -X POST "http://grafana.refactorteam.local/api/ruler/grafana/api/v1/rules/testing-infrastructure" \
  -H "Authorization: Bearer $GRAFANA_API_KEY" \
  -H "Content-Type: application/json" \
  -d @alert-rules.json
```

### Week 2-4: Validation

**Metrics Validation**:
- [ ] Verify all 16 services reporting metrics
- [ ] Validate thresholds trigger correctly
- [ ] Test alert routing (Slack, email, PagerDuty)
- [ ] Confirm data retention (30 days Prometheus, 90 days Elasticsearch)

**User Acceptance**:
- [ ] Demo to development teams
- [ ] Gather feedback on panel layout
- [ ] Adjust thresholds based on baseline data
- [ ] Document dashboard usage in wiki

---

## Maintenance & Troubleshooting

### Data Retention Policies

**Prometheus**: 30 days (configurable in prometheus.yml)
```yaml
storage:
  tsdb:
    retention.time: 30d
    retention.size: 50GB
```

**Elasticsearch**: 90 days
```json
{
  "policy": {
    "phases": {
      "hot": {"min_age": "0ms"},
      "delete": {"min_age": "90d"}
    }
  }
}
```

**PostgreSQL**: 1 year (manual archival)
```sql
-- Partition by month
CREATE TABLE test_coverage_history_2025_11 PARTITION OF test_coverage_history
FOR VALUES FROM ('2025-11-01') TO ('2025-12-01');
```

### Common Issues

**Issue 1: Missing Metrics**
```bash
# Check exporter health
curl http://prometheus-exporter:9090/metrics | grep test_coverage

# Restart exporter if needed
kubectl rollout restart deployment/prometheus-exporter -n monitoring
```

**Issue 2: Slow Queries**
```sql
-- Add indexes for frequent queries
CREATE INDEX idx_service_timestamp ON test_coverage_history(service, timestamp DESC);
CREATE INDEX idx_flaky_tests ON flaky_tests(flake_rate DESC, service);
```

**Issue 3: Alert Fatigue**
- Increase `For` duration (e.g., 30min → 1 hour)
- Adjust thresholds based on baseline variability
- Use alert inhibition rules (silence lower severity if higher severity active)

---

## Export Configuration

### Grafana Dashboard JSON Skeleton
```json
{
  "dashboard": {
    "title": "Testing Infrastructure Metrics",
    "tags": ["testing", "quality", "security"],
    "timezone": "browser",
    "schemaVersion": 38,
    "refresh": "30s",
    "panels": [
      {
        "id": 1,
        "type": "stat",
        "title": "Overall Test Coverage",
        "targets": [
          {
            "expr": "avg(test_coverage_percent{type=\"line\"})",
            "refId": "A"
          }
        ],
        "fieldConfig": {
          "defaults": {
            "unit": "percent",
            "thresholds": {
              "mode": "absolute",
              "steps": [
                {"value": 0, "color": "red"},
                {"value": 60, "color": "yellow"},
                {"value": 80, "color": "green"}
              ]
            }
          }
        }
      }
      // ... additional panels
    ],
    "templating": {
      "list": [
        {
          "name": "service",
          "type": "query",
          "query": "label_values(test_coverage_percent, service)",
          "multi": true,
          "includeAll": true
        }
      ]
    }
  }
}
```

### Prometheus Exporter Configuration
```yaml
# prometheus-exporter/config.yaml
metrics:
  - name: test_coverage_percent
    help: Test coverage percentage by service and type
    type: gauge
    labels: [service, type]
    query: |
      SELECT service, type, coverage_percent
      FROM test_coverage_history
      WHERE timestamp >= NOW() - INTERVAL '5 minutes'

  - name: test_mutation_score
    help: Mutation score by service
    type: gauge
    labels: [service]
    query: |
      SELECT service, score
      FROM mutation_score_history
      WHERE timestamp >= NOW() - INTERVAL '5 minutes'

  - name: test_flaky_rate
    help: Flaky test rate by service
    type: gauge
    labels: [service]
    query: |
      SELECT service, flake_rate
      FROM flaky_tests
      WHERE timestamp >= NOW() - INTERVAL '5 minutes'
```

---

## Success Criteria (Week 4)

- [ ] Dashboard deployed and accessible to all teams
- [ ] All 16 services reporting metrics (100% coverage)
- [ ] 8 alert rules active and tested
- [ ] 3 notification channels configured (Slack, email, PagerDuty)
- [ ] Data retention policies implemented
- [ ] User documentation published (wiki)
- [ ] Zero critical alerts in first 48 hours (indicates baseline stability)

---

## Future Enhancements (Post-Week 24)

1. **Predictive Analytics**: ML model to predict flaky test probability
2. **Cost Tracking**: CI/CD pipeline cost per service (compute hours × rate)
3. **Developer Productivity**: Time saved by fast-fail gate (avg per PR)
4. **Test ROI**: Bugs caught per 100 tests (unit vs integration vs E2E)
5. **Mobile App**: Grafana mobile app for on-call monitoring

---

## Appendix: Quick Links

**Dashboard URLs**:
- Production: https://grafana.refactorteam.local/d/testing-infrastructure
- Staging: https://grafana-staging.refactorteam.local/d/testing-infrastructure

**Documentation**:
- Wiki: https://wiki.refactorteam.local/dashboards/testing-infrastructure
- Runbooks: https://wiki.refactorteam.local/runbooks/testing-alerts

**Source Code**:
- Dashboard JSON: `/test_stabilize/grafana/dashboard.json`
- Alert Rules: `/test_stabilize/grafana/alert-rules.json`
- Exporters: `/test_stabilize/prometheus/exporters/`

---

**Version**: 1.0
**Last Updated**: 2025-11-06
**Status**: ✅ READY FOR IMPLEMENTATION (Week 1, Day 3-5)
