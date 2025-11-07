/**
 * Pact Consumer Contract Test - Widget Core → State Manager
 * Task: 57fbde - Comprehensive Test Framework / RDB-002
 * Layer 3: Contract Tests (Consumer Side)
 *
 * This test defines the contract between Widget Core (consumer)
 * and State Manager (provider) for widget state management.
 */

import { Pact } from '@pact-foundation/pact';
import { like, eachLike, term } from '@pact-foundation/pact/src/dsl/matchers';
import axios from 'axios';
import path from 'path';

// Initialize Pact
const provider = new Pact({
  consumer: 'WidgetCore',
  provider: 'StateManager',
  port: 8089,
  log: path.resolve(process.cwd(), 'logs', 'pact.log'),
  dir: path.resolve(process.cwd(), 'pacts'),
  logLevel: 'info',
});

describe('Widget Core → State Manager Contract', () => {
  // ===========================================================================
  // Setup and Teardown
  // ===========================================================================

  beforeAll(() => provider.setup());
  afterEach(() => provider.verify());
  afterAll(() => provider.finalize());

  // ===========================================================================
  // Widget State Contracts
  // ===========================================================================

  describe('Widget State Management', () => {
    it('should create widget state', async () => {
      // Given: State Manager is available
      await provider.addInteraction({
        state: 'state manager is available',
        uponReceiving: 'a request to create widget state',
        withRequest: {
          method: 'POST',
          path: '/api/v1/state/widgets',
          headers: {
            'Content-Type': 'application/json',
          },
          body: {
            widgetId: 'widget-123',
            state: {
              visible: true,
              enabled: true,
              label: 'Click Me',
              width: 100,
              height: 50,
              x: 0,
              y: 0,
            },
            metadata: {
              createdBy: 'widget-core',
              version: 1,
            },
          },
        },
        willRespondWith: {
          status: 201,
          headers: {
            'Content-Type': 'application/json',
          },
          body: {
            stateId: like('state-abc123'),
            widgetId: 'widget-123',
            version: 1,
            created: true,
          },
        },
      });

      // When: Widget Core creates state
      const response = await axios.post(
        'http://localhost:8089/api/v1/state/widgets',
        {
          widgetId: 'widget-123',
          state: {
            visible: true,
            enabled: true,
            label: 'Click Me',
            width: 100,
            height: 50,
            x: 0,
            y: 0,
          },
          metadata: {
            createdBy: 'widget-core',
            version: 1,
          },
        }
      );

      // Then: State is created
      expect(response.status).toBe(201);
      expect(response.data.stateId).toBeDefined();
      expect(response.data.created).toBe(true);
    });

    it('should retrieve widget state', async () => {
      // Given: Widget state state-abc123 exists
      await provider.addInteraction({
        state: 'widget state state-abc123 exists',
        uponReceiving: 'a request to retrieve widget state',
        withRequest: {
          method: 'GET',
          path: '/api/v1/state/widgets/widget-123',
        },
        willRespondWith: {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
          },
          body: {
            stateId: 'state-abc123',
            widgetId: 'widget-123',
            state: {
              visible: like(true),
              enabled: like(true),
              label: like('Click Me'),
              width: like(100),
              height: like(50),
              x: like(0),
              y: like(0),
            },
            version: 1,
            lastModified: like(1699564800000),
          },
        },
      });

      // When: Widget Core retrieves state
      const response = await axios.get(
        'http://localhost:8089/api/v1/state/widgets/widget-123'
      );

      // Then: State is returned
      expect(response.status).toBe(200);
      expect(response.data.widgetId).toBe('widget-123');
      expect(response.data.state).toBeDefined();
    });

    it('should update widget state', async () => {
      // Given: Widget state state-abc123 exists
      await provider.addInteraction({
        state: 'widget state state-abc123 exists',
        uponReceiving: 'a request to update widget state',
        withRequest: {
          method: 'PATCH',
          path: '/api/v1/state/widgets/widget-123',
          headers: {
            'Content-Type': 'application/json',
          },
          body: {
            state: {
              enabled: false,
              label: 'Updated Label',
            },
            version: 1,
          },
        },
        willRespondWith: {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
          },
          body: {
            stateId: 'state-abc123',
            widgetId: 'widget-123',
            version: 2,
            updated: true,
            changedFields: ['enabled', 'label'],
          },
        },
      });

      // When: Widget Core updates state
      const response = await axios.patch(
        'http://localhost:8089/api/v1/state/widgets/widget-123',
        {
          state: {
            enabled: false,
            label: 'Updated Label',
          },
          version: 1,
        }
      );

      // Then: State is updated
      expect(response.status).toBe(200);
      expect(response.data.updated).toBe(true);
      expect(response.data.version).toBe(2);
      expect(response.data.changedFields).toContain('enabled');
    });

    it('should delete widget state', async () => {
      // Given: Widget state state-abc123 exists
      await provider.addInteraction({
        state: 'widget state state-abc123 exists',
        uponReceiving: 'a request to delete widget state',
        withRequest: {
          method: 'DELETE',
          path: '/api/v1/state/widgets/widget-123',
        },
        willRespondWith: {
          status: 204,
        },
      });

      // When: Widget Core deletes state
      const response = await axios.delete(
        'http://localhost:8089/api/v1/state/widgets/widget-123'
      );

      // Then: State is deleted
      expect(response.status).toBe(204);
    });
  });

  // ===========================================================================
  // State Snapshots Contracts
  // ===========================================================================

  describe('State Snapshots', () => {
    it('should create state snapshot', async () => {
      // Given: Widget state state-abc123 exists
      await provider.addInteraction({
        state: 'widget state state-abc123 exists',
        uponReceiving: 'a request to create state snapshot',
        withRequest: {
          method: 'POST',
          path: '/api/v1/state/widgets/widget-123/snapshots',
          headers: {
            'Content-Type': 'application/json',
          },
          body: {
            label: 'Pre-update snapshot',
            metadata: {
              reason: 'before_major_change',
              createdBy: 'widget-core',
            },
          },
        },
        willRespondWith: {
          status: 201,
          headers: {
            'Content-Type': 'application/json',
          },
          body: {
            snapshotId: like('snap-def456'),
            widgetId: 'widget-123',
            stateVersion: 1,
            label: 'Pre-update snapshot',
            createdAt: like(1699564800000),
          },
        },
      });

      // When: Widget Core creates snapshot
      const response = await axios.post(
        'http://localhost:8089/api/v1/state/widgets/widget-123/snapshots',
        {
          label: 'Pre-update snapshot',
          metadata: {
            reason: 'before_major_change',
            createdBy: 'widget-core',
          },
        }
      );

      // Then: Snapshot is created
      expect(response.status).toBe(201);
      expect(response.data.snapshotId).toBeDefined();
      expect(response.data.label).toBe('Pre-update snapshot');
    });

    it('should restore from snapshot', async () => {
      // Given: Snapshot snap-def456 exists
      await provider.addInteraction({
        state: 'snapshot snap-def456 exists',
        uponReceiving: 'a request to restore from snapshot',
        withRequest: {
          method: 'POST',
          path: '/api/v1/state/widgets/widget-123/restore',
          headers: {
            'Content-Type': 'application/json',
          },
          body: {
            snapshotId: 'snap-def456',
          },
        },
        willRespondWith: {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
          },
          body: {
            stateId: like('state-abc123'),
            widgetId: 'widget-123',
            version: like(3),
            restored: true,
            previousVersion: 2,
          },
        },
      });

      // When: Widget Core restores snapshot
      const response = await axios.post(
        'http://localhost:8089/api/v1/state/widgets/widget-123/restore',
        {
          snapshotId: 'snap-def456',
        }
      );

      // Then: State is restored
      expect(response.status).toBe(200);
      expect(response.data.restored).toBe(true);
      expect(response.data.version).toBeGreaterThan(response.data.previousVersion);
    });

    it('should list snapshots for widget', async () => {
      // Given: Snapshots exist for widget-123
      await provider.addInteraction({
        state: 'snapshots exist for widget-123',
        uponReceiving: 'a request to list snapshots',
        withRequest: {
          method: 'GET',
          path: '/api/v1/state/widgets/widget-123/snapshots',
        },
        willRespondWith: {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
          },
          body: {
            snapshots: eachLike({
              snapshotId: like('snap-def456'),
              widgetId: 'widget-123',
              stateVersion: like(1),
              label: like('Pre-update snapshot'),
              createdAt: like(1699564800000),
            }),
            total: like(3),
          },
        },
      });

      // When: Widget Core lists snapshots
      const response = await axios.get(
        'http://localhost:8089/api/v1/state/widgets/widget-123/snapshots'
      );

      // Then: Snapshots are returned
      expect(response.status).toBe(200);
      expect(response.data.snapshots).toBeInstanceOf(Array);
      expect(response.data.total).toBeGreaterThan(0);
    });
  });

  // ===========================================================================
  // State History Contracts
  // ===========================================================================

  describe('State History', () => {
    it('should retrieve state history', async () => {
      // Given: Widget state state-abc123 exists
      await provider.addInteraction({
        state: 'widget state state-abc123 exists',
        uponReceiving: 'a request for state history',
        withRequest: {
          method: 'GET',
          path: '/api/v1/state/widgets/widget-123/history',
          query: {
            limit: '10',
          },
        },
        willRespondWith: {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
          },
          body: {
            history: eachLike({
              version: like(2),
              changedFields: eachLike('enabled'),
              previousValues: {
                enabled: like(true),
              },
              newValues: {
                enabled: like(false),
              },
              timestamp: like(1699564800000),
              changedBy: like('widget-core'),
            }),
            total: like(5),
          },
        },
      });

      // When: Widget Core retrieves history
      const response = await axios.get(
        'http://localhost:8089/api/v1/state/widgets/widget-123/history',
        {
          params: { limit: '10' },
        }
      );

      // Then: History is returned
      expect(response.status).toBe(200);
      expect(response.data.history).toBeInstanceOf(Array);
      expect(response.data.total).toBeGreaterThan(0);
    });

    it('should retrieve specific version', async () => {
      // Given: Widget state version 2 exists
      await provider.addInteraction({
        state: 'widget state version 2 exists',
        uponReceiving: 'a request for specific version',
        withRequest: {
          method: 'GET',
          path: '/api/v1/state/widgets/widget-123/versions/2',
        },
        willRespondWith: {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
          },
          body: {
            stateId: 'state-abc123',
            widgetId: 'widget-123',
            version: 2,
            state: {
              visible: like(true),
              enabled: like(false),
              label: like('Updated Label'),
            },
            timestamp: like(1699564800000),
          },
        },
      });

      // When: Widget Core retrieves specific version
      const response = await axios.get(
        'http://localhost:8089/api/v1/state/widgets/widget-123/versions/2'
      );

      // Then: Version is returned
      expect(response.status).toBe(200);
      expect(response.data.version).toBe(2);
      expect(response.data.state).toBeDefined();
    });
  });

  // ===========================================================================
  // State Watching Contracts
  // ===========================================================================

  describe('State Watching', () => {
    it('should register state watch', async () => {
      // Given: State Manager is available
      await provider.addInteraction({
        state: 'state manager is available',
        uponReceiving: 'a request to watch widget state',
        withRequest: {
          method: 'POST',
          path: '/api/v1/state/watches',
          headers: {
            'Content-Type': 'application/json',
          },
          body: {
            widgetId: 'widget-123',
            watchFields: ['enabled', 'visible'],
            callbackUrl: 'http://widget-core:8081/api/v1/state/callback',
          },
        },
        willRespondWith: {
          status: 201,
          headers: {
            'Content-Type': 'application/json',
          },
          body: {
            watchId: like('watch-ghi789'),
            widgetId: 'widget-123',
            watchFields: ['enabled', 'visible'],
            active: true,
          },
        },
      });

      // When: Widget Core registers watch
      const response = await axios.post(
        'http://localhost:8089/api/v1/state/watches',
        {
          widgetId: 'widget-123',
          watchFields: ['enabled', 'visible'],
          callbackUrl: 'http://widget-core:8081/api/v1/state/callback',
        }
      );

      // Then: Watch is created
      expect(response.status).toBe(201);
      expect(response.data.watchId).toBeDefined();
      expect(response.data.active).toBe(true);
    });

    it('should unregister state watch', async () => {
      // Given: Watch watch-ghi789 exists
      await provider.addInteraction({
        state: 'watch watch-ghi789 exists',
        uponReceiving: 'a request to unwatch widget state',
        withRequest: {
          method: 'DELETE',
          path: '/api/v1/state/watches/watch-ghi789',
        },
        willRespondWith: {
          status: 204,
        },
      });

      // When: Widget Core unregisters watch
      const response = await axios.delete(
        'http://localhost:8089/api/v1/state/watches/watch-ghi789'
      );

      // Then: Watch is removed
      expect(response.status).toBe(204);
    });
  });

  // ===========================================================================
  // Optimistic Concurrency Control Contracts
  // ===========================================================================

  describe('Optimistic Concurrency', () => {
    it('should reject update with stale version', async () => {
      // Given: Widget state state-abc123 is at version 5
      await provider.addInteraction({
        state: 'widget state state-abc123 is at version 5',
        uponReceiving: 'a request to update with stale version',
        withRequest: {
          method: 'PATCH',
          path: '/api/v1/state/widgets/widget-123',
          headers: {
            'Content-Type': 'application/json',
          },
          body: {
            state: {
              enabled: false,
            },
            version: 3, // Stale version
          },
        },
        willRespondWith: {
          status: 409,
          headers: {
            'Content-Type': 'application/json',
          },
          body: {
            error: 'Optimistic lock failure',
            currentVersion: 5,
            attemptedVersion: 3,
            message: like('State has been modified by another process'),
          },
        },
      });

      // When: Widget Core attempts update with stale version
      try {
        await axios.patch(
          'http://localhost:8089/api/v1/state/widgets/widget-123',
          {
            state: {
              enabled: false,
            },
            version: 3,
          }
        );
        fail('Expected request to fail');
      } catch (error: any) {
        // Then: Conflict error is returned
        expect(error.response.status).toBe(409);
        expect(error.response.data.error).toBe('Optimistic lock failure');
        expect(error.response.data.currentVersion).toBe(5);
      }
    });
  });

  // ===========================================================================
  // Error Handling Contracts
  // ===========================================================================

  describe('Error Handling', () => {
    it('should return 404 for non-existent widget state', async () => {
      // Given: Widget state does not exist
      await provider.addInteraction({
        state: 'widget state does not exist',
        uponReceiving: 'a request for non-existent widget state',
        withRequest: {
          method: 'GET',
          path: '/api/v1/state/widgets/widget-999',
        },
        willRespondWith: {
          status: 404,
          headers: {
            'Content-Type': 'application/json',
          },
          body: {
            error: 'Widget state not found',
            widgetId: 'widget-999',
          },
        },
      });

      // When: Widget Core requests non-existent state
      try {
        await axios.get(
          'http://localhost:8089/api/v1/state/widgets/widget-999'
        );
        fail('Expected request to fail');
      } catch (error: any) {
        // Then: Not found error is returned
        expect(error.response.status).toBe(404);
        expect(error.response.data.error).toBe('Widget state not found');
      }
    });

    it('should reject invalid state data', async () => {
      // Given: State Manager is available
      await provider.addInteraction({
        state: 'state manager is available',
        uponReceiving: 'a request with invalid state data',
        withRequest: {
          method: 'POST',
          path: '/api/v1/state/widgets',
          headers: {
            'Content-Type': 'application/json',
          },
          body: {
            widgetId: 'widget-123',
            state: {
              // Invalid: negative dimensions
              width: -100,
              height: -50,
            },
          },
        },
        willRespondWith: {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
          },
          body: {
            error: 'Invalid state data',
            validationErrors: eachLike({
              field: like('width'),
              message: like('Value must be positive'),
            }),
          },
        },
      });

      // When: Widget Core sends invalid state
      try {
        await axios.post('http://localhost:8089/api/v1/state/widgets', {
          widgetId: 'widget-123',
          state: {
            width: -100,
            height: -50,
          },
        });
        fail('Expected request to fail');
      } catch (error: any) {
        // Then: Validation error is returned
        expect(error.response.status).toBe(400);
        expect(error.response.data.error).toBe('Invalid state data');
        expect(error.response.data.validationErrors).toBeInstanceOf(Array);
      }
    });
  });
});

/**
 * Usage Instructions:
 *
 * 1. Install dependencies:
 *    npm install
 *
 * 2. Run consumer tests (generates contract):
 *    npm test
 *
 * 3. Publish contract to Pact Broker:
 *    npm run pact:publish:local
 *
 * 4. View contract in Pact Broker:
 *    http://localhost:9292/pacts/provider/StateManager/consumer/WidgetCore/latest
 *
 * 5. Provider verification:
 *    See ../providers/state-manager/pact-verification.test.ts
 *
 * Contract States Required by Provider:
 * - "state manager is available"
 * - "widget state state-abc123 exists"
 * - "snapshot snap-def456 exists"
 * - "snapshots exist for widget-123"
 * - "widget state version 2 exists"
 * - "watch watch-ghi789 exists"
 * - "widget state state-abc123 is at version 5"
 * - "widget state does not exist"
 *
 * Test Coverage:
 * - Widget state management (4 tests)
 * - State snapshots (3 tests)
 * - State history (2 tests)
 * - State watching (2 tests)
 * - Optimistic concurrency (1 test)
 * - Error handling (2 tests)
 * Total: 14 tests
 */
