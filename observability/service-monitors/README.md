# ServiceMonitors

**Task**: bd88ec - Deploy observability stack (Prometheus, Grafana, Loki, Jaeger)

ServiceMonitors are Kubernetes custom resources that tell Prometheus how to discover and scrape metrics from services.

---

## Overview

This directory contains ServiceMonitor definitions for all 16 microservices:

### wxWidgets Services (C++)

1. **API Gateway** - `api-gateway-servicemonitor.yaml`
2. **Widget Core** - `widget-core-servicemonitor.yaml`
3. **Widget Events** - `widget-events-servicemonitor.yaml`
4. **Widget Renderer** - `widget-renderer-servicemonitor.yaml`
5. **Widget Layout** - `widget-layout-servicemonitor.yaml`
6. **Security Service** - `security-service-servicemonitor.yaml`
7. **Platform Adapters** - `platform-adapters-servicemonitor.yaml`

### PolyORB Services (Ada)

8. **ORB Core** - `orb-core-servicemonitor.yaml`
9. **ORB Transport** - `orb-transport-servicemonitor.yaml`
10. **ORB Protocols** - `orb-protocols-servicemonitor.yaml`
11. **ORB Security** - `orb-security-servicemonitor.yaml`
12. **ORB Management** - `orb-management-servicemonitor.yaml`
13. **CORBA Services** - `corba-services-servicemonitor.yaml`
14. **Naming Service** - `naming-service-servicemonitor.yaml`
15. **Event Service** - `event-service-servicemonitor.yaml`
16. **Trading Service** - `trading-service-servicemonitor.yaml`

---

## Deployment

### Deploy All ServiceMonitors

```bash
# Apply all ServiceMonitors
kubectl apply -f observability/service-monitors/ -n microservices

# Verify ServiceMonitors
kubectl get servicemonitor -n microservices

# Check Prometheus targets
kubectl port-forward -n observability svc/prometheus-prometheus 9090:9090
# Open: http://localhost:9090/targets
```

### Deploy Individual ServiceMonitor

```bash
kubectl apply -f api-gateway-servicemonitor.yaml -n microservices
```

---

## ServiceMonitor Structure

All ServiceMonitors follow this structure:

```yaml
apiVersion: monitoring.coreos.com/v1
kind: ServiceMonitor
metadata:
  name: <service-name>
  namespace: microservices
  labels:
    prometheus: monitoring
    app: <service-name>
spec:
  selector:
    matchLabels:
      app: <service-name>
  endpoints:
    - port: metrics
      interval: 30s
      path: /metrics
```

---

## Metrics Endpoints

### wxWidgets Services (C++)

**Port**: 9090
**Path**: `/metrics`
**Format**: Prometheus text format

**Example**:
```bash
curl http://widget-core:9090/metrics
```

**Expected Metrics**:
- `http_requests_total{service="widget-core",method="POST",status="200"}`
- `http_request_duration_seconds_bucket{service="widget-core",le="0.5"}`
- `wxwidgets_active_widgets{service="widget-core",type="button"}`
- `wxwidgets_widget_operations_total{service="widget-core",operation="create"}`

### PolyORB Services (Ada)

**Port**: 9091
**Path**: `/metrics`
**Format**: Prometheus text format (custom exporter)

**Example**:
```bash
curl http://orb-core:9091/metrics
```

**Expected Metrics**:
- `polyorb_orb_requests_total{service="orb-core",operation="invoke"}`
- `polyorb_connection_pool_size{service="orb-core"}`
- `polyorb_servant_lifetime_seconds{service="orb-core"}`
- `polyorb_memory_deallocations_total{service="orb-core",critical="true"}`

---

## Common Labels

All metrics should include these labels:

```yaml
service: <service-name>
instance: <pod-ip>:9090
job: wxwidgets-services | polyorb-services
namespace: microservices
app_type: wxwidgets | polyorb
version: <deployment-version>
```

---

## Troubleshooting

### ServiceMonitor Not Creating Targets

```bash
# Check ServiceMonitor status
kubectl describe servicemonitor <name> -n microservices

# Check Prometheus Operator logs
kubectl logs -n observability deployment/prometheus-operator

# Verify service labels match selector
kubectl get svc <service-name> -n microservices -o yaml | grep -A5 labels
```

### Metrics Not Being Scraped

```bash
# Check if endpoint is accessible from Prometheus pod
kubectl exec -n observability prometheus-prometheus-0 -- \
  wget -qO- http://<service-name>.microservices.svc:9090/metrics

# Check Prometheus targets page
kubectl port-forward -n observability svc/prometheus-prometheus 9090:9090
# Open: http://localhost:9090/targets
# Look for "DOWN" status and error messages
```

### Missing Metrics

```bash
# Verify metrics endpoint is working
kubectl port-forward -n microservices svc/<service-name> 9090:9090
curl http://localhost:9090/metrics

# Check if metric names match PromQL queries
# Prometheus UI → Graph → Insert metric at cursor
```

---

## Metric Naming Conventions

Follow Prometheus best practices:

### Counter Metrics (always increasing)
```
<service>_<metric>_total
Examples:
- http_requests_total
- wxwidgets_widget_operations_total
- polyorb_orb_requests_total
```

### Gauge Metrics (can go up or down)
```
<service>_<metric>
Examples:
- wxwidgets_active_widgets
- polyorb_connection_pool_size
- process_resident_memory_bytes
```

### Histogram Metrics (distribution)
```
<service>_<metric>_bucket
<service>_<metric>_sum
<service>_<metric>_count
Examples:
- http_request_duration_seconds_bucket
- wxwidgets_event_loop_duration_seconds_bucket
```

### Summary Metrics (percentiles)
```
<service>_<metric>{quantile="<φ>"}
<service>_<metric>_sum
<service>_<metric>_count
Examples:
- http_request_duration_seconds{quantile="0.95"}
```

---

## Instrumentation Guide

### C++ (wxWidgets Services)

Use Prometheus C++ client library:

```cpp
#include <prometheus/counter.h>
#include <prometheus/exposer.h>
#include <prometheus/registry.h>

// Create registry
auto registry = std::make_shared<prometheus::Registry>();

// Create counter
auto& counter = prometheus::BuildCounter()
    .Name("http_requests_total")
    .Help("Total HTTP requests")
    .Labels({{"service", "widget-core"}})
    .Register(*registry);

// Increment counter
counter.Add({{"method", "GET"}, {"status", "200"}}).Increment();

// Expose metrics
prometheus::Exposer exposer{"0.0.0.0:9090"};
exposer.RegisterCollectable(registry);
```

### Ada (PolyORB Services)

Use custom metrics exporter with AWS (Ada Web Server):

```ada
with AWS.Server;
with AWS.Response;
with AWS.Status;

package body Metrics_Exporter is

   function Metrics_Handler (Request : AWS.Status.Data) return AWS.Response.Data is
      Metrics : Unbounded_String;
   begin
      -- Collect metrics
      Append(Metrics, "polyorb_orb_requests_total{service=""orb-core""} ");
      Append(Metrics, Integer'Image(Get_Request_Count));
      Append(Metrics, ASCII.LF);

      -- Return Prometheus format
      return AWS.Response.Build("text/plain", To_String(Metrics));
   end Metrics_Handler;

end Metrics_Exporter;
```

---

## Performance Considerations

### Scrape Interval

- **Default**: 30s (balance between freshness and overhead)
- **Critical Services**: 15s (API Gateway, Security Service)
- **Background Services**: 60s (Trading Service, Naming Service)

### Cardinality

Keep label cardinality low to avoid performance issues:

**Good** (low cardinality):
```
http_requests_total{service="widget-core", method="GET", status="200"}
```

**Bad** (high cardinality):
```
http_requests_total{service="widget-core", user_id="12345", request_id="abc-def-123"}
```

**Rule**: Avoid labels with many unique values (user IDs, request IDs, timestamps, etc.)

---

## Next Steps

1. ✅ Create ServiceMonitor templates
2. Create individual ServiceMonitor manifests for all 16 services
3. Instrument services with Prometheus client libraries
4. Deploy ServiceMonitors
5. Verify targets in Prometheus UI
6. Test metric queries in Grafana

---

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
