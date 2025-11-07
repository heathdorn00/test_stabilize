# CI/CD Integration Guide

**Task**: 57fbde - Comprehensive Test Framework / RDB-002
**Purpose**: Automated testing pipeline for all test layers

---

## Overview

The CI/CD pipeline executes comprehensive test suites automatically on code changes, ensuring quality and preventing regressions.

**Workflows**:
- **Test Suite** - Unit, Component, Integration, E2E tests
- **Contract Testing** - Consumer-Driven Contracts with Pact
- **Mutation Testing** - Test quality validation (weekly)
- **Performance Baseline** - Performance regression detection

**Triggers**:
- Push to main/develop branches
- Pull requests
- Scheduled (weekly for mutation/trend reports)
- Manual dispatch

---

## Workflows

### 1. Test Suite (`test-suite.yml`)

**Purpose**: Run all test layers on every code change

**Triggers**:
- Push to `main`, `develop`
- Pull requests to `main`, `develop`
- Manual dispatch

**Jobs**:

**Unit Tests (C++ - GoogleTest)**:
- Matrix: 3 services × 2 compilers × 2 build types = 12 jobs
- Services: widget-core, platform-adapter, ui-renderer
- Compilers: g++-12, clang++-15
- Build types: Debug, Release
- Coverage: gcovr → Codecov
- Timeout: 10 minutes

**Unit Tests (Ada - AUnit)**:
- Matrix: 3 services
- Services: orb-core, message-handler, session-manager
- Coverage: gnatcov → Codecov
- Timeout: 10 minutes

**Component Tests**:
- Dependencies: PostgreSQL, Redis services
- Docker Compose: Build and start services
- Health checks: Wait for all services ready
- Coverage: Upload to Codecov
- Timeout: 20 minutes

**Integration Tests (Python - pytest)**:
- Dependencies: PostgreSQL, Redis services
- All microservices via Docker Compose
- Coverage: pytest-cov → Codecov
- JUnit XML output
- Timeout: 30 minutes

**E2E Tests (k6)**:
- Runs on main branch push only
- Production-like environment
- Load testing with k6
- Results: JSON output
- Timeout: 45 minutes

**Coverage Report**:
- Aggregates all coverage
- Enforces thresholds:
  - Unit: 80%
  - Component: 75%
  - Integration: 60%
  - Overall: 85%
- Comments PR with coverage report

**Test Summary**:
- Checks all job results
- Fails build if any test fails
- Provides summary

**Usage**:
```yaml
# Automatically runs on PR
# Manual trigger:
gh workflow run test-suite.yml

# With specific test layers:
gh workflow run test-suite.yml -f test_layers=unit,integration
```

---

### 2. Contract Testing (`contract-testing.yml`)

**Purpose**: Consumer-Driven Contract testing with Pact Broker

**Triggers**:
- Push to `main`, `develop`
- Pull requests
- Manual dispatch

**Jobs**:

**Start Pact Broker**:
- For PR builds only
- Starts local Pact Broker
- PostgreSQL backend
- Health check validation

**Consumer Tests**:
- Matrix: api_gateway
- Generates contract files (pacts)
- Publishes to Pact Broker
- Tags with git branch
- Uploads pact files as artifacts

**Can-I-Deploy (Consumer)**:
- Checks if consumer can be deployed
- Validates against provider versions
- Records deployment to test environment

**Provider Verification**:
- Matrix: widget-core, orb-core, security-service
- Starts provider service
- Verifies contracts from Pact Broker
- Publishes verification results
- Provider state handlers

**Can-I-Deploy (Provider)**:
- Checks if provider can be deployed
- Validates against consumer versions
- Records deployment to test environment

**Contract Test Summary**:
- Checks all results
- Comments PR with Pact Broker links
- Fails if any contracts fail

**Cleanup**:
- Stops Pact Broker (PR builds)

**Environment Variables**:
```yaml
PACT_BROKER_URL: ${{ secrets.PACT_BROKER_URL }}
PACT_BROKER_USERNAME: ${{ secrets.PACT_BROKER_USERNAME }}
PACT_BROKER_PASSWORD: ${{ secrets.PACT_BROKER_PASSWORD }}
```

**Usage**:
```yaml
# Automatically runs on PR
# Manual trigger:
gh workflow run contract-testing.yml
```

---

### 3. Mutation Testing (`mutation-testing.yml`)

**Purpose**: Validate test quality through mutation analysis

**Triggers**:
- **Scheduled**: Every Sunday at 2 AM UTC (cost-effective, low noise)
- Manual dispatch with options

**Jobs**:

**Stryker (TypeScript)**:
- Contract tests mutation testing
- Reporters: HTML, JSON, clear-text, dashboard
- Threshold check: 70% default
- Comments PR with results
- Timeout: 60 minutes

**Mull (C++)**:
- Matrix: widget-core, platform-adapter, ui-renderer
- Component/unit tests mutation
- Reports: JSON, HTML
- Threshold check: 70% default
- Timeout: 90 minutes

**mutmut (Python)**:
- Integration tests mutation
- Dependencies: PostgreSQL, Redis, all services
- Parallel execution (4 workers)
- HTML report generation
- Threshold check: 70% default
- Timeout: 60 minutes

**Mutation Testing Summary**:
- Downloads all reports
- Generates summary markdown
- Uploads summary
- Creates GitHub issue on failure (scheduled runs)

**Manual Trigger Options**:
```yaml
# Tools to run
tools: stryker,mull,mutmut

# Mutation score threshold
threshold: 70
```

**Usage**:
```bash
# Manual trigger with custom threshold
gh workflow run mutation-testing.yml -f threshold=75 -f tools=stryker
```

---

### 4. Performance Baseline (`performance-baseline.yml`)

**Purpose**: Capture and compare performance baselines, detect regressions

**Triggers**:
- Push to `main`
- Pull requests to `main`
- **Scheduled**: Weekly on Sunday midnight UTC
- Manual dispatch with options

**Jobs**:

**Capture Baseline**:
- Dependencies: PostgreSQL, Redis
- Starts all services in production mode
- Health checks for all services
- Runs baseline capture script
- Duration: 300 seconds (5 minutes)
- Target RPS: 10
- Uploads baseline snapshot
- Timeout: 30 minutes

**Compare Baseline**:
- Downloads current baseline
- Fetches official baseline from main
- Compares metrics
- Regression threshold: 10%
- Uploads comparison report
- Comments PR with results
- Fails on critical regressions

**Store Baseline (Main Only)**:
- Stores baseline with version
- Updates official baseline
- Keeps last 30 baselines
- Commits to repository
- Optional: Upload to S3

**Trend Report (Weekly)**:
- Generates trend visualization
- Matplotlib/pandas charts
- Creates GitHub issue with report
- Tracks long-term trends

**Performance Summary**:
- Checks all results
- Reports success/failure

**Manual Trigger Options**:
```yaml
# Capture duration (seconds)
duration: 300

# Target RPS
rps: 10

# Services to test
services: all
```

**Usage**:
```bash
# Manual trigger with custom duration
gh workflow run performance-baseline.yml -f duration=600 -f rps=20
```

---

## Secrets Configuration

### Required Secrets

Add these secrets in GitHub repository settings:

```
CODECOV_TOKEN           # Codecov integration token
PACT_BROKER_URL         # Pact Broker URL (production)
PACT_BROKER_USERNAME    # Pact Broker username
PACT_BROKER_PASSWORD    # Pact Broker password
STRYKER_DASHBOARD_API_KEY # Stryker Dashboard token (optional)
AWS_S3_BUCKET           # S3 bucket for baseline storage (optional)
AWS_ACCESS_KEY_ID       # AWS credentials (optional)
AWS_SECRET_ACCESS_KEY   # AWS credentials (optional)
```

### Setting Secrets

**GitHub UI**:
1. Go to repository Settings
2. Navigate to Secrets → Actions
3. Click "New repository secret"
4. Add name and value

**GitHub CLI**:
```bash
gh secret set CODECOV_TOKEN
gh secret set PACT_BROKER_URL
gh secret set PACT_BROKER_USERNAME
gh secret set PACT_BROKER_PASSWORD
```

---

## Coverage Gates

### Threshold Enforcement

**Environment Variables** (test-suite.yml):
```yaml
COVERAGE_THRESHOLD_UNIT: 80
COVERAGE_THRESHOLD_COMPONENT: 75
COVERAGE_THRESHOLD_INTEGRATION: 60
COVERAGE_THRESHOLD_OVERALL: 85
```

### Codecov Configuration

**File**: `tests/.codecov.yml`

```yaml
coverage:
  status:
    project:
      default:
        target: 85%
        threshold: 1%
    patch:
      default:
        target: 80%

flags:
  unit:
    paths:
      - services/
  component:
    paths:
      - services/
  integration:
    paths:
      - tests/integration/

comment:
  layout: "reach,diff,flags,files,footer"
  behavior: default
  require_changes: false
```

---

## Test Execution Matrix

### Unit Tests Matrix

```yaml
strategy:
  matrix:
    service: [widget-core, platform-adapter, ui-renderer]
    compiler: [g++-12, clang++-15]
    build_type: [Debug, Release]
```

**Total**: 3 services × 2 compilers × 2 build types = **12 jobs**

### OS Matrix (Optional)

```yaml
strategy:
  matrix:
    os: [ubuntu-latest, macos-latest, windows-latest]
    service: [widget-core]
```

**Note**: Currently only Ubuntu is used for CI due to dependencies

---

## Branch Protection Rules

### Recommended Settings

**Main Branch**:
- Require pull request reviews (1+ approvals)
- Require status checks to pass:
  - ✅ Unit Tests (C++)
  - ✅ Unit Tests (Ada)
  - ✅ Component Tests
  - ✅ Integration Tests
  - ✅ Coverage Report
  - ✅ Contract Tests
  - ✅ Performance Baseline (if changed services)
- Require branches to be up to date
- Enforce for administrators

**Develop Branch**:
- Require status checks to pass:
  - ✅ Unit Tests
  - ✅ Component Tests
  - ✅ Integration Tests

### Setting Branch Protection

**GitHub UI**:
1. Go to Settings → Branches
2. Add branch protection rule
3. Select branch pattern: `main`
4. Enable required checks
5. Save changes

**GitHub CLI**:
```bash
gh api repos/:owner/:repo/branches/main/protection -X PUT \
  -f required_status_checks[strict]=true \
  -f required_status_checks[contexts][]=unit-tests-cpp \
  -f required_status_checks[contexts][]=component-tests \
  -f required_pull_request_reviews[required_approving_review_count]=1
```

---

## Caching Strategy

### Dependencies

**Node.js (npm)**:
```yaml
- uses: actions/setup-node@v4
  with:
    node-version: '18'
    cache: 'npm'
    cache-dependency-path: package-lock.json
```

**Python (pip)**:
```yaml
- uses: actions/setup-python@v5
  with:
    python-version: '3.11'
    cache: 'pip'
```

**C++ (ccache)**:
```yaml
- uses: actions/cache@v3
  with:
    path: ~/.cache/ccache
    key: ${{ runner.os }}-ccache-${{ hashFiles('**/CMakeLists.txt') }}
```

### Docker Images

```yaml
- uses: docker/setup-buildx-action@v2

- uses: docker/build-push-action@v4
  with:
    cache-from: type=gha
    cache-to: type=gha,mode=max
```

---

## Notifications

### Slack Integration

**Add to workflows**:
```yaml
- name: Notify Slack
  if: failure()
  uses: slackapi/slack-github-action@v1
  with:
    payload: |
      {
        "text": "❌ ${{ github.workflow }} failed",
        "blocks": [
          {
            "type": "section",
            "text": {
              "type": "mrkdwn",
              "text": "*Workflow*: ${{ github.workflow }}\n*Branch*: ${{ github.ref }}\n*Commit*: ${{ github.sha }}"
            }
          }
        ]
      }
  env:
    SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK_URL }}
```

### Email Notifications

**GitHub Actions default**: Email sent on workflow failure to workflow triggerer

---

## Performance Optimization

### Parallel Execution

**Unit tests**: 12 jobs in parallel (matrix)
**Integration tests**: Sequential (shared dependencies)
**Mutation tests**: Parallel within each tool (workers)

### Timeouts

```yaml
timeout-minutes: 10  # Unit tests
timeout-minutes: 20  # Component tests
timeout-minutes: 30  # Integration tests
timeout-minutes: 60  # Mutation tests
```

### Fail-Fast Strategy

```yaml
strategy:
  fail-fast: false  # Continue other matrix jobs on failure
```

---

## Troubleshooting

### Workflow Fails with Timeout

**Solution**:
- Increase `timeout-minutes`
- Check for hanging tests
- Review service startup times

### Flaky Tests

**Solution**:
- Identify flaky tests: `pytest --lf --ff`
- Add retries: `pytest --reruns 3`
- Fix race conditions
- Add proper waits

### Coverage Not Uploading

**Solution**:
- Check `CODECOV_TOKEN` secret
- Verify coverage report generation
- Review Codecov upload logs

### Docker Service Not Ready

**Solution**:
```yaml
- name: Wait for service
  run: |
    timeout 60 sh -c 'until curl -f http://localhost:8080/health; do sleep 2; done'
```

---

## Metrics and Monitoring

### Workflow Metrics

Track in GitHub Actions:
- **Workflow duration**: Target <15 minutes for PR checks
- **Success rate**: Target >95%
- **Flaky test rate**: Target <1%

### Coverage Trends

Monitor in Codecov:
- Overall coverage trend
- Per-service coverage
- Pull request coverage delta

### Performance Trends

Track in performance baselines:
- P95/P99 latency trends
- Throughput trends
- Memory usage trends

---

## Cost Optimization

### GitHub Actions Minutes

**Free tier**: 2,000 minutes/month
**Current usage estimate**:
- Test Suite (PR): ~30 minutes × 50 PRs/month = 1,500 minutes
- Contract Testing (PR): ~15 minutes × 50 PRs/month = 750 minutes
- Mutation Testing (weekly): ~180 minutes × 4 = 720 minutes
- Performance Baseline (weekly): ~30 minutes × 4 = 120 minutes

**Total**: ~3,090 minutes/month

**Optimization**:
- Run mutation tests monthly instead of weekly: -540 minutes
- Run E2E tests only on main push: -100 minutes
- Reduced matrix for PRs: -300 minutes

**Optimized total**: ~2,150 minutes/month (within free tier)

---

## References

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Codecov Documentation](https://docs.codecov.com/)
- [Pact Broker CI/CD](https://docs.pact.io/pact_broker/docker_images)
- [k6 Cloud](https://k6.io/docs/cloud/)

---

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
