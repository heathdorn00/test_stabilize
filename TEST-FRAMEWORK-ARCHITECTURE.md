# Comprehensive Test Framework Architecture

**Task**: 57fbde - Set up comprehensive test framework
**Owner**: @test_stabilize
**Date**: 2025-11-05
**Status**: In Progress

---

## Table of Contents

1. [Overview](#overview)
2. [Testing Pyramid](#testing-pyramid)
3. [Framework Architecture](#framework-architecture)
4. [Directory Structure](#directory-structure)
5. [Layer Specifications](#layer-specifications)
6. [Tool Selection](#tool-selection)
7. [CI/CD Integration](#cicd-integration)
8. [Coverage Strategy](#coverage-strategy)

---

## Overview

This document defines the comprehensive test framework for the microservices refactor covering both **wxWidgets (C++)** and **PolyORB (Ada)** projects.

### Goals

✅ **85% Code Coverage** - Industry standard for production systems
✅ **5-Layer Testing Pyramid** - From unit to E2E
✅ **Fast Feedback** - Unit tests < 5 min, full suite < 15 min
✅ **CI/CD Integrated** - Automated testing on every PR
✅ **Contract-Driven** - Pact CDC for service boundaries

### Key Principles

1. **Test Pyramid Over Ice Cream Cone** - More unit tests, fewer E2E
2. **Isolation** - Tests don't interfere with each other
3. **Repeatability** - Same inputs = same outputs
4. **Fast** - Developer productivity requires fast feedback
5. **Maintainable** - Tests as first-class code

---

## Testing Pyramid

```
        ╱╲
       ╱E2E╲         5%  (~50 tests)  - k6 load tests, smoke tests
      ╱━━━━━━╲        Target: Critical user paths only
     ╱Integration╲  15% (~150 tests) - Service-to-service, DB, external APIs
    ╱━━━━━━━━━━━━╲   Target: Cross-service workflows
   ╱  Component   ╲ 30% (~300 tests) - Service + deps (Docker Compose)
  ╱━━━━━━━━━━━━━━━━╲ Target: Service boundaries with real dependencies
 ╱  Contract (API) ╱ Coverage: All service contracts
╱━━━━━━━━━━━━━━━━━━╲ Target: Consumer-provider contracts
       Unit         50% (~500 tests) - Pure functions, classes, modules
━━━━━━━━━━━━━━━━━━━━ Target: Business logic, algorithms, data structures
```

**Total**: ~1,000 automated tests across 16 microservices

---

## Framework Architecture

### High-Level Design

```
┌─────────────────────────────────────────────────────────────┐
│                    CI/CD Pipeline (GitHub Actions)          │
│  Pull Request → [Unit] → [Component] → [Contract] →         │
│                 [Integration] → [E2E] → [Coverage Report]   │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                    Test Orchestration                        │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │ Makefile │  │  Docker  │  │  Scripts │  │  Config  │   │
│  │          │  │ Compose  │  │          │  │   Files  │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                    Test Layers (5)                           │
│                                                              │
│  Layer 1: Unit Tests                                         │
│    - GoogleTest (C++), AUnit (Ada)                          │
│    - Mocking: GoogleMock, trompeloeil                       │
│    - Fast, isolated, deterministic                          │
│                                                              │
│  Layer 2: Component Tests                                    │
│    - Docker Compose (service + dependencies)                │
│    - Real databases, caches, message queues                 │
│    - Integration within service boundary                     │
│                                                              │
│  Layer 3: Contract Tests (Pact CDC)                         │
│    - Consumer-driven contracts                               │
│    - Pact Broker for contract storage                       │
│    - Provider verification                                   │
│                                                              │
│  Layer 4: Integration Tests                                  │
│    - Cross-service workflows                                 │
│    - gRPC/REST clients                                       │
│    - Kubernetes test namespace                               │
│                                                              │
│  Layer 5: E2E & Performance Tests                           │
│    - k6 load testing (P95 < 500ms)                          │
│    - Smoke tests (happy paths)                              │
│    - Chaos engineering (optional)                            │
│                                                              │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                    Reporting & Metrics                       │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │ CodeCov  │  │ Grafana  │  │   Pact   │  │ k6 Cloud │   │
│  │ Coverage │  │Dashboard │  │  Broker  │  │  Metrics │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
└─────────────────────────────────────────────────────────────┘
```

---

## Directory Structure

### Root Test Directory

```
tests/
├── README.md                      # Test framework overview
├── Makefile                       # Test orchestration
├── docker-compose.test.yml        # Test infrastructure
├── .codecov.yml                   # Coverage configuration
├── .pact/                         # Pact configuration
│   └── pact-broker-config.yml
│
├── unit/                          # Layer 1: Unit Tests (50%)
│   ├── cpp/                       # C++ (wxWidgets)
│   │   ├── widget_core/
│   │   │   ├── button_test.cpp
│   │   │   ├── layout_test.cpp
│   │   │   └── event_test.cpp
│   │   ├── render_manager/
│   │   ├── event_manager/
│   │   └── CMakeLists.txt
│   │
│   └── ada/                       # Ada (PolyORB)
│       ├── orb_core/
│       │   ├── test_object_ref.adb
│       │   ├── test_poa.adb
│       │   └── test_suite.gpr
│       ├── giop/
│       ├── corba_services/
│       └── test_runner.adb
│
├── component/                     # Layer 2: Component Tests (30%)
│   ├── widget_core/
│   │   ├── docker-compose.yml     # Service + Redis + PostgreSQL
│   │   ├── test_with_cache.py
│   │   └── test_with_db.py
│   ├── orb_core/
│   │   ├── docker-compose.yml
│   │   └── test_corba_ops.py
│   └── shared/
│       ├── fixtures/              # Test data
│       └── helpers/               # Test utilities
│
├── contracts/                     # Layer 3: Contract Tests (Pact)
│   ├── consumers/
│   │   ├── api_gateway/          # Consumer tests
│   │   │   ├── widget_core.pact.spec.ts
│   │   │   └── orb_core.pact.spec.ts
│   │   └── ui_frontend/
│   ├── providers/
│   │   ├── widget_core/          # Provider verification
│   │   │   └── verify_contracts.py
│   │   └── orb_core/
│   ├── pacts/                    # Generated contract files
│   └── pact-broker-setup/
│
├── integration/                   # Layer 4: Integration Tests (15%)
│   ├── workflows/
│   │   ├── test_full_widget_creation.py
│   │   ├── test_corba_request_flow.py
│   │   └── test_cross_service_auth.py
│   ├── grpc_clients/             # gRPC test clients
│   ├── rest_clients/             # REST test clients
│   └── k8s/
│       └── test-namespace.yaml   # Kubernetes test env
│
├── e2e/                          # Layer 5: E2E & Performance (5%)
│   ├── load_tests/               # k6 load tests
│   │   ├── baseline.js           # 100 RPS, 5 min
│   │   ├── spike.js              # Sudden 500 RPS
│   │   ├── soak.js               # 50 RPS, 1 hour
│   │   └── stress.js             # Ramp until failure
│   ├── smoke_tests/              # Happy path E2E
│   │   ├── test_widget_e2e.sh
│   │   └── test_corba_e2e.sh
│   └── chaos/                    # Chaos engineering (optional)
│       └── chaos-mesh-scenarios/
│
├── fixtures/                     # Shared test data
│   ├── sample_widgets.json
│   ├── corba_requests.json
│   └── test_users.sql
│
├── scripts/                      # Test automation scripts
│   ├── run_all_tests.sh          # Master test runner
│   ├── run_unit_tests.sh
│   ├── run_component_tests.sh
│   ├── run_contract_tests.sh
│   ├── run_integration_tests.sh
│   ├── run_e2e_tests.sh
│   ├── generate_coverage_report.sh
│   └── publish_contracts.sh
│
├── coverage/                     # Coverage reports (generated)
│   ├── cpp/
│   ├── ada/
│   └── combined/
│
└── docs/                         # Test documentation
    ├── TESTING_GUIDE.md          # How to run tests
    ├── WRITING_TESTS.md          # How to write tests
    ├── TEST_DATA.md              # Test data management
    └── DEBUGGING_TESTS.md        # Troubleshooting
```

---

## Layer Specifications

### Layer 1: Unit Tests (50% Coverage Target)

**Scope**: Pure functions, classes, modules - no external dependencies

**wxWidgets (C++):**
- Framework: GoogleTest 1.14
- Mocking: GoogleMock
- Coverage: gcov + lcov
- Target: 50% of total tests (~500 tests)

**PolyORB (Ada):**
- Framework: AUnit 24.0
- Coverage: gcov for Ada
- Target: 50% of total tests (~500 tests)

**Characteristics**:
- ✅ Fast (< 100ms per test)
- ✅ Isolated (no I/O, network, DB)
- ✅ Deterministic (same input → same output)
- ✅ High volume (hundreds of tests)

**Example Test Cases**:
- Widget creation with valid/invalid parameters
- Event routing and filtering logic
- Data structure operations
- Algorithm correctness
- Error handling

---

### Layer 2: Component Tests (30% Coverage Target)

**Scope**: Service + real dependencies (DB, cache, message queue) in Docker

**Tools**:
- Docker Compose
- pytest (Python)
- Real databases (PostgreSQL, Redis)

**Target**: 30% of total tests (~300 tests)

**Characteristics**:
- ✅ Service boundary testing
- ✅ Real dependencies (not mocked)
- ✅ Isolated per service
- ✅ Medium speed (1-5 seconds per test)

**Example Test Scenarios**:
- Widget Core + Redis cache (cache hit/miss)
- ORB Core + PostgreSQL (object persistence)
- Service + message queue (async operations)
- Service error handling with DB failures

---

### Layer 3: Contract Tests (Pact CDC)

**Scope**: API contracts between consumers and providers

**Tools**:
- Pact (Consumer-Driven Contracts)
- Pact Broker (contract storage & versioning)
- pact-js, pact-python

**Contracts to Define**:
1. API Gateway ↔ Widget Core
2. API Gateway ↔ ORB Core
3. Widget Core ↔ Platform Adapters
4. ORB Core ↔ GIOP Protocol
5. CORBA Services ↔ ORB Core
6. Security Service ↔ All Services

**Characteristics**:
- ✅ Consumer defines expectations
- ✅ Provider verifies compliance
- ✅ Versioned contracts in Pact Broker
- ✅ Prevents breaking changes

**Benefits**:
- Early detection of incompatible changes
- Independent service deployment
- Living documentation of APIs
- Contract evolution tracking

---

### Layer 4: Integration Tests (15% Coverage Target)

**Scope**: Multi-service workflows, cross-service communication

**Tools**:
- gRPC clients (grpcurl, evans)
- REST clients (httpie)
- Kubernetes test namespace
- Testcontainers (optional)

**Target**: 15% of total tests (~150 tests)

**Characteristics**:
- ✅ Full request flows
- ✅ Multiple services
- ✅ Real network calls
- ✅ Slow (5-10 seconds per test)

**Example Workflows**:
- Client → API Gateway → Widget Core → PostgreSQL
- Client → ORB Core → GIOP → CORBA Service
- Cross-service authentication and authorization
- Circuit breaker and retry behavior
- Transaction rollback across services

---

### Layer 5: E2E & Performance Tests (5% Coverage Target)

**Scope**: Critical user paths, performance validation

**Tools**:
- k6 (load testing)
- Shell scripts (smoke tests)
- Chaos Mesh (chaos engineering - optional)

**Target**: 5% of total tests (~50 tests)

**k6 Load Test Scenarios**:

1. **Baseline**: 100 RPS for 5 minutes (P95 < 500ms)
2. **Spike**: Sudden jump to 500 RPS (resilience)
3. **Soak**: 50 RPS for 1 hour (memory leaks)
4. **Stress**: Ramp until failure (capacity planning)

**Smoke Tests**:
- Widget creation end-to-end
- CORBA request end-to-end
- Authentication flow
- Critical business workflows

**Characteristics**:
- ✅ Critical paths only (not exhaustive)
- ✅ Performance metrics (latency, throughput)
- ✅ Production-like environment
- ✅ Very slow (minutes per test)

---

## Tool Selection

### Unit Testing

| Language | Framework | Mocking | Coverage | Rationale |
|----------|-----------|---------|----------|-----------|
| C++ | GoogleTest 1.14 | GoogleMock | gcov/lcov | Industry standard, excellent maturity |
| Ada | AUnit 24.0 | Manual stubs | gcov | Official Ada testing framework |

### Component Testing

| Tool | Purpose | Version |
|------|---------|---------|
| Docker Compose | Service + dependencies | v2.x |
| pytest | Python test runner | 7.4 |
| PostgreSQL | Database | 15 |
| Redis | Cache | 7.x |

### Contract Testing

| Tool | Purpose | Version |
|------|---------|---------|
| Pact | Consumer-driven contracts | 12.0 |
| Pact Broker | Contract storage | Latest |
| pact-js | JavaScript contracts | 12.x |
| pact-python | Python contracts | 2.x |

### Integration & E2E Testing

| Tool | Purpose | Version |
|------|---------|---------|
| k6 | Load testing | 0.47 |
| grpcurl | gRPC testing | Latest |
| httpie | REST testing | 3.x |
| kubectl | K8s operations | 1.28 |

---

## CI/CD Integration

### GitHub Actions Workflow

```yaml
name: Test Suite

on: [push, pull_request]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    timeout-minutes: 10
    steps:
      - uses: actions/checkout@v4
      - name: Run C++ Unit Tests
        run: make test-unit-cpp
      - name: Run Ada Unit Tests
        run: make test-unit-ada
      - name: Upload Coverage
        uses: codecov/codecov-action@v3

  component-tests:
    runs-on: ubuntu-latest
    timeout-minutes: 20
    steps:
      - uses: actions/checkout@v4
      - name: Start Test Services
        run: docker-compose -f tests/docker-compose.test.yml up -d
      - name: Run Component Tests
        run: make test-component
      - name: Cleanup
        run: docker-compose down

  contract-tests:
    runs-on: ubuntu-latest
    timeout-minutes: 15
    steps:
      - uses: actions/checkout@v4
      - name: Run Consumer Tests
        run: make test-contracts-consumer
      - name: Publish Contracts
        run: make publish-contracts
        env:
          PACT_BROKER_URL: ${{ secrets.PACT_BROKER_URL }}

  integration-tests:
    runs-on: ubuntu-latest
    timeout-minutes: 25
    needs: [unit-tests, component-tests, contract-tests]
    steps:
      - uses: actions/checkout@v4
      - name: Deploy to Test K8s
        run: make deploy-test-k8s
      - name: Run Integration Tests
        run: make test-integration

  e2e-tests:
    runs-on: ubuntu-latest
    timeout-minutes: 30
    needs: [integration-tests]
    steps:
      - uses: actions/checkout@v4
      - name: Run Smoke Tests
        run: make test-smoke
      - name: Run k6 Load Tests
        run: make test-load

  coverage-report:
    runs-on: ubuntu-latest
    needs: [unit-tests, component-tests, integration-tests]
    steps:
      - name: Generate Combined Coverage
        run: make coverage-report
      - name: Upload to CodeCov
        uses: codecov/codecov-action@v3
```

**Pipeline Duration**:
- Unit: ~5 min
- Component: ~10 min
- Contract: ~5 min
- Integration: ~10 min
- E2E: ~10 min
- **Total: ~40 minutes** (parallelized ~15 min)

---

## Coverage Strategy

### Coverage Targets

| Layer | Target | Critical Paths |
|-------|--------|----------------|
| Unit | 85% line, 75% branch | 90%+ |
| Component | 80% service boundaries | 85%+ |
| Integration | 70% workflows | 80%+ |
| Overall | 85% combined | 90%+ |

### Critical Paths (100% Coverage Required)

✅ Authentication and authorization
✅ Payment processing (if applicable)
✅ Data persistence and retrieval
✅ Security-sensitive operations
✅ Error handling and recovery

### Coverage Enforcement

**CI/CD Gates**:
- ❌ Block PR if coverage decreases
- ❌ Block PR if < 80% on changed lines
- ⚠️ Warn if < 85% overall

**CodeCov Configuration**:
```yaml
# .codecov.yml
coverage:
  status:
    project:
      default:
        target: 85%
        threshold: 1%
    patch:
      default:
        target: 80%
```

---

## Test Data Management

### Fixtures

**Location**: `tests/fixtures/`

**Types**:
- JSON files (API responses, widget configurations)
- SQL files (database seed data)
- Binary files (images, serialized objects)

**Guidelines**:
- Keep fixtures small (< 1KB each)
- Use factories for complex data
- Version fixtures with tests

### Test Data Factories

```python
# tests/shared/factories/widget_factory.py
class WidgetFactory:
    @staticmethod
    def create_button(label="Test Button", enabled=True):
        return {
            "type": "button",
            "label": label,
            "enabled": enabled,
            "id": uuid.uuid4()
        }
```

### Database Seeding

```sql
-- tests/fixtures/test_users.sql
INSERT INTO users (id, username, email) VALUES
  (1, 'test_user', 'test@example.com'),
  (2, 'admin_user', 'admin@example.com');
```

---

## Performance Benchmarks

### Acceptable Test Times

| Layer | Per Test | Suite Total |
|-------|----------|-------------|
| Unit | < 100ms | < 5 min |
| Component | 1-5s | < 10 min |
| Contract | 500ms-2s | < 5 min |
| Integration | 5-10s | < 10 min |
| E2E | 30s-2min | < 10 min |
| **Full Suite** | | **< 40 min** |

### Optimization Strategies

✅ Parallel test execution
✅ Cached Docker images
✅ Shared test database (transaction rollback)
✅ Lazy initialization of heavy objects
✅ Test sharding in CI/CD

---

## Maintenance & Evolution

### Test Health Metrics

**Track**:
- Flaky test rate (target: < 1%)
- Test execution time trends
- Coverage trends
- Test failure rate

**Review Cadence**:
- Weekly: Flaky test triage
- Monthly: Test suite optimization
- Quarterly: Framework upgrades

### Test Debt

**Identify**:
- Tests with `@skip` or `@xfail`
- Tests > 10 seconds (refactor or move layer)
- Flaky tests (fix or quarantine)

**Process**:
- Track in JIRA as "Test Debt"
- Allocate 10% sprint capacity to fixes
- Never skip tests without tracking

---

## Next Steps

1. ✅ Create directory structure
2. ⏳ Set up unit test frameworks
3. ⏳ Configure component test infrastructure
4. ⏳ Set up Pact Broker
5. ⏳ Create integration test harness
6. ⏳ Configure k6 load tests
7. ⏳ Integrate with CI/CD
8. ⏳ Document test framework

---

## References

- [GoogleTest Documentation](https://google.github.io/googletest/)
- [AUnit User Guide](https://libre.adacore.com/tools/aunit/)
- [Pact Documentation](https://docs.pact.io/)
- [k6 Documentation](https://k6.io/docs/)
- [Test Pyramid Martin Fowler](https://martinfowler.com/bliki/TestPyramid.html)

---

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
