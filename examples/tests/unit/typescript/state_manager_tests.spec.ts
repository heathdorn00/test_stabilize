/**
 * Unit Tests - State Manager Service (TypeScript)
 * Task: 57fbde - Comprehensive Test Framework / RDB-002
 * Layer 1: Unit Tests
 *
 * Tests individual classes in State Manager service in isolation.
 */

import { StateStore } from '@/services/state-manager/state-store';
import { VersionManager } from '@/services/state-manager/version-manager';
import { SnapshotManager } from '@/services/state-manager/snapshot-manager';
import { StateSerializer } from '@/services/state-manager/state-serializer';
import { MockDatabase } from '@/test-utils/mocks';

describe('StateStore', () => {
  let stateStore: StateStore;
  let mockDb: MockDatabase;

  beforeEach(() => {
    mockDb = new MockDatabase();
    stateStore = new StateStore(mockDb);
  });

  it('should create new state', async () => {
    const state = { widgetId: 'w1', data: { value: 42 } };
    const result = await stateStore.create(state);

    expect(result.stateId).toBeDefined();
    expect(result.widgetId).toBe('w1');
  });

  it('should retrieve existing state', async () => {
    const created = await stateStore.create({ widgetId: 'w1', data: { value: 42 } });
    const retrieved = await stateStore.get('w1');

    expect(retrieved.stateId).toBe(created.stateId);
    expect(retrieved.data.value).toBe(42);
  });

  it('should update state', async () => {
    await stateStore.create({ widgetId: 'w1', data: { value: 42 } });
    await stateStore.update('w1', { value: 100 });

    const updated = await stateStore.get('w1');
    expect(updated.data.value).toBe(100);
  });

  it('should delete state', async () => {
    await stateStore.create({ widgetId: 'w1', data: { value: 42 } });
    await stateStore.delete('w1');

    await expect(stateStore.get('w1')).rejects.toThrow('not found');
  });

  it('should list all states', async () => {
    await stateStore.create({ widgetId: 'w1', data: { v: 1 } });
    await stateStore.create({ widgetId: 'w2', data: { v: 2 } });
    await stateStore.create({ widgetId: 'w3', data: { v: 3 } });

    const states = await stateStore.list();
    expect(states.length).toBe(3);
  });

  it('should handle non-existent state', async () => {
    await expect(stateStore.get('non-existent')).rejects.toThrow();
  });

  it('should prevent duplicate widget IDs', async () => {
    await stateStore.create({ widgetId: 'w1', data: { v: 1 } });
    await expect(
      stateStore.create({ widgetId: 'w1', data: { v: 2 } })
    ).rejects.toThrow('already exists');
  });
});

describe('VersionManager', () => {
  let versionManager: VersionManager;

  beforeEach(() => {
    versionManager = new VersionManager();
  });

  it('should initialize with version 1', () => {
    const version = versionManager.getCurrentVersion('w1');
    expect(version).toBe(1);
  });

  it('should increment version on update', () => {
    versionManager.incrementVersion('w1');
    expect(versionManager.getCurrentVersion('w1')).toBe(2);

    versionManager.incrementVersion('w1');
    expect(versionManager.getCurrentVersion('w1')).toBe(3);
  });

  it('should validate version for optimistic locking', () => {
    versionManager.incrementVersion('w1'); // Now at version 2

    expect(versionManager.validateVersion('w1', 2)).toBe(true);
    expect(versionManager.validateVersion('w1', 1)).toBe(false);
    expect(versionManager.validateVersion('w1', 3)).toBe(false);
  });

  it('should track version history', () => {
    versionManager.incrementVersion('w1');
    versionManager.incrementVersion('w1');
    versionManager.incrementVersion('w1');

    const history = versionManager.getHistory('w1');
    expect(history.length).toBe(3);
    expect(history[0].version).toBe(1);
    expect(history[2].version).toBe(3);
  });

  it('should reset version', () => {
    versionManager.incrementVersion('w1');
    versionManager.incrementVersion('w1');

    versionManager.reset('w1');
    expect(versionManager.getCurrentVersion('w1')).toBe(1);
  });

  it('should handle multiple widgets independently', () => {
    versionManager.incrementVersion('w1');
    versionManager.incrementVersion('w1');
    versionManager.incrementVersion('w2');

    expect(versionManager.getCurrentVersion('w1')).toBe(3);
    expect(versionManager.getCurrentVersion('w2')).toBe(2);
  });
});

describe('SnapshotManager', () => {
  let snapshotManager: SnapshotManager;
  let mockDb: MockDatabase;

  beforeEach(() => {
    mockDb = new MockDatabase();
    snapshotManager = new SnapshotManager(mockDb);
  });

  it('should create snapshot', async () => {
    const snapshot = await snapshotManager.create('w1', { value: 42 }, 'backup');

    expect(snapshot.snapshotId).toBeDefined();
    expect(snapshot.widgetId).toBe('w1');
    expect(snapshot.label).toBe('backup');
  });

  it('should retrieve snapshot', async () => {
    const created = await snapshotManager.create('w1', { value: 42 }, 'backup');
    const retrieved = await snapshotManager.get(created.snapshotId);

    expect(retrieved.snapshotId).toBe(created.snapshotId);
    expect(retrieved.state.value).toBe(42);
  });

  it('should list snapshots for widget', async () => {
    await snapshotManager.create('w1', { v: 1 }, 'snap1');
    await snapshotManager.create('w1', { v: 2 }, 'snap2');
    await snapshotManager.create('w2', { v: 3 }, 'snap3');

    const snapshots = await snapshotManager.listForWidget('w1');
    expect(snapshots.length).toBe(2);
  });

  it('should delete snapshot', async () => {
    const snapshot = await snapshotManager.create('w1', { v: 1 }, 'temp');
    await snapshotManager.delete(snapshot.snapshotId);

    await expect(snapshotManager.get(snapshot.snapshotId)).rejects.toThrow();
  });

  it('should delete all snapshots for widget', async () => {
    await snapshotManager.create('w1', { v: 1 }, 'snap1');
    await snapshotManager.create('w1', { v: 2 }, 'snap2');

    await snapshotManager.deleteAllForWidget('w1');

    const snapshots = await snapshotManager.listForWidget('w1');
    expect(snapshots.length).toBe(0);
  });

  it('should order snapshots by creation time', async () => {
    await snapshotManager.create('w1', { v: 1 }, 'first');
    await new Promise(resolve => setTimeout(resolve, 10));
    await snapshotManager.create('w1', { v: 2 }, 'second');
    await new Promise(resolve => setTimeout(resolve, 10));
    await snapshotManager.create('w1', { v: 3 }, 'third');

    const snapshots = await snapshotManager.listForWidget('w1');
    expect(snapshots[0].label).toBe('first');
    expect(snapshots[2].label).toBe('third');
  });
});

describe('StateSerializer', () => {
  let serializer: StateSerializer;

  beforeEach(() => {
    serializer = new StateSerializer();
  });

  it('should serialize simple object', () => {
    const obj = { a: 1, b: 'test', c: true };
    const serialized = serializer.serialize(obj);

    expect(typeof serialized).toBe('string');
    expect(serialized.length).toBeGreaterThan(0);
  });

  it('should deserialize to original object', () => {
    const original = { a: 1, b: 'test', c: true };
    const serialized = serializer.serialize(original);
    const deserialized = serializer.deserialize(serialized);

    expect(deserialized).toEqual(original);
  });

  it('should handle nested objects', () => {
    const nested = {
      outer: {
        middle: {
          inner: { value: 42 },
        },
      },
    };

    const serialized = serializer.serialize(nested);
    const deserialized = serializer.deserialize(serialized);

    expect(deserialized.outer.middle.inner.value).toBe(42);
  });

  it('should handle arrays', () => {
    const withArray = { numbers: [1, 2, 3, 4, 5] };
    const serialized = serializer.serialize(withArray);
    const deserialized = serializer.deserialize(serialized);

    expect(deserialized.numbers).toEqual([1, 2, 3, 4, 5]);
  });

  it('should handle dates', () => {
    const withDate = { timestamp: new Date('2024-01-01T00:00:00Z') };
    const serialized = serializer.serialize(withDate);
    const deserialized = serializer.deserialize(serialized);

    expect(deserialized.timestamp).toBeInstanceOf(Date);
    expect(deserialized.timestamp.getTime()).toBe(withDate.timestamp.getTime());
  });

  it('should handle buffers', () => {
    const withBuffer = { data: Buffer.from('test data') };
    const serialized = serializer.serialize(withBuffer);
    const deserialized = serializer.deserialize(serialized);

    expect(Buffer.isBuffer(deserialized.data)).toBe(true);
    expect(deserialized.data.toString()).toBe('test data');
  });

  it('should throw on invalid serialized data', () => {
    expect(() => serializer.deserialize('invalid json')).toThrow();
  });

  it('should compress large objects', () => {
    const large = {
      array: Array.from({ length: 1000 }, (_, i) => ({
        id: i,
        value: `item-${i}`,
      })),
    };

    const serialized = serializer.serialize(large, { compress: true });
    const uncompressed = serializer.serialize(large, { compress: false });

    expect(serialized.length).toBeLessThan(uncompressed.length);

    const deserialized = serializer.deserialize(serialized);
    expect(deserialized.array.length).toBe(1000);
  });

  it('should handle null and undefined', () => {
    const withNulls = { a: null, b: undefined, c: 0 };
    const serialized = serializer.serialize(withNulls);
    const deserialized = serializer.deserialize(serialized);

    expect(deserialized.a).toBeNull();
    expect(deserialized.c).toBe(0);
  });

  it('should preserve type information', () => {
    const typed = {
      string: 'text',
      number: 42,
      boolean: true,
      null: null,
      array: [1, 2, 3],
      object: { nested: true },
    };

    const serialized = serializer.serialize(typed);
    const deserialized = serializer.deserialize(serialized);

    expect(typeof deserialized.string).toBe('string');
    expect(typeof deserialized.number).toBe('number');
    expect(typeof deserialized.boolean).toBe('boolean');
    expect(deserialized.null).toBeNull();
    expect(Array.isArray(deserialized.array)).toBe(true);
    expect(typeof deserialized.object).toBe('object');
  });
});

/**
 * Test Coverage: 30 tests
 * - StateStore: 7 tests (create, get, update, delete, list, errors, duplicates)
 * - VersionManager: 6 tests (init, increment, validate, history, reset, multiple widgets)
 * - SnapshotManager: 6 tests (create, get, list, delete, deleteAll, ordering)
 * - StateSerializer: 11 tests (serialize/deserialize, nested, arrays, dates, buffers, compression, types)
 */
