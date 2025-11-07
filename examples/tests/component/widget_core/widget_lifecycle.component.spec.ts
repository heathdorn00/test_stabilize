/**
 * Component Test - Widget Core: Widget Lifecycle Component
 * Task: 57fbde - Comprehensive Test Framework / RDB-002
 * Layer 2: Component Tests
 *
 * Tests the interaction between WidgetFactory, WidgetValidator,
 * WidgetLifecycleManager, and ORBRegistrationManager within Widget Core.
 */

import { WidgetLifecycleComponent } from '@/services/widget-core/components/lifecycle';
import { InMemoryDatabase } from '@/test-utils/in-memory-database';
import { MockORBClient } from '@/test-utils/mock-orb';
import { MockEventBus } from '@/test-utils/mock-event-bus';

describe('Widget Lifecycle Component', () => {
  // ===========================================================================
  // Test Setup
  // ===========================================================================

  let component: WidgetLifecycleComponent;
  let mockDatabase: InMemoryDatabase;
  let mockORB: MockORBClient;
  let mockEventBus: MockEventBus;

  beforeEach(() => {
    // Create in-memory implementations for external dependencies
    mockDatabase = new InMemoryDatabase();
    mockORB = new MockORBClient();
    mockEventBus = new MockEventBus();

    // Initialize component with real internal classes
    component = new WidgetLifecycleComponent({
      database: mockDatabase,
      orb: mockORB,
      eventBus: mockEventBus,
    });
  });

  afterEach(() => {
    // Clear all state
    mockDatabase.clear();
    mockORB.clear();
    mockEventBus.clear();
  });

  // ===========================================================================
  // Widget Creation Workflow Tests
  // ===========================================================================

  describe('Widget Creation Workflow', () => {
    it('should create widget through complete workflow', async () => {
      // Arrange
      const config = {
        type: 'button',
        label: 'Click Me',
        width: 100,
        height: 50,
      };

      // Act: Factory → Validator → Store → ORB → Events
      const widget = await component.createWidget(config);

      // Assert: Widget created
      expect(widget.id).toBeDefined();
      expect(widget.type).toBe('button');
      expect(widget.label).toBe('Click Me');
      expect(widget.state).toBe('created');

      // Assert: Stored in database
      const stored = mockDatabase.get(`widget:${widget.id}`);
      expect(stored).toBeDefined();
      expect(stored.id).toBe(widget.id);

      // Assert: ORB reference created
      expect(mockORB.hasReference(widget.id)).toBe(true);
      const orbRef = mockORB.getReference(widget.id);
      expect(orbRef.ior).toMatch(/^IOR:/);

      // Assert: Event published
      expect(mockEventBus.hasEvent('widget.created')).toBe(true);
      const event = mockEventBus.getLastEvent('widget.created');
      expect(event.data.widgetId).toBe(widget.id);
    });

    it('should validate widget configuration', async () => {
      // Arrange: Invalid config (negative dimensions)
      const invalidConfig = {
        type: 'button',
        label: 'Test',
        width: -100, // Invalid
        height: -50, // Invalid
      };

      // Act & Assert: Validation fails
      await expect(
        component.createWidget(invalidConfig)
      ).rejects.toThrow('Invalid widget dimensions');

      // Assert: No state created
      expect(mockDatabase.size()).toBe(0);
      expect(mockORB.getReferenceCount()).toBe(0);
      expect(mockEventBus.getEventCount()).toBe(0);
    });

    it('should handle database failure during creation', async () => {
      // Arrange: Database will fail on write
      mockDatabase.setFailOnNextWrite(true);

      const config = {
        type: 'button',
        label: 'Test',
        width: 100,
        height: 50,
      };

      // Act & Assert: Creation fails
      await expect(
        component.createWidget(config)
      ).rejects.toThrow('Database write failed');

      // Assert: No partial state (cleanup occurred)
      expect(mockDatabase.size()).toBe(0);
      expect(mockORB.getReferenceCount()).toBe(0);
    });

    it('should handle ORB registration failure', async () => {
      // Arrange: ORB will fail on registration
      mockORB.setFailOnNextRegister(true);

      const config = {
        type: 'button',
        label: 'Test',
        width: 100,
        height: 50,
      };

      // Act & Assert: Creation fails at ORB step
      await expect(
        component.createWidget(config)
      ).rejects.toThrow('ORB registration failed');

      // Assert: Database entry cleaned up
      expect(mockDatabase.size()).toBe(0);
      expect(mockORB.getReferenceCount()).toBe(0);
    });

    it('should create multiple widgets concurrently', async () => {
      // Arrange: Multiple widget configs
      const configs = Array.from({ length: 10 }, (_, i) => ({
        type: 'button',
        label: `Button ${i}`,
        width: 100,
        height: 50,
      }));

      // Act: Create all concurrently
      const widgets = await Promise.all(
        configs.map(config => component.createWidget(config))
      );

      // Assert: All created successfully
      expect(widgets).toHaveLength(10);

      // Assert: All have unique IDs
      const ids = widgets.map(w => w.id);
      expect(new Set(ids).size).toBe(10);

      // Assert: All stored in database
      expect(mockDatabase.size()).toBe(10);

      // Assert: All have ORB references
      expect(mockORB.getReferenceCount()).toBe(10);

      // Assert: All events published
      expect(mockEventBus.getEventCount('widget.created')).toBe(10);
    });
  });

  // ===========================================================================
  // Widget Lifecycle State Transition Tests
  // ===========================================================================

  describe('Widget Lifecycle State Transitions', () => {
    let widgetId: string;

    beforeEach(async () => {
      // Create a widget for lifecycle testing
      const widget = await component.createWidget({
        type: 'button',
        label: 'Test',
        width: 100,
        height: 50,
      });
      widgetId = widget.id;
    });

    it('should initialize widget', async () => {
      // Arrange: Widget is in 'created' state
      let widget = mockDatabase.get(`widget:${widgetId}`);
      expect(widget.state).toBe('created');

      // Act: Initialize
      await component.initializeWidget(widgetId);

      // Assert: State changed to 'initialized'
      widget = mockDatabase.get(`widget:${widgetId}`);
      expect(widget.state).toBe('initialized');

      // Assert: Event published
      expect(mockEventBus.hasEvent('widget.initialized')).toBe(true);
    });

    it('should activate widget', async () => {
      // Arrange: Initialize first
      await component.initializeWidget(widgetId);

      // Act: Activate
      await component.activateWidget(widgetId);

      // Assert: State changed to 'active'
      const widget = mockDatabase.get(`widget:${widgetId}`);
      expect(widget.state).toBe('active');
      expect(widget.activatedAt).toBeDefined();

      // Assert: Event handlers registered
      expect(mockEventBus.hasSubscription(widgetId)).toBe(true);

      // Assert: Event published
      expect(mockEventBus.hasEvent('widget.activated')).toBe(true);
    });

    it('should deactivate widget', async () => {
      // Arrange: Initialize and activate first
      await component.initializeWidget(widgetId);
      await component.activateWidget(widgetId);

      // Act: Deactivate
      await component.deactivateWidget(widgetId);

      // Assert: State changed to 'inactive'
      const widget = mockDatabase.get(`widget:${widgetId}`);
      expect(widget.state).toBe('inactive');
      expect(widget.deactivatedAt).toBeDefined();

      // Assert: Event handlers unregistered
      expect(mockEventBus.hasSubscription(widgetId)).toBe(false);

      // Assert: Event published
      expect(mockEventBus.hasEvent('widget.deactivated')).toBe(true);
    });

    it('should destroy widget', async () => {
      // Arrange: Activate widget
      await component.initializeWidget(widgetId);
      await component.activateWidget(widgetId);

      // Act: Destroy
      await component.destroyWidget(widgetId);

      // Assert: Widget removed from database
      expect(mockDatabase.has(`widget:${widgetId}`)).toBe(false);

      // Assert: ORB reference removed
      expect(mockORB.hasReference(widgetId)).toBe(false);

      // Assert: Event handlers cleaned up
      expect(mockEventBus.hasSubscription(widgetId)).toBe(false);

      // Assert: Event published
      expect(mockEventBus.hasEvent('widget.destroyed')).toBe(true);
    });

    it('should enforce valid state transitions', async () => {
      // Act & Assert: Cannot activate without initializing
      await expect(
        component.activateWidget(widgetId)
      ).rejects.toThrow('Widget must be initialized before activation');

      // Act: Initialize
      await component.initializeWidget(widgetId);

      // Act & Assert: Cannot initialize twice
      await expect(
        component.initializeWidget(widgetId)
      ).rejects.toThrow('Widget already initialized');

      // Act: Activate
      await component.activateWidget(widgetId);

      // Act & Assert: Cannot activate twice
      await expect(
        component.activateWidget(widgetId)
      ).rejects.toThrow('Widget already active');
    });

    it('should handle full lifecycle sequence', async () => {
      // Act: Run through complete lifecycle
      await component.initializeWidget(widgetId);
      await component.activateWidget(widgetId);
      await component.deactivateWidget(widgetId);
      await component.destroyWidget(widgetId);

      // Assert: Widget fully cleaned up
      expect(mockDatabase.has(`widget:${widgetId}`)).toBe(false);
      expect(mockORB.hasReference(widgetId)).toBe(false);

      // Assert: All lifecycle events published
      expect(mockEventBus.hasEvent('widget.created')).toBe(true);
      expect(mockEventBus.hasEvent('widget.initialized')).toBe(true);
      expect(mockEventBus.hasEvent('widget.activated')).toBe(true);
      expect(mockEventBus.hasEvent('widget.deactivated')).toBe(true);
      expect(mockEventBus.hasEvent('widget.destroyed')).toBe(true);
    });
  });

  // ===========================================================================
  // Widget Update Tests
  // ===========================================================================

  describe('Widget Updates', () => {
    let widgetId: string;

    beforeEach(async () => {
      const widget = await component.createWidget({
        type: 'button',
        label: 'Original',
        width: 100,
        height: 50,
      });
      widgetId = widget.id;
      await component.initializeWidget(widgetId);
      await component.activateWidget(widgetId);
    });

    it('should update widget properties', async () => {
      // Arrange
      const updates = {
        label: 'Updated Label',
        width: 150,
      };

      // Act
      await component.updateWidget(widgetId, updates);

      // Assert: Properties updated
      const widget = mockDatabase.get(`widget:${widgetId}`);
      expect(widget.label).toBe('Updated Label');
      expect(widget.width).toBe(150);
      expect(widget.height).toBe(50); // Unchanged

      // Assert: Version incremented
      expect(widget.version).toBe(2);

      // Assert: Event published
      expect(mockEventBus.hasEvent('widget.updated')).toBe(true);
      const event = mockEventBus.getLastEvent('widget.updated');
      expect(event.data.changedFields).toContain('label');
      expect(event.data.changedFields).toContain('width');
    });

    it('should validate property updates', async () => {
      // Arrange: Invalid updates
      const invalidUpdates = {
        width: -200, // Invalid
      };

      // Act & Assert: Update fails validation
      await expect(
        component.updateWidget(widgetId, invalidUpdates)
      ).rejects.toThrow('Invalid widget dimensions');

      // Assert: Widget unchanged
      const widget = mockDatabase.get(`widget:${widgetId}`);
      expect(widget.width).toBe(100); // Original value
      expect(widget.version).toBe(1); // Version not incremented
    });

    it('should handle concurrent updates with optimistic locking', async () => {
      // Arrange: Two concurrent updates
      const update1 = { label: 'Update 1' };
      const update2 = { label: 'Update 2' };

      // Act: Update concurrently
      const [result1, result2] = await Promise.allSettled([
        component.updateWidget(widgetId, update1),
        component.updateWidget(widgetId, update2),
      ]);

      // Assert: One succeeds, one fails with conflict
      const succeeded = [result1, result2].filter(r => r.status === 'fulfilled');
      const failed = [result1, result2].filter(r => r.status === 'rejected');

      expect(succeeded).toHaveLength(1);
      expect(failed).toHaveLength(1);

      // Assert: Failed update has conflict error
      const failedResult = failed[0] as PromiseRejectedResult;
      expect(failedResult.reason.message).toMatch(/version conflict/i);

      // Assert: Final version is 2 (one update succeeded)
      const widget = mockDatabase.get(`widget:${widgetId}`);
      expect(widget.version).toBe(2);
    });
  });

  // ===========================================================================
  // Widget Query Tests
  // ===========================================================================

  describe('Widget Queries', () => {
    beforeEach(async () => {
      // Create multiple widgets
      await component.createWidget({
        type: 'button',
        label: 'Button 1',
        width: 100,
        height: 50,
      });
      await component.createWidget({
        type: 'label',
        label: 'Label 1',
        width: 200,
        height: 30,
      });
      await component.createWidget({
        type: 'button',
        label: 'Button 2',
        width: 100,
        height: 50,
      });
    });

    it('should list all widgets', async () => {
      // Act
      const widgets = await component.listWidgets();

      // Assert
      expect(widgets).toHaveLength(3);
    });

    it('should filter widgets by type', async () => {
      // Act
      const buttons = await component.listWidgets({ type: 'button' });

      // Assert
      expect(buttons).toHaveLength(2);
      expect(buttons.every(w => w.type === 'button')).toBe(true);
    });

    it('should filter widgets by state', async () => {
      // Arrange: Activate one button
      const widgets = await component.listWidgets();
      await component.initializeWidget(widgets[0].id);
      await component.activateWidget(widgets[0].id);

      // Act
      const activeWidgets = await component.listWidgets({ state: 'active' });

      // Assert
      expect(activeWidgets).toHaveLength(1);
      expect(activeWidgets[0].state).toBe('active');
    });

    it('should get widget by ID', async () => {
      // Arrange
      const widgets = await component.listWidgets();
      const targetId = widgets[0].id;

      // Act
      const widget = await component.getWidget(targetId);

      // Assert
      expect(widget).toBeDefined();
      expect(widget.id).toBe(targetId);
    });

    it('should throw error for non-existent widget', async () => {
      // Act & Assert
      await expect(
        component.getWidget('non-existent-id')
      ).rejects.toThrow('Widget not found');
    });
  });

  // ===========================================================================
  // Error Recovery Tests
  // ===========================================================================

  describe('Error Recovery', () => {
    it('should recover from transient database errors', async () => {
      // Arrange: Database fails once then succeeds
      mockDatabase.setFailNextNWrites(1);

      const config = {
        type: 'button',
        label: 'Test',
        width: 100,
        height: 50,
      };

      // Act: First attempt fails, retry succeeds
      await expect(
        component.createWidget(config)
      ).rejects.toThrow('Database write failed');

      const widget = await component.createWidget(config);

      // Assert: Widget created on retry
      expect(widget.id).toBeDefined();
      expect(mockDatabase.has(`widget:${widget.id}`)).toBe(true);
    });

    it('should handle partial failures during destruction', async () => {
      // Arrange: Create and activate widget
      const widget = await component.createWidget({
        type: 'button',
        label: 'Test',
        width: 100,
        height: 50,
      });
      await component.initializeWidget(widget.id);
      await component.activateWidget(widget.id);

      // Arrange: ORB cleanup will fail
      mockORB.setFailOnNextUnregister(true);

      // Act: Destroy (ORB cleanup fails but continues)
      await component.destroyWidget(widget.id);

      // Assert: Widget removed from database despite ORB error
      expect(mockDatabase.has(`widget:${widget.id}`)).toBe(false);

      // Assert: Event handlers cleaned up
      expect(mockEventBus.hasSubscription(widget.id)).toBe(false);

      // Assert: Error logged
      expect(mockEventBus.hasEvent('widget.cleanup.failed')).toBe(true);
    });
  });

  // ===========================================================================
  // Performance Tests
  // ===========================================================================

  describe('Performance', () => {
    it('should create 100 widgets within time limit', async () => {
      // Arrange
      const configs = Array.from({ length: 100 }, (_, i) => ({
        type: 'button',
        label: `Button ${i}`,
        width: 100,
        height: 50,
      }));

      const startTime = Date.now();

      // Act
      await Promise.all(
        configs.map(config => component.createWidget(config))
      );

      const duration = Date.now() - startTime;

      // Assert: Completed within 5 seconds
      expect(duration).toBeLessThan(5000);

      // Assert: All created
      expect(mockDatabase.size()).toBe(100);
    });

    it('should handle widget lifecycle transitions efficiently', async () => {
      // Arrange: Create 50 widgets
      const widgets = await Promise.all(
        Array.from({ length: 50 }, (_, i) =>
          component.createWidget({
            type: 'button',
            label: `Button ${i}`,
            width: 100,
            height: 50,
          })
        )
      );

      const startTime = Date.now();

      // Act: Run all through lifecycle
      for (const widget of widgets) {
        await component.initializeWidget(widget.id);
        await component.activateWidget(widget.id);
        await component.deactivateWidget(widget.id);
        await component.destroyWidget(widget.id);
      }

      const duration = Date.now() - startTime;

      // Assert: Completed within 10 seconds
      expect(duration).toBeLessThan(10000);

      // Assert: All cleaned up
      expect(mockDatabase.size()).toBe(0);
      expect(mockORB.getReferenceCount()).toBe(0);
    });
  });
});

/**
 * Test Coverage Summary:
 *
 * - Widget Creation Workflow (5 tests)
 *   - Complete workflow testing
 *   - Validation testing
 *   - Error handling (database, ORB)
 *   - Concurrent creation
 *
 * - Widget Lifecycle State Transitions (6 tests)
 *   - Initialize, activate, deactivate, destroy
 *   - State transition enforcement
 *   - Complete lifecycle sequence
 *
 * - Widget Updates (3 tests)
 *   - Property updates
 *   - Update validation
 *   - Concurrent updates with optimistic locking
 *
 * - Widget Queries (5 tests)
 *   - List all, filter by type, filter by state
 *   - Get by ID
 *   - Error for non-existent
 *
 * - Error Recovery (2 tests)
 *   - Transient error recovery
 *   - Partial failure handling
 *
 * - Performance (2 tests)
 *   - Bulk creation
 *   - Lifecycle efficiency
 *
 * Total: 23 tests
 *
 * This component test verifies the interaction between:
 * - WidgetFactory (creation, validation)
 * - WidgetValidator (configuration validation)
 * - WidgetLifecycleManager (state transitions)
 * - ORBRegistrationManager (ORB registration/cleanup)
 * - WidgetRepository (database operations)
 * - EventPublisher (event publishing)
 */
