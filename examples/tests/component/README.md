# Layer 2: Component Tests

## Overview

Component tests verify the interactions between multiple classes or modules within a single service boundary. They test integrated behavior without external service dependencies, using test doubles for external services.

## Purpose

Component tests sit between unit tests (Layer 1) and integration tests (Layer 4):
- **Unit Tests**: Test individual classes in isolation
- **Component Tests**: Test multiple classes working together within one service
- **Integration Tests**: Test multiple services working together

## Scope

Component tests in this layer verify:
- Multi-class workflows within a service
- Internal API boundaries
- Component initialization and lifecycle
- In-memory state management
- Business logic spanning multiple classes
- Internal event handling and callbacks

## Test Framework Selection

### TypeScript/JavaScript
- **Jest** with in-memory implementations
- **Supertest** for component-level API testing
- Test doubles for external dependencies

### C++
- **GoogleTest** with real implementations of internal classes
- Mock only external service boundaries
- Use dependency injection for testability

### Ada
- **AUnit** with real internal component implementations
- Mock only PolyORB/database interfaces
- Test task interactions in-process

## Directory Structure

```
tests/component/
├── README.md (this file)
├── widget_core/
│   ├── widget_lifecycle.component.spec.ts
│   └── widget_event_handling.component.spec.ts
├── ui_renderer/
│   ├── rendering_pipeline.component.spec.ts
│   └── style_engine.component.spec.ts
├── state_manager/
│   ├── state_persistence.component.spec.ts
│   └── state_versioning.component.spec.ts
├── input_handler/
│   ├── event_processing.component.spec.ts
│   └── gesture_recognition.component.spec.ts
├── orb_core/
│   ├── connection_management.component.test.cpp
│   └── request_handling.component.test.cpp
└── platform_adapter/
    ├── platform_integration.component.test.cpp
    └── resource_loading.component.test.cpp
```

## Component Test Strategy

### 1. Identify Component Boundaries

For each service, identify natural component boundaries:

**Widget Core:**
- Widget Lifecycle Component (Factory → Manager → Validator)
- Event Handling Component (Listener → Dispatcher → Handler)

**UI Renderer:**
- Rendering Pipeline Component (Context → Renderer → Buffer)
- Style Engine Component (Parser → Resolver → Applicator)

**State Manager:**
- State Persistence Component (StateStore → VersionManager → Serializer)
- State Watching Component (WatchRegistry → ChangeDetector → Notifier)

### 2. Test Component Workflows

Each component test should:
1. Set up the component with real internal implementations
2. Mock only external service boundaries (database, ORB, HTTP clients)
3. Exercise complete workflows through the component
4. Verify state changes across multiple classes
5. Test error propagation within the component

### 3. Use In-Memory Implementations

For external dependencies:
- **Database**: In-memory Map/Dictionary
- **ORB**: Mock implementation
- **HTTP Client**: Mock or in-memory server
- **File System**: In-memory file system
- **Time**: Controllable clock

## Example: Widget Lifecycle Component Test

```typescript
describe('Widget Lifecycle Component', () => {
  let component: WidgetLifecycleComponent;
  let mockDatabase: InMemoryDatabase;
  let mockORB: MockORBClient;

  beforeEach(() => {
    mockDatabase = new InMemoryDatabase();
    mockORB = new MockORBClient();

    component = new WidgetLifecycleComponent({
      database: mockDatabase,
      orb: mockORB,
    });
  });

  it('should create, register, and activate widget', async () => {
    // Arrange
    const widgetConfig = {
      type: 'button',
      label: 'Click Me',
      width: 100,
      height: 50,
    };

    // Act: Create widget (Factory → Validator → Store)
    const widget = await component.createWidget(widgetConfig);

    // Assert: Widget created in database
    expect(widget.id).toBeDefined();
    expect(mockDatabase.has(`widget:${widget.id}`)).toBe(true);

    // Act: Register with ORB (RegistrationManager → ORB)
    await component.registerWidget(widget.id);

    // Assert: ORB reference created
    expect(mockORB.hasReference(widget.id)).toBe(true);

    // Act: Activate widget (LifecycleManager → EventSetup)
    await component.activateWidget(widget.id);

    // Assert: Widget state updated
    const storedWidget = mockDatabase.get(`widget:${widget.id}`);
    expect(storedWidget.state).toBe('active');
  });

  it('should handle widget lifecycle errors', async () => {
    // Arrange: Database is full
    mockDatabase.setFull(true);

    // Act & Assert: Creation fails
    await expect(
      component.createWidget({ type: 'button' })
    ).rejects.toThrow('Database full');

    // Assert: No partial state created
    expect(mockDatabase.size()).toBe(0);
    expect(mockORB.getReferenceCount()).toBe(0);
  });
});
```

## Coverage Targets

### Overall Target: 75%

Component tests should achieve 75% coverage of:
- Multi-class interaction paths
- Component initialization/teardown
- Internal state transitions
- Error propagation within components

### Per-Service Coverage

| Service | Component Count | Tests Target | Current |
|---------|----------------|--------------|---------|
| Widget Core | 3 components | 45 tests | 0 |
| UI Renderer | 3 components | 45 tests | 0 |
| State Manager | 3 components | 45 tests | 0 |
| Input Handler | 2 components | 30 tests | 0 |
| ORB Core | 2 components | 30 tests | 0 |
| Platform Adapter | 2 components | 30 tests | 0 |
| Event Dispatcher | 2 components | 30 tests | 0 |
| API Gateway | 2 components | 30 tests | 0 |
| Authentication | 1 component | 15 tests | 0 |
| **Total** | **20 components** | **300 tests** | **0** |

## Component Test Patterns

### Pattern 1: Workflow Testing

Test complete workflows through multiple classes:

```typescript
it('should process complete widget creation workflow', async () => {
  // Arrange
  const config = { type: 'button', label: 'Test' };

  // Act: Factory → Validator → Store → ORB → EventSetup
  const result = await component.createAndRegisterWidget(config);

  // Assert: All steps completed
  expect(result.widget).toBeDefined();
  expect(result.orbReference).toBeDefined();
  expect(result.eventsConfigured).toBe(true);
});
```

### Pattern 2: State Transition Testing

Test state changes across component:

```typescript
it('should transition widget through lifecycle states', async () => {
  // Arrange
  const widget = await component.createWidget({ type: 'button' });
  expect(widget.state).toBe('created');

  // Act: Initialize
  await component.initializeWidget(widget.id);
  expect(widget.state).toBe('initialized');

  // Act: Activate
  await component.activateWidget(widget.id);
  expect(widget.state).toBe('active');

  // Act: Deactivate
  await component.deactivateWidget(widget.id);
  expect(widget.state).toBe('inactive');

  // Act: Destroy
  await component.destroyWidget(widget.id);
  // Assert: No state (deleted)
  expect(mockDatabase.has(`widget:${widget.id}`)).toBe(false);
});
```

### Pattern 3: Error Propagation Testing

Test error handling across component boundaries:

```typescript
it('should handle and recover from mid-workflow errors', async () => {
  // Arrange: Database fails after widget creation
  mockDatabase.setFailAfter(1);

  // Act & Assert: Creation starts but fails
  await expect(
    component.createAndRegisterWidget({ type: 'button' })
  ).rejects.toThrow();

  // Assert: Cleanup occurred (no partial state)
  expect(mockDatabase.size()).toBe(0);
  expect(mockORB.getReferenceCount()).toBe(0);
});
```

### Pattern 4: Concurrency Testing

Test component behavior under concurrent access:

```typescript
it('should handle concurrent widget creation', async () => {
  // Arrange
  const configs = Array.from({ length: 10 }, (_, i) => ({
    type: 'button',
    label: `Button ${i}`,
  }));

  // Act: Create all widgets concurrently
  const results = await Promise.all(
    configs.map(config => component.createWidget(config))
  );

  // Assert: All created with unique IDs
  expect(results).toHaveLength(10);
  const ids = results.map(w => w.id);
  expect(new Set(ids).size).toBe(10);
  expect(mockDatabase.size()).toBe(10);
});
```

## Test Data Management

### In-Memory Test Doubles

Create lightweight in-memory implementations:

```typescript
class InMemoryDatabase implements DatabaseInterface {
  private data = new Map<string, any>();
  private full = false;

  set(key: string, value: any): void {
    if (this.full) throw new Error('Database full');
    this.data.set(key, value);
  }

  get(key: string): any {
    return this.data.get(key);
  }

  has(key: string): boolean {
    return this.data.has(key);
  }

  size(): number {
    return this.data.size;
  }

  setFull(full: boolean): void {
    this.full = full;
  }

  clear(): void {
    this.data.clear();
  }
}
```

### Mock External Services

Mock only external service boundaries:

```typescript
class MockORBClient implements ORBInterface {
  private references = new Map<string, OrbReference>();

  createReference(id: string): OrbReference {
    const ref = { id, ior: `IOR:${id}` };
    this.references.set(id, ref);
    return ref;
  }

  hasReference(id: string): boolean {
    return this.references.has(id);
  }

  getReferenceCount(): number {
    return this.references.size;
  }

  clear(): void {
    this.references.clear();
  }
}
```

## CI/CD Integration

### Jest Configuration

```javascript
// jest.component.config.js
module.exports = {
  displayName: 'component',
  testMatch: ['**/*.component.spec.ts'],
  testEnvironment: 'node',
  coverageThreshold: {
    global: {
      branches: 75,
      functions: 75,
      lines: 75,
      statements: 75,
    },
  },
  maxWorkers: 4,
  testTimeout: 10000,
};
```

### Run Commands

```bash
# Run all component tests
npm run test:component

# Run component tests with coverage
npm run test:component:coverage

# Run component tests for specific service
npm run test:component -- widget_core

# Run component tests in watch mode
npm run test:component:watch
```

## Best Practices

### 1. Real Internal Implementations
- Use real implementations for classes within the component
- Only mock external service boundaries
- This ensures realistic interaction testing

### 2. Component Setup Helpers
- Create setup helpers for component initialization
- Encapsulate common mock configurations
- Reduce boilerplate in test files

### 3. Clear Component Boundaries
- Define what's "inside" vs "outside" the component
- Mock consistently at boundaries
- Document component scope in test files

### 4. Test Independence
- Each test should be independent
- Clear in-memory state between tests
- Use fresh component instances per test

### 5. Readable Test Names
- Use descriptive test names: "should <behavior> when <condition>"
- Group related tests in `describe` blocks by feature
- Use comments to explain complex workflows

### 6. Focus on Integration Points
- Test interactions between classes
- Verify state changes across components
- Test error propagation paths

### 7. Performance Considerations
- Keep component tests fast (< 1 second each)
- Use in-memory implementations (no I/O)
- Parallelize test execution

## Troubleshooting

### Tests are Slow
- Check for accidental I/O operations
- Ensure using in-memory implementations
- Verify no real network calls
- Check for synchronous waits/sleeps

### Tests are Flaky
- Check for shared state between tests
- Verify proper cleanup in afterEach
- Look for timing dependencies
- Check for non-deterministic behavior

### Low Coverage
- Identify untested interaction paths
- Add tests for error scenarios
- Test state transitions
- Add concurrency tests

### Mock Confusion
- Document what's mocked and why
- Keep mocks simple and focused
- Verify mocks match real behavior
- Update mocks when APIs change

## Example Tests

See the following example component tests:
- `widget_core/widget_lifecycle.component.spec.ts` - Widget creation and lifecycle
- `ui_renderer/rendering_pipeline.component.spec.ts` - Rendering workflow
- `state_manager/state_persistence.component.spec.ts` - State management
- `orb_core/connection_management.component.test.cpp` - ORB connection pooling

## Next Steps

1. Create component test examples for each service
2. Run tests and capture initial coverage baselines
3. Integrate with CI/CD pipeline
4. Set coverage gates at 75%
5. Expand component test suite to 300 tests

## References

- [Testing Strategies](https://martinfowler.com/articles/practical-test-pyramid.html)
- [Component Testing Guide](https://testing.googleblog.com/2015/04/just-say-no-to-more-end-to-end-tests.html)
- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [GoogleTest Documentation](https://google.github.io/googletest/)
- [AUnit User Guide](https://docs.adacore.com/aunit-docs/aunit.html)
