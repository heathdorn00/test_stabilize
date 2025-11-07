# Performance Baseline Methodology

**Task**: 57fbde - Comprehensive Test Framework / RDB-002
**Purpose**: Capture and track performance baselines for all services

---

## Overview

Performance baselines provide a reference point for measuring system performance over time. They enable early detection of performance regressions and validate optimizations.

**Metrics Captured**:
- **Latency**: P50, P90, P95, P99, P999 response times
- **Throughput**: Requests/second, requests/minute
- **Memory**: RSS, heap, shared memory usage
- **CPU**: CPU percentage, user/system time, thread count
- **Connection Pools**: Active, idle, utilization
- **Cache**: Hit rate, miss rate, eviction rate

**Tools**:
- `baseline_capture.py` - Capture performance snapshots
- `baseline_compare.py` - Compare snapshots and detect regressions

---

## Quick Start

### 1. Capture Baseline

```bash
# Capture baseline for all services (5 minutes)
python baseline_capture.py --services all --duration 300 --rps 10

# Capture baseline for specific services
python baseline_capture.py --services api-gateway,widget-core --duration 60

# Custom output path
python baseline_capture.py --services all --duration 300 --output baselines/v1.0.0.json
```

### 2. Compare Against Baseline

```bash
# Compare current performance against baseline
python baseline_compare.py \
  --baseline baselines/v1.0.0.json \
  --current baselines/v1.1.0.json \
  --threshold 10

# Save comparison report
python baseline_compare.py \
  --baseline baselines/v1.0.0.json \
  --current baselines/v1.1.0.json \
  --output reports/comparison-v1.0.0-vs-v1.1.0.json
```

### 3. Review Results

```bash
# View baseline snapshot
cat baselines/v1.0.0.json | jq .

# View comparison report
cat reports/comparison-v1.0.0-vs-v1.1.0.json | jq .

# Check for regressions (exit code 0 = no regressions, 1 = regressions found)
echo $?
```

---

## Baseline Capture

### Configuration

**Service Endpoints**: `baseline_capture.py` (lines 27-67)

Each service is configured with:
- Base URL
- Health check endpoint
- Metrics endpoint
- Test endpoints (for load generation)

**Example**:
```python
'api-gateway': {
    'url': 'http://localhost:8080',
    'health_endpoint': '/health',
    'metrics_endpoint': '/metrics',
    'test_endpoints': [
        {'method': 'GET', 'path': '/api/v1/widgets', 'name': 'list_widgets'},
        {'method': 'POST', 'path': '/api/v1/widgets', 'name': 'create_widget',
         'body': {'type': 'button', 'label': 'Test', 'width': 100, 'height': 50}},
    ],
}
```

### Capture Process

**1. Health Check**: Verify all services are healthy

**2. Load Generation**: Send requests at target RPS
   - Configurable request rate (default: 10 RPS)
   - Uniform distribution across endpoints
   - Records latency for each request

**3. Metric Collection**: Sample system metrics every 5 seconds
   - Memory usage (RSS, heap, VMS)
   - CPU usage (percent, user time, system time)
   - Connection pool status
   - Cache metrics

**4. Snapshot Creation**: Aggregate metrics into JSON snapshot
   - Latency percentiles (P50, P90, P95, P99, P999)
   - Throughput calculations
   - Averaged resource usage
   - Metadata (timestamp, duration, services)

### Output Format

**Snapshot JSON Structure**:
```json
{
  "timestamp": "2024-01-15T10:30:00Z",
  "duration_seconds": 300,
  "services": ["api-gateway", "widget-core"],
  "latency": [
    {
      "endpoint": "api-gateway/list_widgets",
      "method": "GET",
      "min": 12.5,
      "max": 456.8,
      "mean": 85.3,
      "median": 78.2,
      "p50": 78.2,
      "p90": 156.4,
      "p95": 234.5,
      "p99": 389.2,
      "p999": 445.6,
      "stddev": 45.2,
      "sample_count": 3000
    }
  ],
  "throughput": [
    {
      "service": "api-gateway",
      "requests_per_second": 9.8,
      "requests_per_minute": 588.0,
      "total_requests": 2940,
      "successful_requests": 2910,
      "failed_requests": 30,
      "error_rate": 0.01
    }
  ],
  "memory": [
    {
      "service": "api-gateway",
      "rss_mb": 145.3,
      "vms_mb": 298.6,
      "heap_mb": 98.4,
      "shared_mb": 18.2,
      "percent": 4.8
    }
  ],
  "cpu": [
    {
      "service": "api-gateway",
      "cpu_percent": 12.5,
      "user_time": 8.3,
      "system_time": 1.8,
      "num_threads": 8
    }
  ],
  "connection_pools": [
    {
      "service": "widget-core",
      "total": 10,
      "active": 3,
      "idle": 7,
      "max_size": 20,
      "utilization": 0.15
    }
  ],
  "cache": [
    {
      "service": "redis",
      "hit_rate": 0.85,
      "miss_rate": 0.15,
      "eviction_rate": 0.01,
      "memory_usage_mb": 48.5,
      "keys_count": 1024
    }
  ]
}
```

---

## Baseline Comparison

### Comparison Process

**1. Load Snapshots**: Load baseline and current snapshots

**2. Metric Matching**: Match endpoints/services between snapshots

**3. Calculate Changes**: Compute percentage changes
   - Latency: P95 and P99 are primary indicators
   - Throughput: RPS comparison
   - Memory: RSS comparison

**4. Classify Changes**:
   - **Improvement**: Metric improved (latency decreased, throughput increased)
   - **Regression**: Metric worsened (latency increased, throughput decreased)
   - **Neutral**: Change < 5%

**5. Assess Severity**:
   - **Critical**: ≥25% regression
   - **High**: 15-24% regression
   - **Medium**: 10-14% regression
   - **Low**: 5-9% regression
   - **None**: <5% change

### Regression Thresholds

| Metric | Threshold | Rationale |
|--------|-----------|-----------|
| Latency (P95/P99) | +10% | User-facing performance |
| Throughput | -10% | System capacity |
| Memory | +15% | Resource utilization |
| CPU | +15% | Resource utilization |
| Error Rate | +5% | Reliability |

### Report Format

**Console Output**:
```
================================================================================
PERFORMANCE BASELINE COMPARISON REPORT
================================================================================

Baseline: 2024-01-15T10:30:00Z
Current:  2024-01-20T14:15:00Z

Summary:
  Regressions: 2
  Improvements: 5

⚠️  CRITICAL ISSUES (1):
  • Latency regression in api-gateway/create_widget: P95 +28.5%, P99 +31.2%

--------------------------------------------------------------------------------
LATENCY COMPARISON (P95/P99)
--------------------------------------------------------------------------------
Endpoint                                  Baseline P95    Current P95     Change      Status
--------------------------------------------------------------------------------
api-gateway/list_widgets                       85.2ms         78.3ms       -8.1%  ✓ improvement
api-gateway/create_widget                     156.3ms        200.8ms      +28.5%  ⚠️ regression
widget-core/list_widgets                       72.5ms         71.2ms       -1.8%  → neutral

--------------------------------------------------------------------------------
THROUGHPUT COMPARISON
--------------------------------------------------------------------------------
Service                        Baseline RPS      Current RPS     Change      Status
--------------------------------------------------------------------------------
api-gateway                            9.8            10.2       +4.1%  ✓ improvement
widget-core                            8.5             7.9       -7.1%  ⚠️ regression

--------------------------------------------------------------------------------
MEMORY COMPARISON (RSS)
--------------------------------------------------------------------------------
Service                        Baseline MB       Current MB     Change      Status
--------------------------------------------------------------------------------
api-gateway                          145.3            142.8       -1.7%  → neutral
widget-core                          132.6            138.2       +4.2%  → neutral

================================================================================
❌ CRITICAL PERFORMANCE REGRESSIONS DETECTED
```

**Exit Codes**:
- `0`: No regressions
- `1`: Regressions detected

### CI/CD Integration

**GitHub Actions Example**:
```yaml
- name: Capture Current Baseline
  run: |
    python tests/performance/baseline_capture.py \
      --services all \
      --duration 300 \
      --output baselines/current.json

- name: Compare Against Baseline
  run: |
    python tests/performance/baseline_compare.py \
      --baseline baselines/v1.0.0.json \
      --current baselines/current.json \
      --threshold 10 \
      --output reports/comparison.json

- name: Check for Regressions
  run: |
    if [ $? -ne 0 ]; then
      echo "Performance regressions detected"
      exit 1
    fi
```

---

## Baseline Management

### Versioning Strategy

**1. Semantic Versioning**: Tie baselines to release versions
```
baselines/
  v1.0.0.json    # Initial release
  v1.1.0.json    # Feature release
  v1.1.1.json    # Patch release
  v2.0.0.json    # Major release
```

**2. Date-Based Versioning**: For continuous tracking
```
baselines/
  2024-01-15_10-30-00.json
  2024-01-20_14-15-00.json
  2024-01-25_09-45-00.json
```

**3. Hybrid Approach**: Major releases + periodic snapshots
```
baselines/
  v1.0.0/
    baseline.json
    2024-01-15.json
    2024-01-22.json
  v1.1.0/
    baseline.json
    2024-02-01.json
```

### Baseline Storage

**Git Repository**:
```bash
# Add baseline to git
git add baselines/v1.0.0.json
git commit -m "Add performance baseline for v1.0.0"

# Tag for easy reference
git tag -a perf-baseline-v1.0.0 -m "Performance baseline v1.0.0"
```

**Artifact Storage** (CI/CD):
```yaml
- name: Upload Baseline
  uses: actions/upload-artifact@v3
  with:
    name: performance-baseline
    path: baselines/current.json
    retention-days: 90
```

**External Storage** (S3, GCS):
```bash
# Upload to S3
aws s3 cp baselines/v1.0.0.json s3://perf-baselines/v1.0.0.json

# Download from S3
aws s3 cp s3://perf-baselines/v1.0.0.json baselines/v1.0.0.json
```

### Baseline Refresh

**When to Refresh**:
- After major refactoring
- After infrastructure changes
- After optimization work
- Quarterly (scheduled)

**How to Refresh**:
```bash
# Capture new baseline
python baseline_capture.py --services all --duration 600 --output baselines/v2.0.0.json

# Validate baseline
python baseline_compare.py \
  --baseline baselines/v1.0.0.json \
  --current baselines/v2.0.0.json

# If acceptable, promote to official baseline
mv baselines/v2.0.0.json baselines/official.json
git add baselines/official.json
git commit -m "Update performance baseline to v2.0.0"
```

---

## Performance Targets

### Latency Targets

| Endpoint | P95 Target | P99 Target | Rationale |
|----------|------------|------------|-----------|
| GET /widgets | <100ms | <250ms | User-facing list operation |
| POST /widgets | <200ms | <500ms | User-facing create operation |
| GET /widgets/:id | <50ms | <150ms | Single item retrieval |
| PUT /widgets/:id | <150ms | <400ms | Update operation |
| DELETE /widgets/:id | <100ms | <300ms | Delete operation |
| ORB calls | <500ms | <1000ms | CORBA overhead |

### Throughput Targets

| Service | Minimum RPS | Target RPS | Peak RPS |
|---------|-------------|------------|----------|
| API Gateway | 50 | 100 | 200 |
| Widget Core | 40 | 80 | 150 |
| ORB Core | 20 | 40 | 80 |
| Security Service | 60 | 120 | 250 |

### Resource Targets

| Service | Memory Limit | CPU Limit |
|---------|--------------|-----------|
| API Gateway | 512 MB | 2 cores |
| Widget Core | 512 MB | 2 cores |
| ORB Core | 1 GB | 3 cores |
| Security Service | 256 MB | 1 core |

### Error Rate Targets

| Service | Target Error Rate | Max Error Rate |
|---------|-------------------|----------------|
| All Services | <0.1% | <1% |

---

## Analyzing Performance Data

### Identifying Bottlenecks

**1. High Latency (P95/P99)**:
   - Check database query times
   - Review external API calls
   - Examine lock contention
   - Profile CPU usage

**2. Low Throughput**:
   - Check connection pool saturation
   - Review thread pool utilization
   - Examine queue depths
   - Check for blocking I/O

**3. High Memory Usage**:
   - Look for memory leaks
   - Review cache sizes
   - Check object retention
   - Examine heap fragmentation

**4. High CPU Usage**:
   - Profile hot code paths
   - Look for inefficient algorithms
   - Check for busy loops
   - Review serialization overhead

### Performance Trends

Track performance over time:
```bash
# Generate trend report
python baseline_trend.py \
  --baselines baselines/v*.json \
  --output reports/trend.html
```

**Trend Indicators**:
- Gradual latency increase → Memory leak or resource exhaustion
- Sudden throughput drop → Configuration change or dependency issue
- Increasing error rate → Reliability degradation
- Growing memory usage → Leak or cache growth

---

## Best Practices

### 1. Consistent Environment

Capture baselines in consistent environment:
- Same hardware/VM size
- Same network conditions
- Same data volume
- Same time of day (for load patterns)

### 2. Sufficient Duration

Run baseline captures for adequate duration:
- Minimum: 5 minutes (300 seconds)
- Recommended: 10 minutes (600 seconds)
- Production validation: 30+ minutes

### 3. Realistic Load

Use realistic load patterns:
- Representative request mix
- Realistic payload sizes
- Authentic user behavior
- Peak and off-peak scenarios

### 4. Stable State

Ensure system is in stable state:
- All services warmed up
- Caches populated
- No ongoing deployments
- No maintenance tasks

### 5. Regular Capture

Capture baselines regularly:
- Every major release
- After significant refactoring
- Monthly for trending
- Before/after optimization work

### 6. Version Control

Track baselines in version control:
```bash
git add baselines/
git commit -m "Update performance baselines"
git tag perf-baseline-$(date +%Y-%m-%d)
```

### 7. Automated Comparison

Automate baseline comparison in CI/CD:
```yaml
- name: Performance Regression Check
  run: make performance-check
  # Fails build if regressions detected
```

---

## Troubleshooting

### Services Not Responding

**Issue**: Health check fails

**Solution**:
```bash
# Check service status
curl http://localhost:8080/health

# Check Docker logs
docker logs api-gateway

# Restart services
docker-compose restart
```

### Inconsistent Results

**Issue**: Baseline metrics vary between runs

**Solution**:
- Increase capture duration
- Run during off-peak hours
- Disable background tasks
- Ensure no other load on system

### High Error Rate

**Issue**: Many requests failing during capture

**Solution**:
- Reduce RPS (`--rps 5`)
- Check service logs for errors
- Verify test endpoints are correct
- Ensure test data is properly seeded

### Memory/CPU Spikes

**Issue**: Resource usage spikes during capture

**Solution**:
- Reduce RPS to avoid overwhelming services
- Check for memory leaks
- Profile CPU usage
- Review service configuration

---

## References

- [Load Testing Best Practices](https://k6.io/docs/testing-guides/load-testing/)
- [Latency Percentiles](https://www.brendangregg.com/blog/2016-10-12/linux-bcc-tcplife.html)
- [Performance Testing Strategy](https://martinfowler.com/articles/performance-testing.html)
- [SRE Book - Monitoring](https://sre.google/sre-book/monitoring-distributed-systems/)

---

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
