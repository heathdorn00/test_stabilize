/**
 * Pact Consumer Contract Test - State Manager → Event Dispatcher
 * Task: 57fbde - Comprehensive Test Framework / RDB-002
 * Layer 3: Contract Tests (Consumer Side)
 *
 * This test defines the contract between State Manager (consumer)
 * and Event Dispatcher (provider) for state change notifications.
 */

import { Pact } from '@pact-foundation/pact';
import { like, eachLike, term } from '@pact-foundation/pact/src/dsl/matchers';
import axios from 'axios';
import path from 'path';

// Initialize Pact
const provider = new Pact({
  consumer: 'StateManager',
  provider: 'EventDispatcher',
  port: 8088,
  log: path.resolve(process.cwd(), 'logs', 'pact.log'),
  dir: path.resolve(process.cwd(), 'pacts'),
  logLevel: 'info',
});

describe('State Manager → Event Dispatcher Contract', () => {
  // ===========================================================================
  // Setup and Teardown
  // ===========================================================================

  beforeAll(() => provider.setup());
  afterEach(() => provider.verify());
  afterAll(() => provider.finalize());

  // ===========================================================================
  // State Change Event Contracts
  // ===========================================================================

  describe('State Change Events', () => {
    it('should dispatch widget state change event', async () => {
      // Given: Event Dispatcher is available
      await provider.addInteraction({
        state: 'event dispatcher is available',
        uponReceiving: 'a widget state change event',
        withRequest: {
          method: 'POST',
          path: '/api/v1/dispatch/events',
          headers: {
            'Content-Type': 'application/json',
          },
          body: {
            eventType: 'state.widget.changed',
            timestamp: like(1699564800000),
            source: 'state-manager',
            entityId: 'widget-123',
            data: {
              widgetId: 'widget-123',
              previousState: {
                visible: true,
                enabled: false,
              },
              newState: {
                visible: true,
                enabled: true,
              },
              changedFields: ['enabled'],
            },
          },
        },
        willRespondWith: {
          status: 202,
          headers: {
            'Content-Type': 'application/json',
          },
          body: {
            dispatchId: like('dispatch-abc123'),
            accepted: true,
            subscriberCount: like(3),
          },
        },
      });

      // When: State Manager dispatches state change
      const response = await axios.post(
        'http://localhost:8088/api/v1/dispatch/events',
        {
          eventType: 'state.widget.changed',
          timestamp: 1699564800000,
          source: 'state-manager',
          entityId: 'widget-123',
          data: {
            widgetId: 'widget-123',
            previousState: {
              visible: true,
              enabled: false,
            },
            newState: {
              visible: true,
              enabled: true,
            },
            changedFields: ['enabled'],
          },
        }
      );

      // Then: Event is dispatched
      expect(response.status).toBe(202);
      expect(response.data.dispatchId).toBeDefined();
      expect(response.data.accepted).toBe(true);
    });

    it('should dispatch application state change event', async () => {
      // Given: Event Dispatcher is available
      await provider.addInteraction({
        state: 'event dispatcher is available',
        uponReceiving: 'an application state change event',
        withRequest: {
          method: 'POST',
          path: '/api/v1/dispatch/events',
          headers: {
            'Content-Type': 'application/json',
          },
          body: {
            eventType: 'state.application.changed',
            timestamp: like(1699564800000),
            source: 'state-manager',
            entityId: 'app',
            data: {
              previousState: 'running',
              newState: 'paused',
              reason: 'user_requested',
            },
          },
        },
        willRespondWith: {
          status: 202,
          headers: {
            'Content-Type': 'application/json',
          },
          body: {
            dispatchId: like('dispatch-def456'),
            accepted: true,
            subscriberCount: like(5),
          },
        },
      });

      // When: State Manager dispatches app state change
      const response = await axios.post(
        'http://localhost:8088/api/v1/dispatch/events',
        {
          eventType: 'state.application.changed',
          timestamp: 1699564800000,
          source: 'state-manager',
          entityId: 'app',
          data: {
            previousState: 'running',
            newState: 'paused',
            reason: 'user_requested',
          },
        }
      );

      // Then: Event is dispatched
      expect(response.status).toBe(202);
      expect(response.data.accepted).toBe(true);
    });

    it('should batch dispatch multiple state changes', async () => {
      // Given: Event Dispatcher is available
      await provider.addInteraction({
        state: 'event dispatcher is available',
        uponReceiving: 'a batch of state change events',
        withRequest: {
          method: 'POST',
          path: '/api/v1/dispatch/events/batch',
          headers: {
            'Content-Type': 'application/json',
          },
          body: {
            events: eachLike({
              eventType: like('state.widget.changed'),
              timestamp: like(1699564800000),
              source: 'state-manager',
              entityId: like('widget-123'),
              data: {
                widgetId: like('widget-123'),
                changedFields: eachLike('visible'),
              },
            }),
          },
        },
        willRespondWith: {
          status: 202,
          headers: {
            'Content-Type': 'application/json',
          },
          body: {
            batchId: like('batch-ghi789'),
            accepted: true,
            eventCount: like(10),
            totalSubscribers: like(15),
          },
        },
      });

      // When: State Manager dispatches batch
      const response = await axios.post(
        'http://localhost:8088/api/v1/dispatch/events/batch',
        {
          events: [
            {
              eventType: 'state.widget.changed',
              timestamp: 1699564800000,
              source: 'state-manager',
              entityId: 'widget-123',
              data: {
                widgetId: 'widget-123',
                changedFields: ['visible'],
              },
            },
            {
              eventType: 'state.widget.changed',
              timestamp: 1699564800010,
              source: 'state-manager',
              entityId: 'widget-456',
              data: {
                widgetId: 'widget-456',
                changedFields: ['enabled'],
              },
            },
          ],
        }
      );

      // Then: Batch is dispatched
      expect(response.status).toBe(202);
      expect(response.data.batchId).toBeDefined();
      expect(response.data.accepted).toBe(true);
    });
  });

  // ===========================================================================
  // Subscription Management Contracts
  // ===========================================================================

  describe('Subscription Management', () => {
    it('should subscribe to state change events', async () => {
      // Given: Event Dispatcher is available
      await provider.addInteraction({
        state: 'event dispatcher is available',
        uponReceiving: 'a subscription request',
        withRequest: {
          method: 'POST',
          path: '/api/v1/dispatch/subscriptions',
          headers: {
            'Content-Type': 'application/json',
          },
          body: {
            subscriberId: 'ui-renderer',
            eventPatterns: ['state.widget.*', 'state.application.*'],
            callbackUrl: 'http://ui-renderer:8085/api/v1/events/callback',
            filters: {
              entityIds: ['widget-123', 'widget-456'],
            },
          },
        },
        willRespondWith: {
          status: 201,
          headers: {
            'Content-Type': 'application/json',
          },
          body: {
            subscriptionId: like('sub-jkl012'),
            subscriberId: 'ui-renderer',
            eventPatterns: ['state.widget.*', 'state.application.*'],
            active: true,
          },
        },
      });

      // When: State Manager subscribes on behalf of service
      const response = await axios.post(
        'http://localhost:8088/api/v1/dispatch/subscriptions',
        {
          subscriberId: 'ui-renderer',
          eventPatterns: ['state.widget.*', 'state.application.*'],
          callbackUrl: 'http://ui-renderer:8085/api/v1/events/callback',
          filters: {
            entityIds: ['widget-123', 'widget-456'],
          },
        }
      );

      // Then: Subscription is created
      expect(response.status).toBe(201);
      expect(response.data.subscriptionId).toBeDefined();
      expect(response.data.active).toBe(true);
    });

    it('should update subscription filters', async () => {
      // Given: Subscription sub-jkl012 exists
      await provider.addInteraction({
        state: 'subscription sub-jkl012 exists',
        uponReceiving: 'a request to update subscription',
        withRequest: {
          method: 'PUT',
          path: '/api/v1/dispatch/subscriptions/sub-jkl012',
          headers: {
            'Content-Type': 'application/json',
          },
          body: {
            filters: {
              entityIds: ['widget-789'],
              eventTypes: ['state.widget.changed'],
            },
          },
        },
        willRespondWith: {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
          },
          body: {
            subscriptionId: 'sub-jkl012',
            updated: true,
          },
        },
      });

      // When: State Manager updates subscription
      const response = await axios.put(
        'http://localhost:8088/api/v1/dispatch/subscriptions/sub-jkl012',
        {
          filters: {
            entityIds: ['widget-789'],
            eventTypes: ['state.widget.changed'],
          },
        }
      );

      // Then: Subscription is updated
      expect(response.status).toBe(200);
      expect(response.data.updated).toBe(true);
    });

    it('should unsubscribe from events', async () => {
      // Given: Subscription sub-jkl012 exists
      await provider.addInteraction({
        state: 'subscription sub-jkl012 exists',
        uponReceiving: 'a request to unsubscribe',
        withRequest: {
          method: 'DELETE',
          path: '/api/v1/dispatch/subscriptions/sub-jkl012',
        },
        willRespondWith: {
          status: 204,
        },
      });

      // When: State Manager unsubscribes
      const response = await axios.delete(
        'http://localhost:8088/api/v1/dispatch/subscriptions/sub-jkl012'
      );

      // Then: Subscription is removed
      expect(response.status).toBe(204);
    });

    it('should list active subscriptions', async () => {
      // Given: Subscriptions exist
      await provider.addInteraction({
        state: 'subscriptions exist',
        uponReceiving: 'a request to list subscriptions',
        withRequest: {
          method: 'GET',
          path: '/api/v1/dispatch/subscriptions',
          query: {
            active: 'true',
          },
        },
        willRespondWith: {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
          },
          body: {
            subscriptions: eachLike({
              subscriptionId: like('sub-jkl012'),
              subscriberId: like('ui-renderer'),
              eventPatterns: eachLike('state.widget.*'),
              active: true,
            }),
            total: like(5),
          },
        },
      });

      // When: State Manager lists subscriptions
      const response = await axios.get(
        'http://localhost:8088/api/v1/dispatch/subscriptions',
        {
          params: { active: 'true' },
        }
      );

      // Then: Subscriptions are returned
      expect(response.status).toBe(200);
      expect(response.data.subscriptions).toBeInstanceOf(Array);
      expect(response.data.total).toBeGreaterThan(0);
    });
  });

  // ===========================================================================
  // Delivery Status Contracts
  // ===========================================================================

  describe('Delivery Status', () => {
    it('should retrieve dispatch status', async () => {
      // Given: Dispatch dispatch-abc123 exists
      await provider.addInteraction({
        state: 'dispatch dispatch-abc123 exists',
        uponReceiving: 'a request for dispatch status',
        withRequest: {
          method: 'GET',
          path: '/api/v1/dispatch/status/dispatch-abc123',
        },
        willRespondWith: {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
          },
          body: {
            dispatchId: 'dispatch-abc123',
            eventType: 'state.widget.changed',
            status: 'completed',
            totalSubscribers: 3,
            successfulDeliveries: 3,
            failedDeliveries: 0,
            completedAt: like(1699564800500),
          },
        },
      });

      // When: State Manager checks dispatch status
      const response = await axios.get(
        'http://localhost:8088/api/v1/dispatch/status/dispatch-abc123'
      );

      // Then: Status is returned
      expect(response.status).toBe(200);
      expect(response.data.status).toBe('completed');
      expect(response.data.successfulDeliveries).toBe(3);
    });

    it('should retrieve delivery failures', async () => {
      // Given: Dispatch with failures exists
      await provider.addInteraction({
        state: 'dispatch with failures exists',
        uponReceiving: 'a request for delivery failures',
        withRequest: {
          method: 'GET',
          path: '/api/v1/dispatch/failures',
          query: {
            since: '1h',
          },
        },
        willRespondWith: {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
          },
          body: {
            failures: eachLike({
              dispatchId: like('dispatch-xyz789'),
              subscriberId: like('widget-core'),
              eventType: like('state.widget.changed'),
              errorCode: like('TIMEOUT'),
              errorMessage: like('Delivery timeout after 30s'),
              attemptCount: like(3),
              timestamp: like(1699564800000),
            }),
            total: like(5),
          },
        },
      });

      // When: State Manager retrieves failures
      const response = await axios.get(
        'http://localhost:8088/api/v1/dispatch/failures',
        {
          params: { since: '1h' },
        }
      );

      // Then: Failures are returned
      expect(response.status).toBe(200);
      expect(response.data.failures).toBeInstanceOf(Array);
      expect(response.data.total).toBeGreaterThan(0);
    });
  });

  // ===========================================================================
  // Priority Dispatching Contracts
  // ===========================================================================

  describe('Priority Dispatching', () => {
    it('should dispatch high-priority event', async () => {
      // Given: Event Dispatcher is available
      await provider.addInteraction({
        state: 'event dispatcher is available',
        uponReceiving: 'a high-priority state change event',
        withRequest: {
          method: 'POST',
          path: '/api/v1/dispatch/events',
          headers: {
            'Content-Type': 'application/json',
            'X-Priority': 'high',
          },
          body: {
            eventType: 'state.application.changed',
            timestamp: like(1699564800000),
            source: 'state-manager',
            entityId: 'app',
            priority: 'high',
            data: {
              previousState: 'running',
              newState: 'crashed',
              errorCode: 'FATAL_ERROR',
            },
          },
        },
        willRespondWith: {
          status: 202,
          headers: {
            'Content-Type': 'application/json',
            'X-Processing-Priority': 'high',
          },
          body: {
            dispatchId: like('dispatch-priority-001'),
            accepted: true,
            priority: 'high',
            estimatedDelivery: like(100),
          },
        },
      });

      // When: State Manager dispatches high-priority event
      const response = await axios.post(
        'http://localhost:8088/api/v1/dispatch/events',
        {
          eventType: 'state.application.changed',
          timestamp: 1699564800000,
          source: 'state-manager',
          entityId: 'app',
          priority: 'high',
          data: {
            previousState: 'running',
            newState: 'crashed',
            errorCode: 'FATAL_ERROR',
          },
        },
        {
          headers: {
            'X-Priority': 'high',
          },
        }
      );

      // Then: Event is dispatched with high priority
      expect(response.status).toBe(202);
      expect(response.data.priority).toBe('high');
      expect(response.headers['x-processing-priority']).toBe('high');
    });
  });

  // ===========================================================================
  // Error Handling Contracts
  // ===========================================================================

  describe('Error Handling', () => {
    it('should reject event with invalid format', async () => {
      // Given: Event Dispatcher is available
      await provider.addInteraction({
        state: 'event dispatcher is available',
        uponReceiving: 'an event with invalid format',
        withRequest: {
          method: 'POST',
          path: '/api/v1/dispatch/events',
          headers: {
            'Content-Type': 'application/json',
          },
          body: {
            eventType: 'invalid',
            // Missing required fields
          },
        },
        willRespondWith: {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
          },
          body: {
            error: 'Invalid event format',
            missingFields: eachLike('timestamp'),
          },
        },
      });

      // When: State Manager sends invalid event
      try {
        await axios.post('http://localhost:8088/api/v1/dispatch/events', {
          eventType: 'invalid',
        });
        fail('Expected request to fail');
      } catch (error: any) {
        // Then: Validation error is returned
        expect(error.response.status).toBe(400);
        expect(error.response.data.error).toBe('Invalid event format');
      }
    });

    it('should handle dispatcher unavailability', async () => {
      // Given: Event Dispatcher is overloaded
      await provider.addInteraction({
        state: 'event dispatcher is overloaded',
        uponReceiving: 'an event when dispatcher is overloaded',
        withRequest: {
          method: 'POST',
          path: '/api/v1/dispatch/events',
          headers: {
            'Content-Type': 'application/json',
          },
          body: {
            eventType: 'state.widget.changed',
            timestamp: like(1699564800000),
            source: 'state-manager',
            entityId: 'widget-123',
            data: {
              widgetId: 'widget-123',
              changedFields: ['enabled'],
            },
          },
        },
        willRespondWith: {
          status: 503,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': '10',
          },
          body: {
            error: 'Dispatcher overloaded',
            currentLoad: like(95),
            retryAfter: 10,
          },
        },
      });

      // When: State Manager attempts dispatch during overload
      try {
        await axios.post('http://localhost:8088/api/v1/dispatch/events', {
          eventType: 'state.widget.changed',
          timestamp: 1699564800000,
          source: 'state-manager',
          entityId: 'widget-123',
          data: {
            widgetId: 'widget-123',
            changedFields: ['enabled'],
          },
        });
        fail('Expected request to fail');
      } catch (error: any) {
        // Then: Service unavailable error is returned
        expect(error.response.status).toBe(503);
        expect(error.response.data.error).toBe('Dispatcher overloaded');
        expect(error.response.headers['retry-after']).toBe('10');
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
 *    http://localhost:9292/pacts/provider/EventDispatcher/consumer/StateManager/latest
 *
 * 5. Provider verification:
 *    See ../providers/event-dispatcher/pact-verification.test.ts
 *
 * Contract States Required by Provider:
 * - "event dispatcher is available"
 * - "subscription sub-jkl012 exists"
 * - "subscriptions exist"
 * - "dispatch dispatch-abc123 exists"
 * - "dispatch with failures exists"
 * - "event dispatcher is overloaded"
 *
 * Test Coverage:
 * - State change events (3 tests)
 * - Subscription management (4 tests)
 * - Delivery status (2 tests)
 * - Priority dispatching (1 test)
 * - Error handling (2 tests)
 * Total: 12 tests
 */
