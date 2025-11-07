# Layer 3: Contract Tests (Consumer-Driven Contracts with Pact)

**Task**: 57fbde - Comprehensive Test Framework
**Layer**: 3 - Contract Tests (10% coverage target)

---

## Overview

Contract tests validate **service-to-service communication** using Consumer-Driven Contracts (CDC). Pact enables independent service development while ensuring API compatibility.

**Coverage Target**: ~100 tests (10% of test pyramid)
**Execution Time**: ~5 minutes
**Runtime**: TypeScript/Jest with Pact Foundation library

---

## Architecture

### Consumer-Driven Contract (CDC) Pattern

```
┌─────────────────┐                    ┌──────────────────┐
│  Consumer       │                    │   Provider       │
│  (API Gateway)  │                    │  (Widget Core)   │
└────────┬────────┘                    └────────┬─────────┘
         │                                      │
         │ 1. Define Contract                   │
         │    (expectations)                    │
         ├──────────────────────────────────────┤
         │                                      │
         │ 2. Publish to Pact Broker            │
         ├─────────────►                        │
         │            Pact Broker               │
         │            (PostgreSQL)              │
         │            http://localhost:9292     │
         │                  ◄───────────────────┤
         │                                      │
         │                  3. Verify Contract  │
         │                     (provider tests) │
         │                                      │
         │ 4. Can-I-Deploy Check                │
         ├──────────────────────────────────────┤
         │                                      │
         │ 5. Safe Deployment ✓                 │
         └──────────────────────────────────────┘
```

### Key Concepts

**Consumer**: Service that makes API calls
**Provider**: Service that responds to API calls
**Contract**: Expectation of how provider should respond
**Pact Broker**: Central repository for contracts
**Can-I-Deploy**: Pre-deployment safety check

---

## Quick Start

### 1. Start Pact Broker

```bash
# Start Pact Broker with PostgreSQL
docker-compose -f docker-compose.pact-broker.yml up -d

# Verify Pact Broker is running
curl http://localhost:9292
# Or visit http://localhost:9292 in browser
# Login: pactbroker / pactbroker
```

### 2. Run Consumer Tests

```bash
# Navigate to consumer directory
cd consumers/api_gateway

# Install dependencies
npm install

# Run Pact consumer tests (generates contracts)
npm test

# Verify contracts generated
ls -la pacts/
# Should see: APIGateway-WidgetCore-pact.json
```

### 3. Publish Contracts

```bash
# Publish to local Pact Broker
npm run pact:publish:local

# Verify in Pact Broker UI
# Visit: http://localhost:9292/ui/relationships
```

### 4. Run Provider Verification

```bash
# Ensure provider service is running
# Widget Core should be at http://localhost:8081

# Navigate to provider directory
cd ../../providers/widget-core

# Install dependencies
npm install

# Run provider verification tests
npm test

# Results published to Pact Broker automatically
```

### 5. Can-I-Deploy Check

```bash
# Check if consumer can be safely deployed
cd ../../consumers/api_gateway
npm run pact:can-i-deploy:local

# Output:
# Computer says yes \o/
# Can deploy APIGateway version abc123 to test
```

---

## Contract Test Files

### Consumers (API Gateway)

| File | Provider | Tests | Description |
|------|----------|-------|-------------|
| `consumers/api_gateway/widget_core.pact.spec.ts` | Widget Core | 8 tests | Widget CRUD operations |
| `consumers/api_gateway/security_service.pact.spec.ts` | Security Service | 10 tests | Authentication & authorization |
| `consumers/api_gateway/orb_core.pact.spec.ts` | ORB Core | 9 tests | CORBA/ORB operations & metrics |
| **Total** | | **27 tests** | |

### Providers

| File | Consumer | Description |
|------|----------|-------------|
| `providers/widget-core/pact-verification.test.ts` | API Gateway | Verifies Widget Core satisfies contracts |
| `providers/security-service/pact-verification.test.ts` | API Gateway | Verifies Security Service satisfies contracts |
| `providers/orb-core/pact-verification.test.ts` | API Gateway | Verifies ORB Core satisfies contracts |

---

## Consumer Tests (API Gateway)

### Widget Core Contract (`widget_core.pact.spec.ts`)

**Tests**:
1. Create widget with valid data
2. Retrieve widget by ID
3. Update widget
4. Delete widget
5. List all widgets
6. Return 404 for non-existent widget
7. Handle invalid widget data
8. Paginate widget list

**Example Test**:
```typescript
it('should create a new widget', async () => {
  await provider.addInteraction({
    state: 'widget core is available',
    uponReceiving: 'a request to create a widget',
    withRequest: {
      method: 'POST',
      path: '/api/v1/widgets',
      headers: {
        'Content-Type': 'application/json',
      },
      body: {
        type: 'button',
        label: 'Click Me',
        width: 100,
        height: 50,
      },
    },
    willRespondWith: {
      status: 201,
      headers: {
        'Content-Type': 'application/json',
      },
      body: {
        id: like(123),
        type: 'button',
        label: 'Click Me',
        width: 100,
        height: 50,
        createdAt: like('2024-01-15T10:30:00Z'),
      },
    },
  });

  const response = await axios.post('http://localhost:8080/api/v1/widgets', {
    type: 'button',
    label: 'Click Me',
    width: 100,
    height: 50,
  });

  expect(response.status).toBe(201);
  expect(response.data.id).toBeDefined();
});
```

### Security Service Contract (`security_service.pact.spec.ts`)

**Tests**:
1. Authenticate user and return JWT token
2. Reject invalid credentials
3. Validate JWT token and return user info
4. Reject expired token
5. Register new user
6. Reject registration with existing email
7. Check user permissions for resource access
8. Deny access when user lacks permissions
9. Refresh JWT token
10. Logout user

**Key Contracts**:
- `POST /api/v1/auth/login` - User authentication
- `POST /api/v1/auth/validate` - Token validation
- `POST /api/v1/auth/register` - User registration
- `POST /api/v1/auth/authorize` - Permission checks

### ORB Core Contract (`orb_core.pact.spec.ts`)

**Tests**:
1. Return ORB health status
2. Return unhealthy status when degraded
3. Return connection pool status
4. Create CORBA object reference
5. Retrieve CORBA object reference by ID
6. Return 404 for non-existent object
7. Delete CORBA object reference
8. Return memory deallocation metrics (Phase 1)
9. Return ORB performance metrics

**Phase 1 Validation**:
```typescript
it('should return memory deallocation metrics', async () => {
  await provider.addInteraction({
    state: 'orb core has processed 1523 deallocations',
    uponReceiving: 'a request for deallocation metrics',
    withRequest: {
      method: 'GET',
      path: '/api/v1/metrics/deallocations',
    },
    willRespondWith: {
      status: 200,
      body: {
        total: like(1523),           // Total deallocations
        critical: like(45),           // Critical deallocations (memory zeroization)
        byType: {
          Buffer: like(856),
          Reference: like(312),
          Servant: like(310),
          Critical: like(45),
        },
      },
    },
  });
});
```

---

## Provider Verification

### Widget Core Provider (`pact-verification.test.ts`)

**State Handlers**:
```typescript
stateHandlers: {
  'widget core is available': async () => {
    // Ensure service is running and healthy
    return Promise.resolve();
  },

  'a widget with ID 123 exists': async () => {
    // Setup: Create widget with ID 123
    console.log('Setting up provider state: widget with ID 123 exists');
    await createTestWidget({ id: 123, type: 'button', label: 'Test' });
    return Promise.resolve();
  },

  'no widgets exist': async () => {
    // Setup: Clean database
    console.log('Setting up provider state: no widgets exist');
    await clearWidgets();
    return Promise.resolve();
  },
}
```

**Request Filters**:
```typescript
requestFilter: (req, res, next) => {
  // Add authentication headers
  req.headers['X-API-Key'] = 'test-api-key';
  // Or JWT token
  req.headers['Authorization'] = 'Bearer test-token';
  next();
}
```

**Consumer Version Selectors**:
```typescript
consumerVersionSelectors: [
  { mainBranch: true },              // Latest from main branch
  { deployed: 'production' },         // Latest in production
  { deployed: 'staging' },            // Latest in staging
  { deployedOrReleased: true },       // All deployed versions
]
```

---

## Pact Broker

### Docker Compose Setup

**File**: `docker-compose.pact-broker.yml`

**Services**:
- **PostgreSQL** (port 5432) - Pact Broker database
- **Pact Broker** (port 9292) - Contract repository

**Access**:
- URL: http://localhost:9292
- Username: `pactbroker`
- Password: `pactbroker`

**Deployment**:
```bash
# Start
docker-compose -f docker-compose.pact-broker.yml up -d

# Health check
curl http://localhost:9292/diagnostic/status/heartbeat

# Stop
docker-compose -f docker-compose.pact-broker.yml down

# Clean up (including data)
docker-compose -f docker-compose.pact-broker.yml down -v
```

### Pact Broker UI

**Relationships View**:
- URL: http://localhost:9292/ui/relationships
- Shows consumer-provider relationships
- Displays verification status
- Shows contract versions

**Contract View**:
- URL: http://localhost:9292/pacts/provider/{provider}/consumer/{consumer}/latest
- Shows contract details
- Lists interactions
- Displays verification results

### API Endpoints

```bash
# Health Check
GET http://localhost:9292/diagnostic/status/heartbeat

# List Contracts
GET http://localhost:9292/pacts

# Publish Contract
PUT http://localhost:9292/pacts/provider/{provider}/consumer/{consumer}/version/{version}

# Verify Contract
POST http://localhost:9292/pacts/provider/{provider}/verification-results

# Can I Deploy
GET http://localhost:9292/matrix?q[][pacticipant]={consumer}&q[][version]={version}
```

---

## NPM Scripts

### Consumer Scripts (`consumers/api_gateway/package.json`)

```json
{
  "scripts": {
    "test": "jest --testMatch='**/*.pact.spec.ts'",
    "test:watch": "jest --watch --testMatch='**/*.pact.spec.ts'",

    "pact:publish:local": "pact-broker publish ./pacts --consumer-app-version=$(git rev-parse --short HEAD) --broker-base-url=http://localhost:9292 --broker-username=pactbroker --broker-password=pactbroker --tag=local",

    "pact:publish:ci": "pact-broker publish ./pacts --consumer-app-version=$CI_COMMIT_SHA --broker-base-url=$PACT_BROKER_URL --broker-username=$PACT_BROKER_USERNAME --broker-password=$PACT_BROKER_PASSWORD --tag=$CI_BRANCH",

    "pact:can-i-deploy:local": "pact-broker can-i-deploy --pacticipant=APIGateway --version=$(git rev-parse --short HEAD) --to-environment=test --broker-base-url=http://localhost:9292 --broker-username=pactbroker --broker-password=pactbroker",

    "pact:create-version-tag": "pact-broker create-version-tag --pacticipant=APIGateway --version=$CONSUMER_VERSION --tag=$TAG --broker-base-url=$PACT_BROKER_URL",

    "pact:record-deployment": "pact-broker record-deployment --pacticipant=APIGateway --version=$CONSUMER_VERSION --environment=$ENVIRONMENT --broker-base-url=$PACT_BROKER_URL"
  }
}
```

---

## Workflow

### Local Development

**1. Consumer Development**:
```bash
# Write consumer test
cd consumers/api_gateway
npm test -- widget_core.pact.spec.ts

# Publish contract
npm run pact:publish:local

# Verify in browser
open http://localhost:9292/ui/relationships
```

**2. Provider Development**:
```bash
# Ensure provider service is running
docker-compose up widget-core

# Run provider verification
cd providers/widget-core
npm test

# Check verification results
open http://localhost:9292/ui/relationships
```

**3. Safe Deployment Check**:
```bash
# Before deploying consumer
cd consumers/api_gateway
npm run pact:can-i-deploy:local

# If output is "Computer says yes", safe to deploy
```

### CI/CD Integration

**Consumer Pipeline**:
```yaml
# .github/workflows/consumer-ci.yml
- name: Run Pact Tests
  run: |
    cd consumers/api_gateway
    npm test

- name: Publish Pact Contracts
  run: |
    npm run pact:publish:ci
  env:
    CI_COMMIT_SHA: ${{ github.sha }}
    CI_BRANCH: ${{ github.ref_name }}
    PACT_BROKER_URL: https://pact-broker.example.com
    PACT_BROKER_USERNAME: ${{ secrets.PACT_BROKER_USERNAME }}
    PACT_BROKER_PASSWORD: ${{ secrets.PACT_BROKER_PASSWORD }}

- name: Can I Deploy Check
  run: |
    npm run pact:can-i-deploy
  env:
    CONSUMER_VERSION: ${{ github.sha }}
```

**Provider Pipeline**:
```yaml
# .github/workflows/provider-ci.yml
- name: Start Provider Service
  run: |
    docker-compose up -d widget-core

- name: Run Pact Verification
  run: |
    cd providers/widget-core
    npm test
  env:
    PROVIDER_URL: http://localhost:8081
    PROVIDER_VERSION: ${{ github.sha }}
    PACT_BROKER_URL: https://pact-broker.example.com
    GIT_BRANCH: ${{ github.ref_name }}
```

---

## Provider States

Provider states set up test data for verification.

### Common States

| State | Description | Setup Action |
|-------|-------------|--------------|
| `widget core is available` | Service is healthy | No action (default) |
| `a widget with ID 123 exists` | Widget 123 in database | Create widget 123 |
| `no widgets exist` | Empty database | Clear widgets table |
| `widget with ID 123 does not exist` | Widget 123 absent | Delete widget 123 |
| `user with email test@example.com exists` | Test user in system | Create user |
| `valid JWT token exists` | Valid auth token | Generate token |
| `orb core is healthy` | ORB service running | Health check pass |
| `CORBA object widget-123 exists` | CORBA reference exists | Create object ref |

### Implementing States

**Provider Side** (`pact-verification.test.ts`):
```typescript
stateHandlers: {
  'a widget with ID 123 exists': async () => {
    // Create widget in test database
    await db.widgets.create({
      id: 123,
      type: 'button',
      label: 'Test Widget',
      width: 100,
      height: 50,
    });
  },

  'no widgets exist': async () => {
    // Clear widgets table
    await db.widgets.truncate();
  },
}
```

---

## Pact Matchers

Pact matchers allow flexible contract matching.

### Type Matchers

```typescript
import { like, eachLike, term } from '@pact-foundation/pact/src/dsl/matchers';

// Match type, not value
like(123)           // Any number
like('string')      // Any string
like(true)          // Any boolean

// Match array of specific type
eachLike({ id: 1, name: 'Widget' })  // Array of objects with id and name

// Match regex pattern
term({
  matcher: 'Bearer [A-Za-z0-9\\-._~+/]+=*',
  generate: 'Bearer eyJhbGc...',
})
```

### Example

```typescript
willRespondWith: {
  status: 200,
  body: {
    id: like(123),                    // Any number
    type: 'button',                   // Exact match
    label: like('Click Me'),          // Any string
    createdAt: like('2024-01-15T10:30:00Z'),  // Any ISO date
    tags: eachLike('interactive'),    // Array of strings
  },
}
```

---

## Troubleshooting

### Pact Broker Not Running

**Error**: `Connection refused to localhost:9292`

**Solution**:
```bash
# Check Pact Broker status
docker-compose -f docker-compose.pact-broker.yml ps

# Restart Pact Broker
docker-compose -f docker-compose.pact-broker.yml restart

# View logs
docker-compose -f docker-compose.pact-broker.yml logs pact-broker
```

### Contract Publishing Fails

**Error**: `401 Unauthorized`

**Solution**:
```bash
# Check credentials in package.json
# Default: pactbroker / pactbroker

# Verify Pact Broker is accessible
curl -u pactbroker:pactbroker http://localhost:9292
```

### Provider Verification Fails

**Error**: `Pact verification failed - Expected 200, got 500`

**Solution**:
```bash
# Ensure provider service is running
curl http://localhost:8081/health

# Check provider state handlers are implemented
# Review logs for setup errors

# Run verification with debug logging
npm test -- --logLevel=debug
```

### Can-I-Deploy Reports "No"

**Error**: `Computer says no ✘`

**Solution**:
```bash
# Check verification status in Pact Broker
open http://localhost:9292/ui/relationships

# Ensure provider has verified latest contract
cd providers/widget-core
npm test

# Check verification results
curl http://localhost:9292/matrix?q[][pacticipant]=APIGateway&q[][version]=abc123
```

---

## Best Practices

### 1. Consumer-Driven

Consumers define contracts based on their needs, not provider capabilities.

**Good**:
```typescript
// Consumer only requests what it needs
body: {
  id: like(123),
  label: like('Widget'),
}
```

**Bad**:
```typescript
// Consumer mirrors entire provider response
body: {
  id: like(123),
  label: like('Widget'),
  internalStatus: like('active'),
  debugInfo: like({}),
  // ... 20 more fields consumer doesn't use
}
```

### 2. Minimal Contracts

Only validate fields the consumer actually uses.

### 3. Provider States

Always implement provider states for repeatable verification.

```typescript
// Good: Deterministic state setup
'a widget with ID 123 exists': async () => {
  await db.widgets.upsert({ id: 123, ... });
}

// Bad: Assumes state exists
'a widget with ID 123 exists': async () => {
  // No setup - relies on pre-existing data
}
```

### 4. Version Tags

Tag contracts by environment:

```bash
# Local development
--tag=local

# CI builds
--tag=main --tag=pr-123

# Deployments
--tag=staging --tag=production
```

### 5. Can-I-Deploy Checks

Always run before deploying to production:

```bash
# CI/CD pipeline
npm run pact:can-i-deploy
if [ $? -ne 0 ]; then
  echo "Cannot deploy - contract verification failed"
  exit 1
fi
```

---

## Coverage Targets

**Layer 3 Target**: 10% of total tests (~100 tests)

**Current Coverage**:
- API Gateway → Widget Core: 8 tests ✅
- API Gateway → Security Service: 10 tests ✅
- API Gateway → ORB Core: 9 tests ✅
- **Total**: 27 tests (27% of target)

**Remaining**: ~73 tests to reach target

**Priority Areas**:
1. Additional service pairs (Widget Core → Platform Adapters)
2. Error scenarios and edge cases
3. Advanced ORB operations
4. Multi-step workflows
5. Performance-critical paths

---

## References

- [Pact Documentation](https://docs.pact.io/)
- [Pact Foundation GitHub](https://github.com/pact-foundation)
- [Consumer-Driven Contracts](https://martinfowler.com/articles/consumerDrivenContracts.html)
- [Pact Broker](https://github.com/pact-foundation/pact_broker)
- [Pact Matcher DSL](https://github.com/pact-foundation/pact-js-dsl)

---

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
