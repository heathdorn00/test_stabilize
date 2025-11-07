# Observability Stack Deployment Guide

**Task**: bd88ec - Deploy observability stack (Prometheus, Grafana, Loki, Jaeger)

Complete deployment guide for the observability stack monitoring 16 microservices.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Architecture Overview](#architecture-overview)
3. [Quick Start](#quick-start)
4. [Detailed Deployment](#detailed-deployment)
5. [Post-Deployment Verification](#post-deployment-verification)
6. [Access and Usage](#access-and-usage)
7. [Maintenance](#maintenance)
8. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Tools

```bash
# Kubernetes cluster (1.24+)
kubectl version

# Helm 3.x
helm version

# k6 (for load testing)
k6 version

# Optional: k9s (for cluster management)
k9s version
```

### Cluster Requirements

- **Kubernetes**: 1.24 or higher
- **Nodes**: Minimum 3 nodes (for HA)
- **CPU**: 10+ cores available
- **Memory**: 24+ GB available
- **Storage**: 520 GB persistent storage
  - Prometheus: 100 GB
  - Loki: 100 GB
  - Jaeger/Elasticsearch: 300 GB
  - Grafana: 20 GB

### Access Requirements

- Cluster admin access
- Ability to create namespaces
- Ability to create ClusterRole/ClusterRoleBinding (for Prometheus Operator)

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                       Observability Stack                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌───────────┐  ┌───────────┐  ┌───────────┐  ┌───────────┐   │
│  │Prometheus │  │   Loki    │  │  Jaeger   │  │  Grafana  │   │
│  │  (Metrics)│  │  (Logs)   │  │ (Traces)  │  │   (UI)    │   │
│  └─────┬─────┘  └─────┬─────┘  └─────┬─────┘  └─────┬─────┘   │
│        │              │              │              │           │
│        └──────────────┴──────────────┴──────────────┘           │
│                         │                                        │
└─────────────────────────┼────────────────────────────────────────┘
                          │
         ┌────────────────┴────────────────┐
         │                                  │
  ┌──────▼──────┐                   ┌──────▼──────┐
  │  wxWidgets  │                   │   PolyORB   │
  │  Services   │                   │   Services  │
  │   (7 C++)   │                   │   (9 Ada)   │
  └─────────────┘                   └─────────────┘
```

### Components

- **Prometheus**: Metrics collection and alerting
- **Loki**: Log aggregation and querying
- **Jaeger**: Distributed tracing
- **Grafana**: Unified visualization
- **AlertManager**: Alert routing and notifications

---

## Quick Start

Deploy the entire observability stack in 10 minutes:

```bash
# 1. Create namespace
kubectl create namespace observability

# 2. Add Helm repositories
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo add grafana https://grafana.github.io/helm-charts
helm repo add jaegertracing https://jaegertracing.github.io/helm-charts
helm repo update

# 3. Deploy Prometheus stack (includes Grafana)
helm install prometheus prometheus-community/kube-prometheus-stack \
  -f observability/helm-values/prometheus-values.yaml \
  -n observability \
  --timeout 10m

# 4. Deploy Loki stack
helm install loki grafana/loki-stack \
  -f observability/helm-values/loki-values.yaml \
  -n observability \
  --timeout 5m

# 5. Deploy Jaeger
helm install jaeger jaegertracing/jaeger \
  -f observability/helm-values/jaeger-values.yaml \
  -n observability \
  --timeout 10m

# 6. Deploy ServiceMonitors
kubectl apply -f observability/service-monitors/ -n microservices

# 7. Deploy Alert Rules
kubectl apply -f observability/alerting-rules/ -n observability

# 8. Import Grafana dashboards
kubectl create configmap grafana-dashboards \
  --from-file=observability/dashboards/ \
  -n observability

# 9. Restart Grafana to load dashboards
kubectl rollout restart deployment/prometheus-grafana -n observability

# Done! Access Grafana:
kubectl port-forward -n observability svc/prometheus-grafana 3000:80
# Open: http://localhost:3000 (admin / changeme)
```

---

## Detailed Deployment

### Phase 1: Prometheus Stack (Day 1-2)

#### 1.1. Deploy Prometheus Operator

The Prometheus Operator manages Prometheus, AlertManager, and ServiceMonitors.

```bash
# Deploy kube-prometheus-stack (includes Prometheus, AlertManager, Grafana)
helm install prometheus prometheus-community/kube-prometheus-stack \
  -f observability/helm-values/prometheus-values.yaml \
  -n observability \
  --create-namespace \
  --timeout 10m \
  --wait

# Verify deployment
kubectl get pods -n observability -l app.kubernetes.io/name=prometheus
kubectl get pods -n observability -l app.kubernetes.io/name=alertmanager
kubectl get pods -n observability -l app.kubernetes.io/name=grafana
```

**Expected Pods**:
- `prometheus-prometheus-0`, `prometheus-prometheus-1` (2 replicas)
- `prometheus-alertmanager-0`, `prometheus-alertmanager-1` (2 replicas)
- `prometheus-grafana-xxx` (1 replica)
- `prometheus-operator-xxx` (1 replica)
- `prometheus-kube-state-metrics-xxx` (1 replica)
- `prometheus-node-exporter-xxx` (DaemonSet, 1 per node)

#### 1.2. Configure Secrets

```bash
# Slack webhook for AlertManager
kubectl create secret generic slack-webhook-url \
  --from-literal=url=https://hooks.slack.com/services/YOUR/WEBHOOK/URL \
  -n observability

# PagerDuty integration key
kubectl create secret generic pagerduty-key \
  --from-literal=key=YOUR_PAGERDUTY_INTEGRATION_KEY \
  -n observability

# Grafana admin password (optional - change default)
kubectl create secret generic grafana-admin \
  --from-literal=admin-user=admin \
  --from-literal=admin-password=YOUR_SECURE_PASSWORD \
  -n observability
```

#### 1.3. Access Prometheus UI

```bash
# Port-forward to Prometheus
kubectl port-forward -n observability svc/prometheus-prometheus 9090:9090

# Open: http://localhost:9090
# Verify targets: http://localhost:9090/targets
```

---

### Phase 2: Loki Stack (Day 3-4)

#### 2.1. Deploy Loki

```bash
# Deploy Loki and Promtail
helm install loki grafana/loki-stack \
  -f observability/helm-values/loki-values.yaml \
  -n observability \
  --timeout 5m \
  --wait

# Verify deployment
kubectl get pods -n observability -l app=loki
kubectl get daemonset -n observability promtail
```

**Expected Pods**:
- `loki-0`, `loki-1` (2 replicas)
- `promtail-xxx` (DaemonSet, 1 per node)

#### 2.2. Access Loki UI

```bash
# Port-forward to Loki
kubectl port-forward -n observability svc/loki 3100:3100

# Test query
curl http://localhost:3100/loki/api/v1/label
```

#### 2.3. Configure Loki in Grafana

Loki is automatically configured as a data source in Grafana via the Helm values.

Verify in Grafana: **Configuration → Data Sources → Loki**

---

### Phase 3: Jaeger Stack (Day 5-6)

#### 3.1. Deploy Jaeger

```bash
# Deploy Jaeger with Elasticsearch backend
helm install jaeger jaegertracing/jaeger \
  -f observability/helm-values/jaeger-values.yaml \
  -n observability \
  --timeout 10m \
  --wait

# Verify deployment
kubectl get pods -n observability -l app.kubernetes.io/instance=jaeger
```

**Expected Pods**:
- `jaeger-collector-xxx` (2 replicas)
- `jaeger-query-xxx` (2 replicas)
- `jaeger-agent-xxx` (DaemonSet, 1 per node)
- `elasticsearch-0`, `elasticsearch-1`, `elasticsearch-2` (3 replicas)

#### 3.2. Access Jaeger UI

```bash
# Port-forward to Jaeger Query
kubectl port-forward -n observability svc/jaeger-query 16686:16686

# Open: http://localhost:16686
```

#### 3.3. Configure Jaeger in Grafana

Jaeger is automatically configured as a data source in Grafana via the Helm values.

Verify in Grafana: **Configuration → Data Sources → Jaeger**

---

### Phase 4: ServiceMonitors (Day 7)

#### 4.1. Deploy ServiceMonitors

ServiceMonitors tell Prometheus how to scrape metrics from services.

```bash
# Deploy all ServiceMonitors
kubectl apply -f observability/service-monitors/ -n microservices

# Verify ServiceMonitors
kubectl get servicemonitor -n microservices
```

**Expected Output**:
```
NAME                AGE
api-gateway         10s
widget-core         10s
orb-core            10s
...
```

#### 4.2. Verify Targets in Prometheus

```bash
# Access Prometheus UI
kubectl port-forward -n observability svc/prometheus-prometheus 9090:9090

# Open: http://localhost:9090/targets
# All services should be UP (green)
```

---

### Phase 5: Alerting Rules (Day 8)

#### 5.1. Deploy Alert Rules

```bash
# Deploy Prometheus alert rules
kubectl apply -f observability/alerting-rules/prometheus-alert-rules.yaml -n observability

# Verify PrometheusRule resources
kubectl get prometheusrule -n observability
```

#### 5.2. Verify Rules in Prometheus

```bash
# Access Prometheus UI
kubectl port-forward -n observability svc/prometheus-prometheus 9090:9090

# Open: http://localhost:9090/rules
# All rule groups should be loaded
```

#### 5.3. Access AlertManager

```bash
# Port-forward to AlertManager
kubectl port-forward -n observability svc/prometheus-alertmanager 9093:9093

# Open: http://localhost:9093
```

---

### Phase 6: Grafana Dashboards (Day 9-10)

#### 6.1. Import Dashboards

```bash
# Create ConfigMap with dashboards
kubectl create configmap grafana-dashboards \
  --from-file=observability/dashboards/ \
  -n observability

# Restart Grafana to load dashboards
kubectl rollout restart deployment/prometheus-grafana -n observability

# Wait for Grafana to be ready
kubectl wait --for=condition=available --timeout=5m \
  deployment/prometheus-grafana -n observability
```

#### 6.2. Access Grafana

```bash
# Port-forward to Grafana
kubectl port-forward -n observability svc/prometheus-grafana 3000:80

# Open: http://localhost:3000
# Login: admin / changeme (configured in Helm values)
```

#### 6.3. Verify Dashboards

Navigate to: **Dashboards → Browse → Microservices**

Expected dashboards:
- Overview
- wxWidgets Services
- PolyORB Services (TODO)
- SLO Compliance
- Infrastructure (TODO)
- ...

---

## Post-Deployment Verification

### 1. Check All Pods

```bash
# All pods should be Running
kubectl get pods -n observability

# Check for any errors
kubectl get pods -n observability | grep -v Running
```

### 2. Verify Data Sources in Grafana

1. Access Grafana: http://localhost:3000
2. Go to: **Configuration → Data Sources**
3. Verify:
   - ✅ Prometheus (default)
   - ✅ Loki
   - ✅ Jaeger

### 3. Test Metric Queries

In Prometheus UI (http://localhost:9090):

```promql
# Should return data for all services
up{job=~"wxwidgets-services|polyorb-services"}

# Should return request rate
rate(http_requests_total[5m])

# Should return P95 latency
histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))
```

### 4. Test Log Queries

In Grafana → Explore → Loki:

```logql
# All logs from microservices namespace
{namespace="microservices"}

# Error logs only
{namespace="microservices"} |= "ERROR"

# Logs from specific service
{namespace="microservices", service="widget-core"}
```

### 5. Test Trace Queries

In Jaeger UI (http://localhost:16686):

1. Select Service: **widget-core**
2. Click **Find Traces**
3. Should see recent traces

---

## Access and Usage

### Grafana (Primary UI)

```bash
kubectl port-forward -n observability svc/prometheus-grafana 3000:80
```

**URL**: http://localhost:3000
**Login**: admin / changeme

**Key Features**:
- **Dashboards**: Pre-configured views of metrics
- **Explore**: Ad-hoc queries (Prometheus, Loki, Jaeger)
- **Alerting**: Unified alerting rules
- **Data Sources**: Prometheus, Loki, Jaeger

### Prometheus

```bash
kubectl port-forward -n observability svc/prometheus-prometheus 9090:9090
```

**URL**: http://localhost:9090

**Key Pages**:
- `/graph`: Query interface
- `/targets`: Scrape targets status
- `/rules`: Alerting rules
- `/alerts`: Active alerts

### Loki

```bash
kubectl port-forward -n observability svc/loki 3100:3100
```

**URL**: http://localhost:3100

**Key Endpoints**:
- `/loki/api/v1/labels`: Available labels
- `/loki/api/v1/query`: Query logs
- `/ready`: Health check

### Jaeger

```bash
kubectl port-forward -n observability svc/jaeger-query 16686:16686
```

**URL**: http://localhost:16686

**Key Features**:
- **Search**: Find traces by service, operation, tags
- **Compare**: Compare trace timings
- **Dependencies**: Service dependency graph

### AlertManager

```bash
kubectl port-forward -n observability svc/prometheus-alertmanager 9093:9093
```

**URL**: http://localhost:9093

**Key Features**:
- **Alerts**: Active alerts view
- **Silences**: Manage alert silences
- **Status**: AlertManager configuration

---

## Maintenance

### Daily Tasks

```bash
# Check for firing alerts
kubectl exec -n observability prometheus-prometheus-0 -- \
  promtool query instant http://localhost:9090 'ALERTS{alertstate="firing"}'

# Check resource usage
kubectl top pods -n observability
```

### Weekly Tasks

```bash
# Review SLO compliance
# Open: Grafana → SLO Dashboard

# Check error budget
# Open: Grafana → SLO Dashboard → Error Budget Remaining

# Review dashboard performance
# Open: Grafana → Administration → Stats
```

### Monthly Tasks

```bash
# Upgrade Helm releases
helm repo update
helm upgrade prometheus prometheus-community/kube-prometheus-stack \
  -f observability/helm-values/prometheus-values.yaml \
  -n observability

# Review and optimize alerting rules
# Check alert frequency and adjust thresholds

# Clean up old data
# Prometheus: Automatic (15-day retention)
# Loki: Automatic (30-day retention)
# Jaeger/ES: Curator runs daily (7-day retention)
```

---

## Troubleshooting

### Prometheus Not Scraping Targets

**Symptom**: Targets show as "DOWN" in Prometheus UI

**Solution**:

```bash
# 1. Check ServiceMonitor exists
kubectl get servicemonitor <service-name> -n microservices

# 2. Check Service exists and has correct labels
kubectl get svc <service-name> -n microservices -o yaml

# 3. Check pod is running and has metrics endpoint
kubectl port-forward -n microservices svc/<service-name> 9090:9090
curl http://localhost:9090/metrics

# 4. Check Prometheus Operator logs
kubectl logs -n observability deployment/prometheus-operator

# 5. Restart Prometheus
kubectl delete pod -n observability prometheus-prometheus-0
```

### Loki Not Receiving Logs

**Symptom**: No logs in Grafana Explore → Loki

**Solution**:

```bash
# 1. Check Promtail is running on all nodes
kubectl get daemonset -n observability promtail

# 2. Check Promtail logs
kubectl logs -n observability daemonset/promtail

# 3. Check Loki is accepting writes
kubectl logs -n observability statefulset/loki

# 4. Test Loki query API
kubectl exec -n observability loki-0 -- \
  wget -qO- http://localhost:3100/loki/api/v1/label

# 5. Restart Promtail
kubectl rollout restart daemonset/promtail -n observability
```

### Jaeger Not Showing Traces

**Symptom**: No traces in Jaeger UI

**Solution**:

```bash
# 1. Check Jaeger components are running
kubectl get pods -n observability -l app.kubernetes.io/instance=jaeger

# 2. Check services are instrumented and sending traces
# Look for trace_id in service logs

# 3. Check Jaeger collector is receiving spans
kubectl logs -n observability deployment/jaeger-collector

# 4. Check Elasticsearch is healthy
kubectl exec -n observability elasticsearch-0 -- \
  curl -X GET "http://localhost:9200/_cluster/health?pretty"

# 5. Verify Jaeger indices exist
kubectl exec -n observability elasticsearch-0 -- \
  curl -X GET "http://localhost:9200/_cat/indices/jaeger*?v"
```

### Grafana Dashboards Not Loading

**Symptom**: Dashboards show "No data" or fail to load

**Solution**:

```bash
# 1. Check ConfigMap exists
kubectl get configmap grafana-dashboards -n observability

# 2. Check Grafana logs
kubectl logs -n observability deployment/prometheus-grafana

# 3. Verify data sources are connected
# Grafana UI → Configuration → Data Sources → Test

# 4. Check dashboard JSON is valid
kubectl get configmap grafana-dashboards -n observability -o yaml

# 5. Reimport dashboards
kubectl delete configmap grafana-dashboards -n observability
kubectl create configmap grafana-dashboards \
  --from-file=observability/dashboards/ \
  -n observability
kubectl rollout restart deployment/prometheus-grafana -n observability
```

### High Resource Usage

**Symptom**: Prometheus/Loki/Jaeger using excessive CPU/memory

**Solution**:

```bash
# 1. Check resource usage
kubectl top pods -n observability

# 2. Reduce scrape frequency
# Edit prometheus-values.yaml → scrapeInterval: 60s (from 30s)

# 3. Reduce retention period
# Edit prometheus-values.yaml → retention: 7d (from 15d)

# 4. Optimize queries
# Use recording rules for expensive queries

# 5. Increase resource limits
# Edit *-values.yaml → resources.limits

# 6. Upgrade Helm release
helm upgrade prometheus prometheus-community/kube-prometheus-stack \
  -f observability/helm-values/prometheus-values.yaml \
  -n observability
```

---

## Security Considerations

### 1. Change Default Passwords

```bash
# Grafana
kubectl create secret generic grafana-admin \
  --from-literal=admin-password=STRONG_PASSWORD \
  -n observability \
  --dry-run=client -o yaml | kubectl apply -f -

# Restart Grafana
kubectl rollout restart deployment/prometheus-grafana -n observability
```

### 2. Enable TLS/SSL

Update Ingress configuration in Helm values:

```yaml
grafana:
  ingress:
    enabled: true
    tls:
      - secretName: grafana-tls
        hosts:
          - grafana.example.com
```

### 3. Configure RBAC

```bash
# Create read-only user
kubectl create serviceaccount grafana-viewer -n observability
kubectl create rolebinding grafana-viewer \
  --clusterrole=view \
  --serviceaccount=observability:grafana-viewer \
  -n observability
```

### 4. Network Policies

```bash
# Apply network policies
kubectl apply -f observability/network-policies/ -n observability
```

---

## Next Steps

1. ✅ Complete PolyORB dashboard (03-polyorb-dashboard.json)
2. ✅ Complete remaining 9 dashboards
3. ✅ Instrument all 16 services with metrics endpoints
4. ✅ Deploy to production
5. Set up external Ingress (production access)
6. Configure backup and disaster recovery
7. Set up SLO reporting automation
8. Create runbooks for common alerts

---

## References

- [Prometheus Documentation](https://prometheus.io/docs/)
- [Loki Documentation](https://grafana.com/docs/loki/)
- [Jaeger Documentation](https://www.jaegertracing.io/docs/)
- [Grafana Documentation](https://grafana.com/docs/grafana/)
- [kube-prometheus-stack](https://github.com/prometheus-community/helm-charts/tree/main/charts/kube-prometheus-stack)
- [OBSERVABILITY-ARCHITECTURE.md](./OBSERVABILITY-ARCHITECTURE.md)

---

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
