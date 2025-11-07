# Grafana Dashboards

**Task**: bd88ec - Deploy observability stack (Prometheus, Grafana, Loki, Jaeger)

This directory contains 12 comprehensive Grafana dashboards for monitoring the 16 microservices refactor.

---

## Dashboard Overview

| # | Dashboard | Status | Description |
|---|-----------|--------|-------------|
| 1 | Overview | ✅ Complete | High-level view of all 16 microservices |
| 2 | wxWidgets Services | ✅ Complete | Detailed monitoring for 7 C++ services |
| 3 | PolyORB Services | 📝 TODO | Detailed monitoring for 9 Ada services |
| 4 | Infrastructure | 📝 TODO | Kubernetes, nodes, pods, containers |
| 5 | APM (Traces) | 📝 TODO | Distributed tracing with Jaeger |
| 6 | Business Metrics | 📝 TODO | Widget operations, user activity |
| 7 | SLO Compliance | ✅ Complete | Service Level Objectives tracking |
| 8 | Alerts | 📝 TODO | Active alerts and alert history |
| 9 | Database | 📝 TODO | PostgreSQL monitoring |
| 10 | Redis | 📝 TODO | Redis cache monitoring |
| 11 | Security | 📝 TODO | Security events and audit logs |
| 12 | Cost | 📝 TODO | Resource usage and cost tracking |

---

## Installation

### Import Dashboards into Grafana

**Option 1: Using ConfigMap (Automated)**

```bash
# Create ConfigMap with all dashboards
kubectl create configmap grafana-dashboards \
  --from-file=observability/dashboards/ \
  -n observability

# Restart Grafana to load dashboards
kubectl rollout restart deployment/prometheus-grafana -n observability
```

**Option 2: Manual Import via UI**

1. Access Grafana UI:
   ```bash
   kubectl port-forward -n observability svc/prometheus-grafana 3000:80
   ```

2. Navigate to: http://localhost:3000
3. Login: admin / changeme (change in production!)
4. Go to: **Dashboards → Import**
5. Upload each JSON file

**Option 3: Using Grafana API**

```bash
# Set Grafana URL and credentials
GRAFANA_URL="http://localhost:3000"
GRAFANA_USER="admin"
GRAFANA_PASSWORD="changeme"

# Import all dashboards
for dashboard in *.json; do
  curl -X POST \
    -H "Content-Type: application/json" \
    -u "${GRAFANA_USER}:${GRAFANA_PASSWORD}" \
    "${GRAFANA_URL}/api/dashboards/db" \
    -d @"${dashboard}"
done
```

---

## Dashboard Details

### 1. Overview Dashboard (✅ Complete)

**File**: `01-overview-dashboard.json`

**Purpose**: High-level system health monitoring

**Panels**:
- Total services count
- Services up/down status
- Request rate (RPS)
- Error rate
- P95 latency
- Active alerts
- Request rate by service (timeseries)
- Error rate by service (timeseries)
- P95 latency by service (timeseries)
- Request distribution (pie chart)
- Service health status table
- CPU usage by service
- Memory usage by service
- Active alerts list

**Key Metrics**:
- `up{job=~"wxwidgets-services|polyorb-services"}`
- `http_requests_total`
- `http_request_duration_seconds_bucket`
- `container_cpu_usage_seconds_total`
- `container_memory_working_set_bytes`

**Recommended Refresh**: 30 seconds

---

### 2. wxWidgets Services Dashboard (✅ Complete)

**File**: `02-wxwidgets-dashboard.json`

**Purpose**: Detailed monitoring for C++ microservices

**Variables**:
- `$service`: Filter by service name
- Multi-select enabled

**Panels**:
- wxWidgets services up
- Total request rate
- Error rate
- P95 latency
- Active widget instances
- Request rate by service
- Latency percentiles (P50, P95, P99)
- Widget operations (create/update/delete)
- Memory usage
- CPU usage
- Event loop processing time
- Service details table
- Recent error logs (from Loki)

**Key Metrics**:
- `wxwidgets_active_widgets`
- `wxwidgets_widget_operations_total`
- `wxwidgets_event_loop_duration_seconds_bucket`
- Standard HTTP metrics

**Recommended Refresh**: 30 seconds

---

### 3. PolyORB Services Dashboard (📝 TODO)

**File**: `03-polyorb-dashboard.json`

**Purpose**: Detailed monitoring for Ada microservices

**Planned Panels**:
- PolyORB services up
- Request rate
- ORB operation latency
- CORBA request handling
- Memory deallocation tracking (Phase 1 validation)
- Ada runtime metrics
- ORB connection pool status
- Recent error logs

**Key Metrics** (to be implemented):
- `polyorb_orb_requests_total`
- `polyorb_connection_pool_size`
- `polyorb_memory_deallocations_total` (Phase 1)
- `polyorb_servant_lifetime_seconds`

---

### 4. Infrastructure Dashboard (📝 TODO)

**File**: `04-infrastructure-dashboard.json`

**Purpose**: Kubernetes cluster and infrastructure monitoring

**Planned Panels**:
- Node status
- Pod count by namespace
- CPU/Memory usage by node
- Disk usage
- Network I/O
- PVC usage
- Container restart rate
- Cluster events

---

### 5. APM Dashboard (📝 TODO)

**File**: `05-apm-dashboard.json`

**Purpose**: Application Performance Monitoring with distributed tracing

**Planned Panels**:
- Trace volume
- Trace duration distribution
- Service dependency graph
- Top slowest operations
- Error traces
- Trace sampling rate
- Integration with Jaeger

---

### 6. Business Metrics Dashboard (📝 TODO)

**File**: `06-business-metrics-dashboard.json`

**Purpose**: Business KPIs and application-specific metrics

**Planned Panels**:
- Widget creation rate
- Active user sessions
- Widget types distribution
- Operation success rate
- Business transactions per minute
- Revenue-impacting errors

---

### 7. SLO Dashboard (✅ Complete)

**File**: `07-slo-dashboard.json`

**Purpose**: Track Service Level Objectives and compliance

**Variables**:
- `$service`: Filter by service
- `$slo_window`: Time window (1h, 6h, 24h, 7d, 30d)

**Panels**:
- Availability SLO (target: 99.9%)
- Latency SLO P95 (target: < 500ms)
- Error rate SLO (target: < 1%)
- SLO compliance score
- Availability trend
- P95 latency trend
- Error budget remaining (monthly)
- SLO compliance by service (table)
- SLO violations timeline
- Downtime this month
- Allowed downtime
- SLO violations count
- Next SLO review date

**SLO Targets**:
- **Availability**: 99.9% (43.8 min downtime/month)
- **Latency**: P95 < 500ms
- **Error Rate**: < 1%

**Recommended Refresh**: 1 minute

---

### 8. Alerts Dashboard (📝 TODO)

**File**: `08-alerts-dashboard.json`

**Purpose**: Alert management and history

**Planned Panels**:
- Active alerts (by severity)
- Alert history timeline
- MTTR (Mean Time To Resolve)
- Alert frequency by service
- Top alerting services
- Silenced alerts

---

### 9. Database Dashboard (📝 TODO)

**File**: `09-database-dashboard.json`

**Purpose**: PostgreSQL monitoring

**Planned Panels**:
- Connection count
- Query rate
- Slow queries (> 1s)
- Transaction rate
- Lock waits
- Cache hit ratio
- Replication lag
- Database size

---

### 10. Redis Dashboard (📝 TODO)

**File**: `10-redis-dashboard.json`

**Purpose**: Redis cache monitoring

**Planned Panels**:
- Connected clients
- Hit/miss ratio
- Memory usage
- Eviction rate
- Command rate
- Keyspace operations
- Replication status

---

### 11. Security Dashboard (📝 TODO)

**File**: `11-security-dashboard.json`

**Purpose**: Security monitoring and audit logs

**Planned Panels**:
- Authentication failures
- Authorization errors
- Suspicious activity
- Security service requests
- Memory zeroization compliance (Phase 1)
- Audit log volume

---

### 12. Cost Dashboard (📝 TODO)

**File**: `12-cost-dashboard.json`

**Purpose**: Resource usage and cost tracking

**Planned Panels**:
- CPU cost by service
- Memory cost by service
- Storage cost
- Network egress cost
- Cost trend over time
- Top 10 most expensive services

---

## Dashboard Variables

### Common Variables

Most dashboards support these template variables:

```yaml
$service:
  Type: Query
  Source: label_values(up{job=~"wxwidgets-services|polyorb-services"}, service)
  Multi-select: Yes
  Include All: Yes

$namespace:
  Type: Query
  Source: label_values(kube_pod_info, namespace)
  Multi-select: Yes
  Include All: Yes

$time_range:
  Type: Custom
  Values: [5m, 15m, 1h, 6h, 24h, 7d, 30d]
  Default: 1h
```

---

## Dashboard Best Practices

### Layout

- **Top Row**: Key metrics (stats)
- **Middle Rows**: Timeseries charts
- **Bottom Rows**: Tables, logs, details

### Color Schemes

**Thresholds**:
- **Green**: Normal operation
- **Yellow**: Warning (approaching threshold)
- **Red**: Critical (exceeding threshold)

**Standard Thresholds**:
- Availability: < 99.5% (red), 99.5-99.9% (yellow), > 99.9% (green)
- Latency: < 500ms (green), 500-1000ms (yellow), > 1000ms (red)
- Error Rate: < 1% (green), 1-5% (yellow), > 5% (red)
- CPU: < 70% (green), 70-90% (yellow), > 90% (red)
- Memory: < 80% (green), 80-95% (yellow), > 95% (red)

### Annotations

All dashboards should include:
- **Deployments**: Vertical lines for releases
- **Alerts**: Highlight firing alerts
- **Incidents**: Mark incident timelines

---

## Customization

### Adding Custom Panels

1. Edit dashboard in Grafana UI
2. Export JSON: **Dashboard Settings → JSON Model**
3. Save to this directory
4. Update this README

### Modifying Queries

All PromQL queries can be modified in:
- Grafana UI: **Panel → Edit → Query**
- JSON: Edit `targets[].expr` fields

### Adding New Data Sources

Configure in `../helm-values/prometheus-values.yaml`:

```yaml
grafana:
  datasources:
    datasources.yaml:
      apiVersion: 1
      datasources:
        - name: CustomDataSource
          type: postgres
          url: postgresql://...
```

---

## Troubleshooting

### Dashboard Not Loading

```bash
# Check Grafana logs
kubectl logs -n observability deployment/prometheus-grafana

# Verify ConfigMap
kubectl get configmap grafana-dashboards -n observability -o yaml

# Restart Grafana
kubectl rollout restart deployment/prometheus-grafana -n observability
```

### Queries Timing Out

- Reduce time range
- Add more specific label filters
- Increase query timeout in Grafana settings

### Missing Data

```bash
# Verify Prometheus is scraping
kubectl port-forward -n observability svc/prometheus-prometheus 9090:9090
# Open: http://localhost:9090/targets

# Check metric existence
# Go to Prometheus UI → Graph
# Query: {__name__=~"http_.*"}
```

### Panel Shows "No Data"

1. Check data source connection
2. Verify metric name exists in Prometheus
3. Check time range
4. Verify label filters match actual labels

---

## Performance Optimization

### Query Optimization

**Bad**:
```promql
sum(rate(http_requests_total[5m]))
```

**Good** (with recording rule):
```promql
sum(job:http_requests:rate5m)
```

### Recording Rules

Define in `../alerting-rules/recording-rules.yaml`:

```yaml
groups:
  - name: http_recording_rules
    interval: 30s
    rules:
      - record: job:http_requests:rate5m
        expr: sum(rate(http_requests_total[5m])) by (job)
```

---

## Next Steps

1. ✅ Complete remaining 9 dashboards
2. Create recording rules for expensive queries
3. Set up dashboard provisioning in Helm values
4. Create dashboard folders in Grafana
5. Set up dashboard permissions
6. Create dashboard snapshots for documentation

---

## References

- [Grafana Dashboard Best Practices](https://grafana.com/docs/grafana/latest/dashboards/build-dashboards/best-practices/)
- [PromQL Cheat Sheet](https://promlabs.com/promql-cheat-sheet/)
- [Grafana Provisioning](https://grafana.com/docs/grafana/latest/administration/provisioning/)
- [Dashboard JSON Model](https://grafana.com/docs/grafana/latest/dashboards/build-dashboards/view-dashboard-json-model/)

---

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
