# Layer 4: Integration Tests

**Task**: 57fbde - Comprehensive Test Framework
**Layer**: 4 - Integration Tests (15% coverage target)

---

## Overview

Integration tests validate **multi-service workflows** with real dependencies. These tests ensure services work together correctly in realistic scenarios.

**Coverage Target**: ~150 tests (15% of test pyramid)
**Execution Time**: ~10 minutes
**Runtime**: Python 3.11+ with pytest

---

## Quick Start

```bash
# Run all integration tests
make test-integration

# Or run directly with pytest
cd integration
python3 -m pytest -v

# Run specific test file
python3 -m pytest test_widget_workflow.py -v

# Run tests with markers
python3 -m pytest -m security -v  # Security tests only
python3 -m pytest -m performance -v  # Performance tests only
```

---

## Test Files

| File | Purpose | Tests |
|------|---------|-------|
| `conftest.py` | pytest fixtures and configuration | - |
| `test_widget_workflow.py` | Widget lifecycle workflows | 12 tests |
| `test_security_flow.py` | Authentication & authorization | 10 tests |
| `test_orb_integration.py` | CORBA/ORB integration | 8 tests |
| `test_error_recovery.py` | Error recovery & resilience | 20 tests |
| `test_concurrent_operations.py` | Concurrent operations & race conditions | 18 tests |
| **Total** | | **68 tests** |

---

## Test Categories

### Widget Workflows (`test_widget_workflow.py`)

Tests complete widget lifecycle across services:

**Test Classes**:
- `TestWidgetCreateWorkflow` - Widget creation validation
- `TestWidgetUpdateWorkflow` - Widget update validation
- `TestWidgetDeleteWorkflow` - Widget deletion validation
- `TestWidgetPerformance` - Widget operation performance
- `TestCacheConsistency` - Redis cache consistency

**Example Test**:
```python
def test_create_widget_via_api_gateway(
    api_gateway_client,
    sample_widget_data,
    authenticated_token,
    clean_database,
    clean_redis,
    postgres_cursor,
    redis_client
):
    """
    Complete widget creation workflow:
    1. Authenticate user
    2. Create widget via API Gateway
    3. Verify widget stored in database
    4. Verify widget cached in Redis
    5. Verify widget retrievable via API
    """
    # Test implementation...
```

---

### Security Flows (`test_security_flow.py`)

Tests authentication, authorization, and security integration:

**Test Classes**:
- `TestAuthenticationFlow` - User registration and login
- `TestAuthorizationFlow` - Role-based access control
- `TestSecurityIntegration` - Security service integration
- `TestAuditLogging` - Security audit logging

**Example Test**:
```python
def test_user_registration_and_login(
    security_service_client,
    sample_user_data,
    clean_database
):
    """
    Test complete user registration and login flow:
    1. Create user
    2. Authenticate with credentials
    3. Receive JWT token
    4. Verify token is valid
    """
    # Test implementation...
```

---

### ORB Integration (`test_orb_integration.py`)

Tests wxWidgets (C++) ↔ PolyORB (Ada) integration:

**Test Classes**:
- `TestORBCommunication` - CORBA call validation
- `TestPhase1MemoryDeallocation` - Phase 1 refactor validation
- `TestORBConnectionPool` - Connection pool management
- `TestORBPerformance` - ORB call performance
- `TestORBErrorHandling` - Error handling and resilience

**Example Test**:
```python
def test_orb_memory_deallocation_on_widget_delete(
    widget_core_client,
    http_session,
    clean_database
):
    """
    Test that deleting a widget triggers proper ORB memory deallocation.
    Phase 1 validation: Ensures refactored deallocation code works.
    """
    # Test implementation...
```

---

### Error Recovery & Resilience (`test_error_recovery.py`)

Tests error recovery, service resilience, and failure handling:

**Test Classes**:
- `TestDatabaseFailureRecovery` - Database connection loss and recovery
- `TestRedisFailureRecovery` - Cache failure fallback to database
- `TestServiceFailureRecovery` - Dependent service failures
- `TestRetryLogic` - Automatic retry on transient errors
- `TestCircuitBreaker` - Circuit breaker patterns
- `TestErrorRecoveryPerformance` - Performance during failures
- `TestDataConsistency` - Data consistency during failures

**Example Test**:
```python
def test_database_connection_loss_recovery(
    api_gateway_client,
    authenticated_token,
    postgres_connection
):
    """
    Test recovery when database connection is lost:
    1. Create widget successfully
    2. Simulate database connection loss
    3. Request fails gracefully
    4. Database reconnects
    5. Subsequent requests succeed
    """
    # Test implementation...
```

---

### Concurrent Operations (`test_concurrent_operations.py`)

Tests concurrent operations and race conditions:

**Test Classes**:
- `TestConcurrentWidgetCreation` - Concurrent widget creation without conflicts
- `TestConcurrentUpdates` - Concurrent updates to same resource
- `TestConcurrentDeletes` - Concurrent delete idempotency
- `TestRaceConditions` - Race condition detection and handling
- `TestConcurrentOperationPerformance` - Throughput and latency under load
- `TestLockContention` - Database lock contention handling

**Example Test**:
```python
def test_concurrent_updates_to_same_widget(
    api_gateway_client,
    authenticated_token,
    clean_database
):
    """
    Test concurrent updates to same widget:
    1. Create widget
    2. Update widget concurrently from 20 threads
    3. Final state is consistent
    4. No lost updates
    """
    # Test implementation...
```

---

## Fixtures (`conftest.py`)

### Service Clients

```python
# HTTP clients for each service
api_gateway_client     # API Gateway client
widget_core_client     # Widget Core client
security_service_client # Security Service client
```

### Database Fixtures

```python
postgres_connection  # PostgreSQL connection (session scope)
postgres_cursor      # PostgreSQL cursor (test scope)
clean_database       # Clean database before test
```

### Redis Fixtures

```python
redis_client    # Redis client (session scope)
clean_redis     # Clean Redis before test
```

### Test Data Fixtures

```python
sample_widget_data       # Sample widget payload
sample_user_data         # Sample user payload
authenticated_token      # Valid JWT token
```

### Service Health Check

```python
wait_for_services  # Auto-runs before tests, ensures all services are healthy
```

### Performance Tracking

```python
performance_tracker  # Track test execution time
```

**Usage**:
```python
def test_widget_creation_performance(performance_tracker):
    performance_tracker.start()
    # ... operation ...
    performance_tracker.stop()
    performance_tracker.assert_duration_under(1.0, "Too slow")
```

---

## Environment Configuration

### Environment Variables

```bash
# Service URLs
export WIDGET_CORE_URL="http://localhost:8081"
export ORB_CORE_URL="http://localhost:12000"
export API_GATEWAY_URL="http://localhost:8080"
export SECURITY_SERVICE_URL="http://localhost:8082"

# PostgreSQL
export POSTGRES_HOST="localhost"
export POSTGRES_PORT="5432"
export POSTGRES_DB="microservices_test"
export POSTGRES_USER="test_user"
export POSTGRES_PASSWORD="test_password"

# Redis
export REDIS_HOST="localhost"
export REDIS_PORT="6379"
```

### Docker Compose Setup

For local testing, use Docker Compose to start all dependencies:

```bash
docker-compose -f docker-compose.integration.yml up -d
```

**Required Services**:
- API Gateway
- Widget Core
- ORB Core
- Security Service
- PostgreSQL
- Redis

---

## Test Markers

Tests can be marked with pytest markers for selective execution:

```python
@pytest.mark.integration  # All integration tests (auto-applied)
@pytest.mark.slow         # Slow-running tests (> 5s)
@pytest.mark.security     # Security-related tests
@pytest.mark.performance  # Performance validation tests
```

**Run tests by marker**:
```bash
pytest -m security       # Security tests only
pytest -m "not slow"     # Skip slow tests
pytest -m performance    # Performance tests only
```

---

## Performance Targets

| Operation | Target | Validation |
|-----------|--------|------------|
| Widget Creation | < 1s | `test_widget_creation_performance` |
| Widget Update | < 500ms | Validated in workflows |
| Widget Delete | < 500ms | Validated in workflows |
| ORB Call | < 500ms | `test_orb_call_latency` |
| Bulk Operations (100x) | < 10s | `test_bulk_widget_creation_performance` |

---

## Phase 1 Validation

Integration tests include **Phase 1 refactor validation** for the 73 PolyORB memory deallocation instances:

### Memory Deallocation Tests

**File**: `test_orb_integration.py` → `TestPhase1MemoryDeallocation`

**Tests**:
1. `test_orb_memory_deallocation_on_widget_delete`
   - Validates deallocation metrics increase
   - Checks `polyorb_memory_deallocations_total` counter

2. `test_critical_deallocation_memory_zeroization`
   - Validates CRITICAL instances (3 total) zero memory
   - Checks `polyorb_memory_deallocations_total{critical="true"}` counter

**Prometheus Metrics** (from ORB Core at `:9091/metrics`):
```prometheus
# Total deallocations
polyorb_memory_deallocations_total{service="orb-core"} 1523

# Critical deallocations (memory zeroization)
polyorb_memory_deallocations_total{service="orb-core",critical="true"} 45
```

---

## Running Tests in CI/CD

### GitHub Actions

```yaml
- name: Run Integration Tests
  run: |
    docker-compose -f docker-compose.integration.yml up -d
    make test-integration
  env:
    WIDGET_CORE_URL: http://localhost:8081
    API_GATEWAY_URL: http://localhost:8080
```

### Test Output

```
integration/test_widget_workflow.py::TestWidgetCreateWorkflow::test_create_widget_via_api_gateway PASSED [10%]
integration/test_widget_workflow.py::TestWidgetUpdateWorkflow::test_update_widget_workflow PASSED [20%]
integration/test_security_flow.py::TestAuthenticationFlow::test_user_registration_and_login PASSED [30%]
...
==================== 30 passed in 127.45s (0:02:07) ====================
```

---

## Troubleshooting

### Services Not Ready

**Error**: `pytest.fail: API Gateway not ready after 60s`

**Solution**:
```bash
# Check service health manually
curl http://localhost:8080/health
curl http://localhost:8081/health
curl http://localhost:8082/health

# Restart services
docker-compose -f docker-compose.integration.yml restart
```

### Database Connection Error

**Error**: `psycopg2.OperationalError: could not connect to server`

**Solution**:
```bash
# Check PostgreSQL is running
docker ps | grep postgres

# Check connection settings
psql -h localhost -U test_user -d microservices_test

# Reset database
docker-compose -f docker-compose.integration.yml down -v
docker-compose -f docker-compose.integration.yml up -d
```

### Redis Connection Error

**Error**: `redis.exceptions.ConnectionError: Error connecting to Redis`

**Solution**:
```bash
# Check Redis is running
docker ps | grep redis

# Test Redis connection
redis-cli -h localhost ping

# Restart Redis
docker-compose -f docker-compose.integration.yml restart redis
```

### Tests Pass Locally But Fail in CI

**Common Issues**:
1. **Timing differences**: Add retries/waits for async operations
2. **Port conflicts**: Ensure ports are available in CI
3. **Resource limits**: CI may have lower CPU/memory
4. **Database state**: Ensure clean state between tests

---

## Best Practices

### 1. Test Isolation

Each test should be independent:
```python
def test_widget_creation(clean_database, clean_redis):
    # Test starts with clean state
    # ...
```

### 2. Clear Assertions

Use descriptive assertion messages:
```python
assert response.status_code == 201, \
    f"Expected 201, got {response.status_code}: {response.text}"
```

### 3. Performance Validation

Always validate performance:
```python
def test_operation(performance_tracker):
    performance_tracker.start()
    # ... operation ...
    performance_tracker.stop()
    performance_tracker.assert_duration_under(1.0)
```

### 4. Error Handling

Test both success and failure paths:
```python
def test_create_widget_with_invalid_data(api_gateway_client):
    response = api_gateway_client.create_widget(invalid_data)
    assert response.status_code == 400
```

---

## Adding New Tests

### 1. Create Test File

```python
"""
Integration Tests: <Feature Name>
Task: 57fbde - Comprehensive Test Framework
Layer: 4 - Integration Tests

Tests <description>
"""

import pytest

@pytest.mark.integration
class TestFeatureName:
    """Test feature workflows."""

    def test_feature_workflow(self, api_gateway_client):
        """Test feature end-to-end."""
        # Test implementation
        pass
```

### 2. Add Fixtures (if needed)

In `conftest.py`:
```python
@pytest.fixture
def custom_fixture():
    """Custom fixture for tests."""
    # Setup
    yield data
    # Teardown
```

### 3. Run Tests

```bash
pytest test_feature_name.py -v
```

---

## Coverage Targets

**Layer 4 Target**: 15% of total tests (~150 tests)

**Current Coverage**:
- Widget Workflows: 12 tests ✅
- Security Flows: 10 tests ✅
- ORB Integration: 8 tests ✅
- Error Recovery & Resilience: 20 tests ✅
- Concurrent Operations: 18 tests ✅
- **Total**: 68 tests (45% of target)

**Remaining**: ~82 tests to reach target

**Priority Areas**:
1. Additional service integrations (cross-service workflows)
2. Data migration validation
3. Backward compatibility tests
4. Performance regression tests
5. Chaos engineering scenarios

---

## References

- [pytest Documentation](https://docs.pytest.org/)
- [pytest-docker-compose](https://github.com/pytest-dev/pytest-docker-compose)
- [Integration Testing Best Practices](https://martinfowler.com/bliki/IntegrationTest.html)
- [Test Pyramid](https://martinfowler.com/articles/practical-test-pyramid.html)

---

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
