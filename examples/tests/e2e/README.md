# Layer 5: End-to-End (E2E) Tests

## Overview

End-to-end tests verify complete user workflows through the entire system, from UI interaction to backend processing and data persistence. These are the highest-level tests in the pyramid.

## Purpose

E2E tests validate:
- Complete user journeys
- Cross-service workflows
- Real browser/UI interactions
- Database persistence
- Network communication
- System-level behavior

## Scope

E2E tests cover:
- Full application startup and initialization
- User interactions (clicks, keyboard, mouse)
- Visual rendering verification
- Data flow through all services
- Error handling at system level
- Performance under realistic conditions

## Test Framework Selection

### Browser-Based Tests
- **Playwright** - Primary framework for UI testing
- **Puppeteer** - Alternative for Chromium-only tests
- Headless mode for CI/CD
- Screenshot/video capture on failures

### System-Level Tests
- **Jest** for test orchestration
- **Docker Compose** for service deployment
- Real database instances
- Real ORB middleware

## Directory Structure

```
tests/e2e/
├── README.md (this file)
├── user-workflows/
│   ├── widget-creation.e2e.spec.ts
│   ├── widget-interaction.e2e.spec.ts
│   └── widget-lifecycle.e2e.spec.ts
├── cross-service/
│   ├── state-synchronization.e2e.spec.ts
│   └── event-propagation.e2e.spec.ts
├── performance/
│   ├── rendering-performance.e2e.spec.ts
│   └── bulk-operations.e2e.spec.ts
└── fixtures/
    ├── test-data.json
    └── screenshots/
```

## E2E Test Strategy

### 1. Test Environment Setup

Each E2E test requires:
- All services running (Widget Core, UI Renderer, State Manager, etc.)
- Database initialized with schema
- ORB middleware configured
- Test UI application launched

### 2. Test Isolation

- Each test gets fresh environment
- Database cleared between tests
- Services restarted if needed
- No shared state between tests

### 3. Realistic Scenarios

Focus on real user workflows:
- Creating widgets through UI
- Dragging and resizing widgets
- Widget interactions (clicks, hover)
- Multi-step workflows
- Error recovery

## Example: Widget Creation E2E Test

```typescript
describe('Widget Creation E2E', () => {
  let page: Page;

  beforeAll(async () => {
    page = await browser.newPage();
    await page.goto('http://localhost:3000');
  });

  it('should create button widget through UI', async () => {
    // Step 1: Navigate to widget creation
    await page.click('#create-widget-button');
    await page.waitForSelector('#widget-type-selector');

    // Step 2: Select widget type
    await page.selectOption('#widget-type-selector', 'button');

    // Step 3: Fill properties
    await page.fill('#widget-label', 'Click Me');
    await page.fill('#widget-width', '100');
    await page.fill('#widget-height', '50');

    // Step 4: Submit
    await page.click('#create-button');

    // Step 5: Verify widget rendered
    await page.waitForSelector('.widget-button');
    const widget = await page.$('.widget-button');
    expect(widget).toBeDefined();

    // Step 6: Verify widget properties
    const label = await page.textContent('.widget-button');
    expect(label).toBe('Click Me');

    // Step 7: Verify in database (via API)
    const response = await page.request.get('http://localhost:8080/api/v1/widgets');
    const widgets = await response.json();
    expect(widgets).toHaveLength(1);
    expect(widgets[0].label).toBe('Click Me');
  });
});
```

## Coverage Targets

### Overall Target: 50 tests (5% of total)

E2E tests focus on critical paths and common workflows.

### Test Distribution

| Category | Tests | Description |
|----------|-------|-------------|
| User Workflows | 20 | Widget creation, interaction, lifecycle |
| Cross-Service | 15 | State sync, event propagation |
| Performance | 10 | Rendering, bulk operations |
| Error Handling | 5 | System-level error recovery |
| **Total** | **50** | |

## E2E Test Patterns

### Pattern 1: User Journey Testing

Test complete user workflows:

```typescript
it('should create, modify, and delete widget', async () => {
  // Create
  await page.click('#create-widget');
  await page.selectOption('#type', 'button');
  await page.fill('#label', 'Test Button');
  await page.click('#submit');

  // Verify created
  await page.waitForSelector('.widget[data-label="Test Button"]');

  // Modify
  await page.click('.widget[data-label="Test Button"]');
  await page.click('#edit-button');
  await page.fill('#label', 'Updated Button');
  await page.click('#save');

  // Verify modified
  const updated = await page.textContent('.widget');
  expect(updated).toBe('Updated Button');

  // Delete
  await page.click('.widget');
  await page.click('#delete-button');
  await page.click('#confirm-delete');

  // Verify deleted
  const widgets = await page.$$('.widget');
  expect(widgets).toHaveLength(0);
});
```

### Pattern 2: Visual Verification

Use screenshots for visual regression:

```typescript
it('should render widget correctly', async () => {
  await page.click('#create-widget');
  await page.selectOption('#type', 'button');
  await page.click('#submit');

  // Wait for render
  await page.waitForSelector('.widget-button');

  // Take screenshot
  const screenshot = await page.screenshot();

  // Compare with baseline
  expect(screenshot).toMatchImageSnapshot({
    threshold: 0.01,
  });
});
```

### Pattern 3: Performance Measurement

Measure real-world performance:

```typescript
it('should render 100 widgets within time limit', async () => {
  const startTime = Date.now();

  // Create 100 widgets
  for (let i = 0; i < 100; i++) {
    await page.evaluate((index) => {
      window.createWidget({ type: 'button', label: `Button ${index}` });
    }, i);
  }

  // Wait for all to render
  await page.waitForFunction(() => {
    return document.querySelectorAll('.widget').length === 100;
  });

  const duration = Date.now() - startTime;

  // Should complete within 10 seconds
  expect(duration).toBeLessThan(10000);

  // Measure FPS
  const fps = await page.evaluate(() => {
    return (window as any).measureFPS();
  });

  expect(fps).toBeGreaterThan(30);
});
```

### Pattern 4: Error Recovery Testing

Test system recovery from errors:

```typescript
it('should recover from service failure', async () => {
  // Create widget
  await page.click('#create-widget');
  await page.click('#submit');
  await page.waitForSelector('.widget');

  // Simulate service failure
  await fetch('http://localhost:8080/test/simulate-failure', {
    method: 'POST',
    body: JSON.stringify({ service: 'state-manager', duration: 5000 }),
  });

  // Attempt widget update (should fail gracefully)
  await page.click('.widget');
  await page.click('#edit-button');
  await page.fill('#label', 'Updated');
  await page.click('#save');

  // Verify error message shown
  await page.waitForSelector('.error-message');
  const error = await page.textContent('.error-message');
  expect(error).toContain('temporarily unavailable');

  // Wait for service recovery
  await page.waitForTimeout(6000);

  // Retry should succeed
  await page.click('#retry-button');
  await page.waitForSelector('.success-message');
});
```

## Test Data Management

### Fixtures

Use fixtures for consistent test data:

```typescript
const widgetFixtures = {
  button: {
    type: 'button',
    label: 'Test Button',
    width: 100,
    height: 50,
  },
  label: {
    type: 'label',
    label: 'Test Label',
    width: 200,
    height: 30,
  },
};

it('should create button from fixture', async () => {
  await createWidgetFromFixture(page, widgetFixtures.button);
  // ...
});
```

### Database Seeding

Seed database for specific scenarios:

```typescript
beforeEach(async () => {
  // Clear database
  await database.clear();

  // Seed with test data
  await database.seed({
    widgets: [
      { id: 'widget-1', type: 'button', label: 'Button 1' },
      { id: 'widget-2', type: 'label', label: 'Label 1' },
    ],
  });
});
```

## CI/CD Integration

### Docker Compose Setup

```yaml
version: '3.8'
services:
  widget-core:
    image: widget-core:test
    environment:
      - DATABASE_URL=postgresql://test:test@db:5432/test

  state-manager:
    image: state-manager:test
    environment:
      - DATABASE_URL=postgresql://test:test@db:5432/test

  ui-renderer:
    image: ui-renderer:test

  db:
    image: postgres:14
    environment:
      - POSTGRES_DB=test
      - POSTGRES_USER=test
      - POSTGRES_PASSWORD=test
```

### Playwright Configuration

```typescript
// playwright.config.ts
export default {
  testDir: './tests/e2e',
  timeout: 60000,
  retries: 2,
  use: {
    baseURL: 'http://localhost:3000',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { browserName: 'chromium' },
    },
    {
      name: 'firefox',
      use: { browserName: 'firefox' },
    },
  ],
};
```

### Run Commands

```bash
# Start services
docker-compose -f docker-compose.test.yml up -d

# Run E2E tests
npm run test:e2e

# Run with UI (for debugging)
npm run test:e2e:ui

# Run specific test
npm run test:e2e -- widget-creation

# Generate report
npm run test:e2e:report
```

## Best Practices

### 1. Minimize E2E Tests
- Only test critical user paths
- Most testing should be in lower layers
- E2E tests are slow and expensive

### 2. Test Independence
- Each test should be runnable in isolation
- No dependencies between tests
- Clean state before each test

### 3. Realistic Data
- Use realistic test data
- Test with production-like volumes
- Include edge cases

### 4. Clear Test Names
- Describe user action: "should create button when user clicks create"
- Include expected outcome
- Use business language, not technical terms

### 5. Page Object Pattern
- Encapsulate page interactions
- Reusable page objects
- Maintainable test code

```typescript
class WidgetCreationPage {
  async createButton(label: string) {
    await this.page.click('#create-widget');
    await this.page.selectOption('#type', 'button');
    await this.page.fill('#label', label);
    await this.page.click('#submit');
  }

  async verifyWidgetExists(label: string) {
    const widget = await this.page.$(`.widget[data-label="${label}"]`);
    expect(widget).toBeDefined();
  }
}
```

### 6. Wait Strategies
- Use explicit waits: `waitForSelector`
- Avoid fixed timeouts: `waitForTimeout`
- Wait for specific conditions
- Set reasonable timeout limits

### 7. Debugging
- Take screenshots on failure
- Record videos for failed tests
- Enable trace on first retry
- Use headful mode for debugging

## Troubleshooting

### Tests are Flaky
- Add explicit waits for async operations
- Check for race conditions
- Ensure proper cleanup between tests
- Verify services are fully ready

### Tests are Slow
- Run tests in parallel
- Use faster test data generation
- Optimize service startup time
- Use test-specific configurations

### Services Won't Start
- Check Docker Compose logs
- Verify port availability
- Check database migrations
- Verify environment variables

## Current Progress

- **Current:** 0/50 tests (0%)
- **Target:** 50 tests

## Next Steps

1. Create widget workflow E2E tests (20 tests)
2. Create cross-service E2E tests (15 tests)
3. Create performance E2E tests (10 tests)
4. Create error handling E2E tests (5 tests)
5. Set up CI/CD pipeline
6. Configure Playwright reporting

## References

- [Playwright Documentation](https://playwright.dev/)
- [E2E Testing Best Practices](https://testingjavascript.com/)
- [Test Pyramid](https://martinfowler.com/articles/practical-test-pyramid.html)
