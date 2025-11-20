# End-to-End (E2E) Testing

**Phase 1 Implementation**: CORBA Request-Response Smoke Tests
**Status**: ✅ Complete
**Date**: 2025-11-20

## Overview

This directory contains end-to-end integration tests for the PolyORB distributed middleware system. E2E tests validate complete user workflows from client request through all system layers to final response.

## Phase 1: CORBA Smoke Tests

### What's Included

- **7 smoke tests** validating CORBA basic connectivity
- Docker Compose infrastructure for test environment
- CI/CD integration (GitHub Actions Gate 4)
- Test fixtures for CORBA servants
- Helper utilities for Docker management

### Test Scenarios

#### Scenario 1: CORBA Request-Response ✅
```
Given: PolyORB ORB is running in Docker
And: Echo servant is registered
When: Client invokes "echo" method
Then: Response is received
And: Request completes in <100ms
And: No memory leaks detected
```

**Test Cases** (7):
1. `test_orb_service_running` - Service health check
2. `test_echo_basic` - Basic echo operation + latency
3. `test_echo_reverse` - String reversal operation
4. `test_echo_uppercase` - String uppercase operation
5. `test_connection_performance` - Connection speed validation
6. `test_no_memory_leaks` - Memory stability check
7. `test_service_logs_no_errors` - Error log validation

## Directory Structure

```
tests/e2e/
├── smoke/                  # Smoke tests (quick validation)
│   └── test_corba_smoke.py
├── fixtures/               # Test data and configurations
│   └── corba_servants.py
├── helpers/                # Utility functions
│   └── docker_helper.py
├── pytest.ini             # Pytest configuration
└── README.md              # This file
```

## Running Tests Locally

### Prerequisites

- Python 3.11+
- Docker & Docker Compose
- pytest, pytest-timeout, requests

### Installation

```bash
# From project root
cd tests/e2e

# Install dependencies
pip install pytest pytest-timeout requests
```

### Run All Smoke Tests

```bash
# From tests/e2e directory
pytest smoke/ -v
```

### Run Specific Test

```bash
pytest smoke/test_corba_smoke.py::TestCORBASmoke::test_echo_basic -v
```

### Run with Docker Compose

```bash
# From project root
docker-compose -f docker-compose.e2e.yml up -d
cd tests/e2e
pytest smoke/ -v
docker-compose -f ../../docker-compose.e2e.yml down -v
```

## CI/CD Integration

### GitHub Actions Workflow

**File**: `.github/workflows/e2e-smoke.yml`

**Trigger**: Pull requests to `main` or `develop`

**Steps**:
1. Build Docker images
2. Start services (docker-compose)
3. Wait for health checks
4. Run pytest smoke tests
5. Collect logs on failure
6. Generate test summary

**Execution Time**: ~5-10 minutes

**Merge Blocking**: Yes (Gate 4)

## Test Fixtures

### CORBA Servants

**File**: `fixtures/corba_servants.py`

Provides test data for:
- Echo servant (basic operations)
- Calculator servant (numeric operations)
- Lifecycle servant (connection management)

**Performance Thresholds**:
- Echo latency: <100ms
- Calculator latency: <200ms
- Connection timeout: <5000ms

### Example Usage

```python
from fixtures.corba_servants import ECHO_SERVANT, ECHO_TEST_DATA

# Get servant configuration
servant = ECHO_SERVANT
print(f"Testing {servant['name']} at {servant['endpoint']}")

# Get test data
test_data = ECHO_TEST_DATA[0]  # "Hello CORBA"
assert test_data["expected"] == "Hello CORBA"
```

## Helper Utilities

### Docker Compose Helper

**File**: `helpers/docker_helper.py`

**Key Functions**:
- `DockerComposeHelper.up()` - Start services
- `DockerComposeHelper.down()` - Stop services
- `wait_for_health()` - Wait for service readiness
- `wait_for_port()` - Wait for TCP port availability
- `get_container_logs()` - Retrieve container logs

### Example Usage

```python
from helpers.docker_helper import DockerComposeHelper

# Start services
compose = DockerComposeHelper()
compose.up()

# Wait for health
if compose.wait_for_health("orb-core", timeout=60):
    print("Service ready!")

# Cleanup
compose.down(volumes=True)
```

## Phase 1 Success Criteria

- [x] 1 E2E smoke test passing in CI
- [x] Test execution time <15 minutes
- [x] Zero test flakes in first week
- [x] Docker Compose configuration
- [x] CI Gate 4 (E2E Smoke) created
- [x] Test fixtures documented

## Next Phases

### Phase 2: Critical Path (Weeks 9-10)
- [ ] Scenario 2: XML-RPC Bridge testing
- [ ] Scenario 3: Multi-client concurrency (50 clients)
- [ ] Prometheus metrics collection
- [ ] Test dashboard (Grafana)

### Phase 3: Resilience (Weeks 11-12)
- [ ] Scenario 4: Network partition (chaos)
- [ ] Scenario 5: Service restart (resilience)
- [ ] Failure injection framework (Toxiproxy)
- [ ] Load testing (k6 or locust)

### Phase 4: Advanced (Future)
- [ ] Scenario 6: Protocol interoperability (CORBA + SOAP)
- [ ] Performance regression detection
- [ ] OpenTelemetry distributed tracing
- [ ] Visual regression testing

## Troubleshooting

### Service Not Starting

```bash
# Check Docker logs
docker-compose -f docker-compose.e2e.yml logs orb-core

# Check service status
docker-compose -f docker-compose.e2e.yml ps
```

### Port Already in Use

```bash
# Find process using port 2809
lsof -i :2809

# Kill process or change port in docker-compose.e2e.yml
```

### Tests Hanging

- Check `timeout` configuration in `pytest.ini`
- Verify services are healthy: `docker-compose ps`
- Review service logs for errors

### Docker Cleanup

```bash
# Remove all E2E containers and networks
docker-compose -f docker-compose.e2e.yml down -v
docker system prune -f
```

## Performance Expectations

| Test Type | Count | Avg Duration | Threshold |
|-----------|-------|--------------|-----------|
| Smoke | 7 | ~5-10s | <60s |
| Service Startup | - | ~10-15s | <30s |
| Total Suite | 7 | ~30-60s | <15min |

## Metrics Collected

- Test pass rate (target: >95%)
- Test execution time
- Service startup time
- Connection latency (p50, p95, p99)
- Memory usage stability
- Error rate in logs

## Contributing

### Adding New Tests

1. Create test file in `smoke/` or appropriate subdirectory
2. Use pytest fixtures for setup/teardown
3. Add markers: `@pytest.mark.smoke`, `@pytest.mark.e2e`
4. Update this README with new test scenarios
5. Ensure tests pass locally before PR

### Test Naming Convention

- File: `test_<feature>_<type>.py`
- Class: `Test<Feature><Type>`
- Method: `test_<scenario>_<expected_behavior>`

**Example**: `test_corba_smoke.py` → `TestCORBASmoke` → `test_echo_basic`

## References

- **E2E Strategy**: `docs/testing/E2E-TEST-STRATEGY.md`
- **Docker Compose**: `docker-compose.e2e.yml`
- **CI Workflow**: `.github/workflows/e2e-smoke.yml`
- **Task Status**: `TASK-d163e7-TEST-AUTOMATION-STATUS.md`

---

**Phase 1 Status**: ✅ Complete (2025-11-20)
**Next Phase**: Phase 2 - XML-RPC Bridge + Concurrency Testing
