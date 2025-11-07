# Observability Stack Architecture

**Task**: bd88ec - Deploy observability stack
**Owner**: @test_stabilize
**Date**: 2025-11-05
**Status**: In Progress

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture Diagram](#architecture-diagram)
3. [Components](#components)
4. [Data Flow](#data-flow)
5. [Dashboard Strategy](#dashboard-strategy)
6. [Alerting Strategy](#alerting-strategy)
7. [Deployment Plan](#deployment-plan)

---

## Overview

Comprehensive observability stack for monitoring, logging, and tracing **16 microservices** (7 wxWidgets + 9 PolyORB) in Kubernetes.

### The Three Pillars

```
┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│   METRICS   │  │    LOGS     │  │   TRACES    │
│ (Prometheus)│  │   (Loki)    │  │  (Jaeger)   │
└──────┬──────┘  └──────┬──────┘  └──────┬──────┘
       │                │                │
       └────────────────┴────────────────┘
                        │
                   ┌────▼─────┐
                   │ Grafana  │
                   │Dashboards│
                   └──────────┘
```

### Goals

✅ **Real-time visibility** into all 16 services
✅ **Proactive alerting** before user impact
✅ **Root cause analysis** with distributed tracing
✅ **SLO tracking** (99.9% availability, P95 < 500ms)
✅ **Capacity planning** with historical metrics

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    Kubernetes Cluster                            │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                 Application Pods (16 services)           │   │
│  │  ┌────────┐  ┌────────┐  ┌────────┐  ┌────────┐        │   │
│  │  │Widget  │  │Render  │  │Event   │  │ORB Core│  ...   │   │
│  │  │Core    │  │Manager │  │Manager │  │        │        │   │
│  │  └───┬────┘  └───┬────┘  └───┬────┘  └───┬────┘        │   │
│  │      │ metrics   │ metrics   │ metrics   │ metrics      │   │
│  │      │ logs      │ logs      │ logs      │ logs         │   │
│  │      │ traces    │ traces    │ traces    │ traces       │   │
│  └──────┼───────────┼───────────┼───────────┼──────────────┘   │
│         │           │           │           │                   │
│         ▼           ▼           ▼           ▼                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │              Observability Stack                         │   │
│  │  ┌─────────────────────────────────────────────────┐    │   │
│  │  │          Prometheus (Metrics)                   │    │   │
│  │  │  ┌──────────────┐  ┌──────────────┐            │    │   │
│  │  │  │ Prometheus   │  │AlertManager  │            │    │   │
│  │  │  │ Server       │  │              │            │    │   │
│  │  │  └──────────────┘  └──────────────┘            │    │   │
│  │  └─────────────────────────────────────────────────┘    │   │
│  │                                                          │   │
│  │  ┌─────────────────────────────────────────────────┐    │   │
│  │  │          Loki (Logs)                            │    │   │
│  │  │  ┌──────────────┐  ┌──────────────┐            │    │   │
│  │  │  │ Loki         │  │ Promtail     │            │    │   │
│  │  │  │ Aggregator   │  │ (DaemonSet)  │            │    │   │
│  │  │  └──────────────┘  └──────────────┘            │    │   │
│  │  └─────────────────────────────────────────────────┘    │   │
│  │                                                          │   │
│  │  ┌─────────────────────────────────────────────────┐    │   │
│  │  │          Jaeger (Traces)                        │    │   │
│  │  │  ┌──────────────┐  ┌──────────────┐            │    │   │
│  │  │  │ Jaeger       │  │OpenTelemetry │            │    │   │
│  │  │  │ Collector    │  │Collector     │            │    │   │
│  │  │  └──────────────┘  └──────────────┘            │    │   │
│  │  └─────────────────────────────────────────────────┘    │   │
│  │                                                          │   │
│  │  ┌─────────────────────────────────────────────────┐    │   │
│  │  │          Grafana (Visualization)                │    │   │
│  │  │  ┌──────────────────────────────────────────┐  │    │   │
│  │  │  │  12 Dashboards                           │  │    │   │
│  │  │  │  - Overview, APM, Infrastructure, etc.  │  │    │   │
│  │  │  └──────────────────────────────────────────┘  │    │   │
│  │  └─────────────────────────────────────────────────┘    │   │
│  └──────────────────────────────────────────────────────────┘   │
└───────────────────────────────────────────────────────────────┘
                            │
                            ▼
                   ┌────────────────┐
                   │  Users/Ops     │
                   │  - Grafana UI  │
                   │  - Alerts      │
                   └────────────────┘
```

---

## Components

### 1. Metrics - Prometheus Stack

**Components**:
- **Prometheus Server** (2 replicas) - Metrics scraping and storage
- **AlertManager** (2 replicas) - Alert routing and deduplication
- **Prometheus Operator** - Kubernetes-native deployment
- **ServiceMonitors** (16) - One per microservice
- **Node Exporter** (DaemonSet) - Host metrics
- **kube-state-metrics** - K8s cluster metrics

**Storage**: 50GB PVC per replica, 15-day retention

**Metrics Collected**:
```yaml
Service Metrics:
  - request_rate (RPS)
  - request_duration_seconds (latency)
  - request_errors_total (error count)
  - active_connections
  - queue_depth

Resource Metrics:
  - cpu_usage_seconds
  - memory_usage_bytes
  - disk_io_operations
  - network_bytes_total

Business Metrics:
  - widgets_created_total
  - orb_invocations_total
  - api_calls_by_client
```

**Scrape Interval**: 15 seconds (configurable per service)

---

### 2. Logging - Loki Stack

**Components**:
- **Loki** (3 replicas) - Log aggregation and querying
- **Promtail** (DaemonSet) - Log shipping from nodes
- **Fluent Bit** (optional) - Log parsing and enrichment

**Storage**: 100GB PVC, 30-day retention

**Log Sources**:
```yaml
Application Logs:
  - stdout/stderr from pods
  - Structured JSON logs
  - Log levels: DEBUG, INFO, WARN, ERROR, FATAL

Kubernetes Events:
  - Pod lifecycle events
  - Deployment rollouts
  - ConfigMap/Secret changes

Audit Logs:
  - API server audit
  - Security events
  - Authentication failures

Access Logs:
  - API Gateway access logs
  - Service-to-service calls
  - External API calls
```

**Labels** (for filtering):
- `namespace`
- `pod`
- `container`
- `service`
- `level` (log level)

---

### 3. Tracing - Jaeger

**Components**:
- **Jaeger Collector** (2 replicas) - Trace ingestion
- **Jaeger Query** (2 replicas) - Trace querying
- **OpenTelemetry Collector** (optional) - Vendor-neutral collection
- **Jaeger UI** - Web interface for trace visualization

**Storage**: Elasticsearch 100GB (or in-memory for dev)

**Trace Instrumentation**:
```
Request Flow:
API Gateway → Widget Core → PostgreSQL
     │
     ├─> Render Manager → Redis
     │
     └─> ORB Core → CORBA Service

Each hop generates a span with:
- Service name
- Operation name
- Duration
- Tags (status, error, method)
- Logs (events within span)
```

**Sampling Strategy**:
- **Production**: 1% random sampling (configurable)
- **Errors**: 100% sampling (always trace errors)
- **Slow requests**: 100% sampling (P99+ latency)

---

### 4. Visualization - Grafana

**Components**:
- **Grafana Server** (2 replicas) - Dashboard UI
- **Provisioned Dashboards** (12) - Pre-configured dashboards
- **Data Sources**: Prometheus, Loki, Jaeger

**Dashboards** (see [Dashboard Strategy](#dashboard-strategy) below)

**Access Control**:
- **Admin**: Full access (operators)
- **Editor**: Dashboard editing (developers)
- **Viewer**: Read-only (stakeholders)

---

## Data Flow

### Metrics Flow

```
Service Pods
  ↓ (expose /metrics endpoint)
ServiceMonitor (CRD)
  ↓ (defines scrape config)
Prometheus Server
  ↓ (scrapes every 15s)
TSDB Storage (15-day retention)
  ↓ (queries)
Grafana Dashboards
  ↓ (visualizes)
Users/Ops
```

### Logs Flow

```
Service Pods (stdout/stderr)
  ↓
Promtail (DaemonSet on each node)
  ↓ (tails log files, adds labels)
Loki Aggregator
  ↓ (indexes labels, stores logs)
Loki Storage (30-day retention)
  ↓ (LogQL queries)
Grafana Explore/Dashboards
  ↓
Users/Ops
```

### Traces Flow

```
Service Code (instrumented with OpenTelemetry SDK)
  ↓ (exports spans via gRPC/HTTP)
OpenTelemetry Collector (optional)
  ↓ (processes, samples, exports)
Jaeger Collector
  ↓ (validates, batches)
Elasticsearch Storage
  ↓ (queries)
Jaeger UI / Grafana
  ↓
Users/Ops
```

---

## Dashboard Strategy

### 12 Grafana Dashboards

#### 1. **Overview Dashboard** (Home)
**Purpose**: High-level cluster health
**Panels**:
- Service availability grid (16 services, green/red)
- Overall request rate (RPS across all services)
- P50/P95/P99 latency (all services combined)
- Error rate percentage
- Top 5 slowest endpoints
- Top 5 highest error rates

**Audience**: Everyone (default dashboard)

---

#### 2. **wxWidgets Services Dashboard**
**Purpose**: Monitor C++ services
**Panels**:
- Widget Core: RPS, latency, errors
- Render Manager: Frame rate, render time, GPU usage
- Event Manager: Event throughput, queue depth
- Platform Adapters: Platform distribution (Win/Mac/Linux)
- Resource usage per service

**Audience**: wxWidgets team

---

#### 3. **PolyORB Services Dashboard**
**Purpose**: Monitor Ada/CORBA services
**Panels**:
- ORB Core: Invocations/sec, object references
- GIOP: Message throughput, marshalling time
- CORBA Services: Naming lookups, event notifications
- Security Service: Auth success rate, ACL checks
- Resource usage per service

**Audience**: PolyORB team

---

#### 4. **Infrastructure Dashboard**
**Purpose**: Kubernetes cluster health
**Panels**:
- Node CPU/memory/disk usage
- Pod count and status
- Persistent volume usage
- Network I/O
- Pod restart counts
- Image pull times

**Audience**: Platform/SRE team

---

#### 5. **Application Performance Monitoring (APM)**
**Purpose**: Service health and dependencies
**Panels**:
- Service dependency graph (visual map)
- Slowest endpoints (P99 latency)
- Error breakdown by service and status code
- Request rate by service
- Saturation metrics (CPU/memory saturation)

**Audience**: Developers, SRE

---

#### 6. **Business Metrics Dashboard**
**Purpose**: Product and business KPIs
**Panels**:
- Widgets created per minute
- ORB object references created
- API calls by client/tenant
- Platform distribution (desktop OS breakdown)
- Feature usage heatmap
- User activity timeline

**Audience**: Product managers, stakeholders

---

#### 7. **SLO Dashboard**
**Purpose**: Track SLIs/SLOs and error budget
**Panels**:
- Availability SLO (99.9% target vs actual)
- Latency SLO (P95 < 500ms target vs actual)
- Error budget remaining (43.2 min/month)
- SLO burn rate (projected)
- Historical SLO compliance

**Audience**: SRE, management

---

#### 8. **Alerts Dashboard**
**Purpose**: Current and recent alerts
**Panels**:
- Active alerts (firing now)
- Alert history (last 24h)
- Alert frequency by severity
- Mean time to resolve (MTTR)
- Top 5 noisiest alerts

**Audience**: On-call engineers

---

#### 9. **Database Dashboard**
**Purpose**: Monitor PostgreSQL performance
**Panels**:
- Connection pool usage
- Query duration (slow queries)
- Transaction rate
- Replication lag
- Disk usage and growth rate

**Audience**: Database admins, backend devs

---

#### 10. **Redis Dashboard**
**Purpose**: Cache performance
**Panels**:
- Cache hit/miss rate
- Memory usage
- Eviction rate
- Command throughput
- Keyspace distribution

**Audience**: Backend developers

---

#### 11. **Security Dashboard**
**Purpose**: Security events and anomalies
**Panels**:
- Authentication failures
- Authorization denials (ACL violations)
- TLS certificate expiration
- Security scan findings (SAST/DAST)
- Unusual traffic patterns

**Audience**: Security team

---

#### 12. **Cost Dashboard**
**Purpose**: Resource costs and optimization
**Panels**:
- CPU/memory requests vs actual usage
- Over-provisioned pods
- Storage costs
- Network egress costs
- Cost per service

**Audience**: FinOps, management

---

## Alerting Strategy

### Alert Severity Levels

| Severity | Destination | Response Time | Examples |
|----------|-------------|---------------|----------|
| **CRITICAL** | PagerDuty + Slack | Immediate | Service down, data loss |
| **HIGH** | Slack + Email | < 15 min | High error rate, P95 SLO breach |
| **MEDIUM** | Slack | < 1 hour | High CPU, approaching limits |
| **LOW** | Slack | Best effort | Certificate expiring, non-critical |

### Critical Alerts (PagerDuty)

**ServiceDown**:
```yaml
alert: ServiceDown
expr: up{job="widget-core"} == 0
for: 1m
severity: CRITICAL
message: "Widget Core service is down"
```

**HighErrorRate**:
```yaml
alert: HighErrorRate
expr: rate(http_requests_total{status=~"5.."}[5m]) / rate(http_requests_total[5m]) > 0.05
for: 5m
severity: CRITICAL
message: "Error rate > 5% for {{ $labels.service }}"
```

**LatencySLOBreach**:
```yaml
alert: LatencySLOBreach
expr: histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m])) > 0.5
for: 10m
severity: HIGH
message: "P95 latency > 500ms for {{ $labels.service }}"
```

### Warning Alerts (Slack)

**HighCPU**:
```yaml
alert: HighCPU
expr: rate(container_cpu_usage_seconds_total[5m]) > 0.8
for: 15m
severity: MEDIUM
```

**HighMemory**:
```yaml
alert: HighMemory
expr: container_memory_usage_bytes / container_spec_memory_limit_bytes > 0.8
for: 15m
severity: MEDIUM
```

**PodRestarting**:
```yaml
alert: PodRestarting
expr: rate(kube_pod_container_status_restarts_total[1h]) > 3
for: 1h
severity: MEDIUM
```

---

## Deployment Plan

### Phase 1: Infrastructure (Week 1)

**Day 1-2**: Deploy Prometheus stack
```bash
helm install kube-prometheus-stack prometheus-community/kube-prometheus-stack \
  -f helm-values/prometheus-values.yaml \
  -n observability --create-namespace
```

**Day 3-4**: Deploy Loki stack
```bash
helm install loki grafana/loki-stack \
  -f helm-values/loki-values.yaml \
  -n observability
```

**Day 5**: Deploy Jaeger
```bash
helm install jaeger jaegertracing/jaeger \
  -f helm-values/jaeger-values.yaml \
  -n observability
```

### Phase 2: Instrumentation (Week 2)

**Day 1-3**: Create ServiceMonitors for 16 services
**Day 4-5**: Configure log shipping with Promtail
**Day 6-7**: Instrument services with OpenTelemetry

### Phase 3: Dashboards & Alerts (Week 3)

**Day 1-4**: Import 12 Grafana dashboards
**Day 5-7**: Configure Prometheus alerting rules
**Day 7**: Test alert routing (Slack, PagerDuty)

### Phase 4: Testing & Documentation (Week 4)

**Day 1-2**: Load testing with observability
**Day 3-4**: Chaos testing (verify alerts fire)
**Day 5-7**: Write documentation and runbooks

---

## Storage Requirements

| Component | Storage | Retention | Replicas | Total |
|-----------|---------|-----------|----------|-------|
| Prometheus | 50GB | 15 days | 2 | 100GB |
| Loki | 100GB | 30 days | 3 | 300GB |
| Jaeger (Elasticsearch) | 100GB | 7 days | 1 | 100GB |
| Grafana | 10GB | N/A | 2 | 20GB |
| **Total** | | | | **520GB** |

**Storage Class**: SSD-backed (for performance)

---

## High Availability

**Prometheus**: 2 replicas with remote write to Thanos (optional)
**Loki**: 3 replicas (read, write, backend)
**Jaeger**: 2 collectors, 2 query nodes
**Grafana**: 2 replicas behind LoadBalancer

**Downtime Tolerance**: Any single component can fail without data loss

---

## Access & Security

**Grafana Access**:
- URL: `https://grafana.observability.local`
- Auth: OAuth2 (GitHub/Google) or Basic Auth
- RBAC: Admin/Editor/Viewer roles

**Prometheus Access**:
- Internal only (no external access)
- Grafana queries via service

**Network Policies**:
- Observability namespace isolated
- Only allow scraping from service namespaces
- No egress except to external alerting (Slack, PagerDuty)

---

## Next Steps

1. ✅ Create Helm values files
2. ✅ Design Grafana dashboards
3. ✅ Configure alerting rules
4. ✅ Write deployment documentation
5. ⏳ Deploy to cluster
6. ⏳ Validate data collection
7. ⏳ Test alerting

---

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
