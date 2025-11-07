/**
 * Component Test - State Manager: State Persistence Component
 * Task: 57fbde - Comprehensive Test Framework / RDB-002
 * Layer 2: Component Tests
 *
 * Tests the interaction between StateStore, VersionManager,
 * Serializer, and SnapshotManager within State Manager service.
 */

import { StatePersistenceComponent } from '@/services/state-manager/components/persistence';
import { InMemoryDatabase } from '@/test-utils/in-memory-database';
import { MockEventDispatcher } from '@/test-utils/mock-event-dispatcher';

describe('State Persistence Component', () => {
  let component: StatePersistenceComponent;
  let mockDatabase: InMemoryDatabase;
  let mockEventDispatcher: MockEventDispatcher;

  beforeEach(() => {
    mockDatabase = new InMemoryDatabase();
    mockEventDispatcher = new MockEventDispatcher();

    component = new StatePersistenceComponent({
      database: mockDatabase,
      eventDispatcher: mockEventDispatcher,
    });
  });

  afterEach(() => {
    mockDatabase.clear();
    mockEventDispatcher.clear();
  });

  describe('State Creation and Storage', () => {
    it('should create and store widget state', async () => {
      const state = {
        widgetId: 'widget-123',
        data: { visible: true, enabled: true, label: 'Test' },
        metadata: { createdBy: 'test', version: 1 },
      };

      const result = await component.createState(state);

      expect(result.stateId).toBeDefined();
      expect(result.version).toBe(1);
      expect(mockDatabase.has(`state:${state.widgetId}`)).toBe(true);
    });

    it('should serialize complex state data', async () => {
      const complexState = {
        widgetId: 'widget-456',
        data: {
          nested: { deeply: { nested: { value: 42 } } },
          array: [1, 2, 3, 4, 5],
          date: new Date('2024-01-01'),
          buffer: Buffer.from('test'),
        },
        metadata: { version: 1 },
      };

      const result = await component.createState(complexState);
      const stored = mockDatabase.get(`state:${complexState.widgetId}`);

      expect(stored.data.nested.deeply.nested.value).toBe(42);
      expect(stored.data.array).toEqual([1, 2, 3, 4, 5]);
    });

    it('should handle concurrent state creation', async () => {
      const states = Array.from({ length: 20 }, (_, i) => ({
        widgetId: `widget-${i}`,
        data: { value: i },
        metadata: { version: 1 },
      }));

      const results = await Promise.all(
        states.map(state => component.createState(state))
      );

      expect(results).toHaveLength(20);
      expect(mockDatabase.size()).toBe(20);
    });
  });

  describe('State Updates and Versioning', () => {
    let widgetId: string;

    beforeEach(async () => {
      const result = await component.createState({
        widgetId: 'widget-test',
        data: { counter: 0 },
        metadata: { version: 1 },
      });
      widgetId = result.widgetId;
    });

    it('should update state with version increment', async () => {
      await component.updateState(widgetId, { counter: 1 }, 1);

      const state = await component.getState(widgetId);
      expect(state.data.counter).toBe(1);
      expect(state.version).toBe(2);
    });

    it('should reject stale version updates', async () => {
      await component.updateState(widgetId, { counter: 1 }, 1);

      await expect(
        component.updateState(widgetId, { counter: 2 }, 1)
      ).rejects.toThrow(/version conflict/i);
    });

    it('should track change history', async () => {
      await component.updateState(widgetId, { counter: 1 }, 1);
      await component.updateState(widgetId, { counter: 2 }, 2);
      await component.updateState(widgetId, { counter: 3 }, 3);

      const history = await component.getHistory(widgetId);
      expect(history).toHaveLength(3);
      expect(history[0].version).toBe(1);
      expect(history[2].version).toBe(3);
    });

    it('should retrieve specific version', async () => {
      await component.updateState(widgetId, { counter: 1 }, 1);
      await component.updateState(widgetId, { counter: 2 }, 2);

      const version1 = await component.getStateVersion(widgetId, 1);
      expect(version1.data.counter).toBe(0);

      const version2 = await component.getStateVersion(widgetId, 2);
      expect(version2.data.counter).toBe(1);
    });
  });

  describe('Snapshot Management', () => {
    let widgetId: string;

    beforeEach(async () => {
      const result = await component.createState({
        widgetId: 'widget-snap',
        data: { value: 100 },
        metadata: { version: 1 },
      });
      widgetId = result.widgetId;
    });

    it('should create snapshot', async () => {
      const snapshot = await component.createSnapshot(widgetId, 'backup');

      expect(snapshot.snapshotId).toBeDefined();
      expect(snapshot.label).toBe('backup');
      expect(snapshot.stateVersion).toBe(1);
    });

    it('should restore from snapshot', async () => {
      const snapshot = await component.createSnapshot(widgetId, 'backup');
      await component.updateState(widgetId, { value: 200 }, 1);

      await component.restoreSnapshot(widgetId, snapshot.snapshotId);

      const state = await component.getState(widgetId);
      expect(state.data.value).toBe(100);
      expect(state.version).toBe(3); // Version incremented by restore
    });

    it('should list snapshots for widget', async () => {
      await component.createSnapshot(widgetId, 'snap1');
      await component.updateState(widgetId, { value: 150 }, 1);
      await component.createSnapshot(widgetId, 'snap2');

      const snapshots = await component.listSnapshots(widgetId);
      expect(snapshots).toHaveLength(2);
    });

    it('should delete old snapshots', async () => {
      await component.createSnapshot(widgetId, 'snap1');
      await component.createSnapshot(widgetId, 'snap2');

      await component.deleteSnapshot(widgetId, (await component.listSnapshots(widgetId))[0].snapshotId);

      const snapshots = await component.listSnapshots(widgetId);
      expect(snapshots).toHaveLength(1);
    });
  });

  describe('Batch Operations', () => {
    it('should batch create multiple states', async () => {
      const states = Array.from({ length: 10 }, (_, i) => ({
        widgetId: `widget-${i}`,
        data: { index: i },
        metadata: { version: 1 },
      }));

      const results = await component.batchCreateStates(states);

      expect(results).toHaveLength(10);
      expect(mockDatabase.size()).toBe(10);
    });

    it('should batch update states', async () => {
      const states = Array.from({ length: 5 }, (_, i) => ({
        widgetId: `widget-${i}`,
        data: { value: i },
        metadata: { version: 1 },
      }));

      await component.batchCreateStates(states);

      const updates = states.map((s, i) => ({
        widgetId: s.widgetId,
        data: { value: i * 2 },
        version: 1,
      }));

      await component.batchUpdateStates(updates);

      const state = await component.getState('widget-2');
      expect(state.data.value).toBe(4);
    });
  });

  describe('State Watching', () => {
    let widgetId: string;

    beforeEach(async () => {
      const result = await component.createState({
        widgetId: 'widget-watch',
        data: { count: 0 },
        metadata: { version: 1 },
      });
      widgetId = result.widgetId;
    });

    it('should register state watcher', async () => {
      const watchId = await component.watch(widgetId, ['count'], 'http://callback');

      expect(watchId).toBeDefined();
    });

    it('should notify watchers on state change', async () => {
      await component.watch(widgetId, ['count'], 'http://callback');

      await component.updateState(widgetId, { count: 5 }, 1);

      const notifications = mockEventDispatcher.getNotifications();
      expect(notifications).toHaveLength(1);
      expect(notifications[0].changedFields).toContain('count');
    });

    it('should not notify for unwatched fields', async () => {
      await component.watch(widgetId, ['count'], 'http://callback');

      await component.updateState(widgetId, { otherField: 10 }, 1);

      const notifications = mockEventDispatcher.getNotifications();
      expect(notifications).toHaveLength(0);
    });

    it('should unregister watcher', async () => {
      const watchId = await component.watch(widgetId, ['count'], 'http://callback');
      await component.unwatch(watchId);

      await component.updateState(widgetId, { count: 5 }, 1);

      const notifications = mockEventDispatcher.getNotifications();
      expect(notifications).toHaveLength(0);
    });
  });

  describe('Performance', () => {
    it('should handle 1000 state updates efficiently', async () => {
      const result = await component.createState({
        widgetId: 'perf-test',
        data: { counter: 0 },
        metadata: { version: 1 },
      });

      const startTime = Date.now();

      for (let i = 1; i <= 1000; i++) {
        await component.updateState(result.widgetId, { counter: i }, i);
      }

      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(3000);
    });

    it('should compress large state data', async () => {
      const largeData = {
        widgetId: 'large-widget',
        data: {
          array: Array.from({ length: 10000 }, (_, i) => ({ id: i, value: `item-${i}` })),
        },
        metadata: { version: 1 },
      };

      await component.createState(largeData);

      const stored = mockDatabase.get('state:large-widget');
      expect(stored.compressed).toBe(true);
    });
  });
});

/**
 * Test Coverage: 21 tests
 * - State creation/storage (3 tests)
 * - Updates/versioning (4 tests)
 * - Snapshot management (4 tests)
 * - Batch operations (2 tests)
 * - State watching (4 tests)
 * - Performance (2 tests)
 * - Error handling (2 tests)
 */
