/**
 * Pact Consumer Contract Test - Input Handler → Event Processor
 * Task: 57fbde - Comprehensive Test Framework / RDB-002
 * Layer 3: Contract Tests (Consumer Side)
 *
 * This test defines the contract between Input Handler (consumer)
 * and Event Processor (provider) for event processing and dispatching.
 */

import { Pact } from '@pact-foundation/pact';
import { like, eachLike, term } from '@pact-foundation/pact/src/dsl/matchers';
import axios from 'axios';
import path from 'path';

// Initialize Pact
const provider = new Pact({
  consumer: 'InputHandler',
  provider: 'EventProcessor',
  port: 8087,
  log: path.resolve(process.cwd(), 'logs', 'pact.log'),
  dir: path.resolve(process.cwd(), 'pacts'),
  logLevel: 'info',
});

describe('Input Handler → Event Processor Contract', () => {
  // ===========================================================================
  // Setup and Teardown
  // ===========================================================================

  beforeAll(() => provider.setup());
  afterEach(() => provider.verify());
  afterAll(() => provider.finalize());

  // ===========================================================================
  // Event Processing Contracts
  // ===========================================================================

  describe('Event Processing', () => {
    it('should process mouse click event', async () => {
      // Given: Event Processor is available
      await provider.addInteraction({
        state: 'event processor is available',
        uponReceiving: 'a mouse click event',
        withRequest: {
          method: 'POST',
          path: '/api/v1/events/process',
          headers: {
            'Content-Type': 'application/json',
          },
          body: {
            eventType: 'mouse.click',
            timestamp: like(1699564800000),
            source: 'input-handler',
            data: {
              x: 150,
              y: 200,
              button: 'left',
              modifiers: ['ctrl'],
            },
          },
        },
        willRespondWith: {
          status: 202,
          headers: {
            'Content-Type': 'application/json',
          },
          body: {
            eventId: like('evt-12345'),
            accepted: true,
            processedAt: like(1699564800100),
          },
        },
      });

      // When: Input Handler sends mouse click
      const response = await axios.post(
        'http://localhost:8087/api/v1/events/process',
        {
          eventType: 'mouse.click',
          timestamp: 1699564800000,
          source: 'input-handler',
          data: {
            x: 150,
            y: 200,
            button: 'left',
            modifiers: ['ctrl'],
          },
        }
      );

      // Then: Event is accepted
      expect(response.status).toBe(202);
      expect(response.data.eventId).toBeDefined();
      expect(response.data.accepted).toBe(true);
    });

    it('should process keyboard event', async () => {
      // Given: Event Processor is available
      await provider.addInteraction({
        state: 'event processor is available',
        uponReceiving: 'a keyboard event',
        withRequest: {
          method: 'POST',
          path: '/api/v1/events/process',
          headers: {
            'Content-Type': 'application/json',
          },
          body: {
            eventType: 'keyboard.keydown',
            timestamp: like(1699564800000),
            source: 'input-handler',
            data: {
              key: 'Enter',
              code: 'Enter',
              modifiers: [],
              repeat: false,
            },
          },
        },
        willRespondWith: {
          status: 202,
          headers: {
            'Content-Type': 'application/json',
          },
          body: {
            eventId: like('evt-67890'),
            accepted: true,
            processedAt: like(1699564800100),
          },
        },
      });

      // When: Input Handler sends keyboard event
      const response = await axios.post(
        'http://localhost:8087/api/v1/events/process',
        {
          eventType: 'keyboard.keydown',
          timestamp: 1699564800000,
          source: 'input-handler',
          data: {
            key: 'Enter',
            code: 'Enter',
            modifiers: [],
            repeat: false,
          },
        }
      );

      // Then: Event is accepted
      expect(response.status).toBe(202);
      expect(response.data.accepted).toBe(true);
    });

    it('should process touch event', async () => {
      // Given: Event Processor is available
      await provider.addInteraction({
        state: 'event processor is available',
        uponReceiving: 'a touch event',
        withRequest: {
          method: 'POST',
          path: '/api/v1/events/process',
          headers: {
            'Content-Type': 'application/json',
          },
          body: {
            eventType: 'touch.start',
            timestamp: like(1699564800000),
            source: 'input-handler',
            data: {
              touches: [
                {
                  id: 1,
                  x: 100,
                  y: 150,
                  pressure: 0.5,
                },
              ],
            },
          },
        },
        willRespondWith: {
          status: 202,
          headers: {
            'Content-Type': 'application/json',
          },
          body: {
            eventId: like('evt-touch-001'),
            accepted: true,
            processedAt: like(1699564800100),
          },
        },
      });

      // When: Input Handler sends touch event
      const response = await axios.post(
        'http://localhost:8087/api/v1/events/process',
        {
          eventType: 'touch.start',
          timestamp: 1699564800000,
          source: 'input-handler',
          data: {
            touches: [
              {
                id: 1,
                x: 100,
                y: 150,
                pressure: 0.5,
              },
            ],
          },
        }
      );

      // Then: Event is accepted
      expect(response.status).toBe(202);
      expect(response.data.accepted).toBe(true);
    });

    it('should batch process multiple events', async () => {
      // Given: Event Processor is available
      await provider.addInteraction({
        state: 'event processor is available',
        uponReceiving: 'a batch of events',
        withRequest: {
          method: 'POST',
          path: '/api/v1/events/process/batch',
          headers: {
            'Content-Type': 'application/json',
          },
          body: {
            events: eachLike({
              eventType: like('mouse.move'),
              timestamp: like(1699564800000),
              source: 'input-handler',
              data: {
                x: like(100),
                y: like(150),
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
            batchId: like('batch-abc123'),
            accepted: true,
            eventCount: like(5),
            processedAt: like(1699564800100),
          },
        },
      });

      // When: Input Handler sends batch
      const response = await axios.post(
        'http://localhost:8087/api/v1/events/process/batch',
        {
          events: [
            {
              eventType: 'mouse.move',
              timestamp: 1699564800000,
              source: 'input-handler',
              data: { x: 100, y: 150 },
            },
            {
              eventType: 'mouse.move',
              timestamp: 1699564800010,
              source: 'input-handler',
              data: { x: 105, y: 155 },
            },
          ],
        }
      );

      // Then: Batch is accepted
      expect(response.status).toBe(202);
      expect(response.data.batchId).toBeDefined();
      expect(response.data.accepted).toBe(true);
    });
  });

  // ===========================================================================
  // Event Routing Contracts
  // ===========================================================================

  describe('Event Routing', () => {
    it('should register event route', async () => {
      // Given: Event Processor is available
      await provider.addInteraction({
        state: 'event processor is available',
        uponReceiving: 'a request to register event route',
        withRequest: {
          method: 'POST',
          path: '/api/v1/events/routes',
          headers: {
            'Content-Type': 'application/json',
          },
          body: {
            eventPattern: 'mouse.*',
            targetService: 'widget-core',
            targetEndpoint: 'http://widget-core:8081/api/v1/events',
            priority: 10,
          },
        },
        willRespondWith: {
          status: 201,
          headers: {
            'Content-Type': 'application/json',
          },
          body: {
            routeId: like('route-123'),
            eventPattern: 'mouse.*',
            targetService: 'widget-core',
            active: true,
          },
        },
      });

      // When: Input Handler registers route
      const response = await axios.post(
        'http://localhost:8087/api/v1/events/routes',
        {
          eventPattern: 'mouse.*',
          targetService: 'widget-core',
          targetEndpoint: 'http://widget-core:8081/api/v1/events',
          priority: 10,
        }
      );

      // Then: Route is created
      expect(response.status).toBe(201);
      expect(response.data.routeId).toBeDefined();
      expect(response.data.active).toBe(true);
    });

    it('should update event route', async () => {
      // Given: Route route-123 exists
      await provider.addInteraction({
        state: 'event route route-123 exists',
        uponReceiving: 'a request to update event route',
        withRequest: {
          method: 'PUT',
          path: '/api/v1/events/routes/route-123',
          headers: {
            'Content-Type': 'application/json',
          },
          body: {
            priority: 20,
            active: false,
          },
        },
        willRespondWith: {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
          },
          body: {
            routeId: 'route-123',
            updated: true,
            priority: 20,
            active: false,
          },
        },
      });

      // When: Input Handler updates route
      const response = await axios.put(
        'http://localhost:8087/api/v1/events/routes/route-123',
        {
          priority: 20,
          active: false,
        }
      );

      // Then: Route is updated
      expect(response.status).toBe(200);
      expect(response.data.updated).toBe(true);
      expect(response.data.active).toBe(false);
    });

    it('should delete event route', async () => {
      // Given: Route route-123 exists
      await provider.addInteraction({
        state: 'event route route-123 exists',
        uponReceiving: 'a request to delete event route',
        withRequest: {
          method: 'DELETE',
          path: '/api/v1/events/routes/route-123',
        },
        willRespondWith: {
          status: 204,
        },
      });

      // When: Input Handler deletes route
      const response = await axios.delete(
        'http://localhost:8087/api/v1/events/routes/route-123'
      );

      // Then: Route is deleted
      expect(response.status).toBe(204);
    });
  });

  // ===========================================================================
  // Event Filtering Contracts
  // ===========================================================================

  describe('Event Filtering', () => {
    it('should create event filter', async () => {
      // Given: Event Processor is available
      await provider.addInteraction({
        state: 'event processor is available',
        uponReceiving: 'a request to create event filter',
        withRequest: {
          method: 'POST',
          path: '/api/v1/events/filters',
          headers: {
            'Content-Type': 'application/json',
          },
          body: {
            name: 'mouse-filter',
            eventPattern: 'mouse.*',
            conditions: {
              button: ['left', 'right'],
              minInterval: 100,
            },
            action: 'throttle',
          },
        },
        willRespondWith: {
          status: 201,
          headers: {
            'Content-Type': 'application/json',
          },
          body: {
            filterId: like('filter-456'),
            name: 'mouse-filter',
            active: true,
          },
        },
      });

      // When: Input Handler creates filter
      const response = await axios.post(
        'http://localhost:8087/api/v1/events/filters',
        {
          name: 'mouse-filter',
          eventPattern: 'mouse.*',
          conditions: {
            button: ['left', 'right'],
            minInterval: 100,
          },
          action: 'throttle',
        }
      );

      // Then: Filter is created
      expect(response.status).toBe(201);
      expect(response.data.filterId).toBeDefined();
      expect(response.data.active).toBe(true);
    });

    it('should list active filters', async () => {
      // Given: Filters exist
      await provider.addInteraction({
        state: 'event filters exist',
        uponReceiving: 'a request to list filters',
        withRequest: {
          method: 'GET',
          path: '/api/v1/events/filters',
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
            filters: eachLike({
              filterId: like('filter-456'),
              name: like('mouse-filter'),
              eventPattern: like('mouse.*'),
              active: true,
            }),
            total: like(3),
          },
        },
      });

      // When: Input Handler lists filters
      const response = await axios.get(
        'http://localhost:8087/api/v1/events/filters',
        {
          params: { active: 'true' },
        }
      );

      // Then: Filters are returned
      expect(response.status).toBe(200);
      expect(response.data.filters).toBeInstanceOf(Array);
      expect(response.data.total).toBeGreaterThan(0);
    });
  });

  // ===========================================================================
  // Event Metrics Contracts
  // ===========================================================================

  describe('Event Metrics', () => {
    it('should retrieve event processing metrics', async () => {
      // Given: Event Processor is available
      await provider.addInteraction({
        state: 'event processor is available',
        uponReceiving: 'a request for event metrics',
        withRequest: {
          method: 'GET',
          path: '/api/v1/events/metrics',
          query: {
            window: '5m',
          },
        },
        willRespondWith: {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
          },
          body: {
            window: '5m',
            totalEvents: like(1250),
            eventsPerSecond: like(4.17),
            eventsByType: {
              'mouse.click': like(450),
              'mouse.move': like(600),
              'keyboard.keydown': like(200),
            },
            avgProcessingTime: like(2.5),
            maxProcessingTime: like(15.3),
          },
        },
      });

      // When: Input Handler requests metrics
      const response = await axios.get(
        'http://localhost:8087/api/v1/events/metrics',
        {
          params: { window: '5m' },
        }
      );

      // Then: Metrics are returned
      expect(response.status).toBe(200);
      expect(response.data.totalEvents).toBeGreaterThan(0);
      expect(response.data.eventsByType).toBeDefined();
    });

    it('should retrieve event queue status', async () => {
      // Given: Event Processor is available
      await provider.addInteraction({
        state: 'event processor is available',
        uponReceiving: 'a request for queue status',
        withRequest: {
          method: 'GET',
          path: '/api/v1/events/queue/status',
        },
        willRespondWith: {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
          },
          body: {
            queueSize: like(125),
            queueCapacity: like(10000),
            utilizationPercent: like(1.25),
            oldestEventAge: like(50),
            processingRate: like(100),
          },
        },
      });

      // When: Input Handler checks queue status
      const response = await axios.get(
        'http://localhost:8087/api/v1/events/queue/status'
      );

      // Then: Queue status is returned
      expect(response.status).toBe(200);
      expect(response.data.queueSize).toBeDefined();
      expect(response.data.queueCapacity).toBeDefined();
    });
  });

  // ===========================================================================
  // Error Handling Contracts
  // ===========================================================================

  describe('Error Handling', () => {
    it('should reject malformed event', async () => {
      // Given: Event Processor is available
      await provider.addInteraction({
        state: 'event processor is available',
        uponReceiving: 'a malformed event',
        withRequest: {
          method: 'POST',
          path: '/api/v1/events/process',
          headers: {
            'Content-Type': 'application/json',
          },
          body: {
            eventType: 'invalid',
            // Missing required fields: timestamp, source
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

      // When: Input Handler sends malformed event
      try {
        await axios.post('http://localhost:8087/api/v1/events/process', {
          eventType: 'invalid',
        });
        fail('Expected request to fail');
      } catch (error: any) {
        // Then: Error response is returned
        expect(error.response.status).toBe(400);
        expect(error.response.data.error).toBe('Invalid event format');
        expect(error.response.data.missingFields).toBeInstanceOf(Array);
      }
    });

    it('should handle queue overflow', async () => {
      // Given: Event queue is full
      await provider.addInteraction({
        state: 'event queue is full',
        uponReceiving: 'an event when queue is full',
        withRequest: {
          method: 'POST',
          path: '/api/v1/events/process',
          headers: {
            'Content-Type': 'application/json',
          },
          body: {
            eventType: 'mouse.click',
            timestamp: like(1699564800000),
            source: 'input-handler',
            data: {
              x: 100,
              y: 150,
              button: 'left',
              modifiers: [],
            },
          },
        },
        willRespondWith: {
          status: 503,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': '5',
          },
          body: {
            error: 'Event queue full',
            queueSize: like(10000),
            queueCapacity: like(10000),
            retryAfter: 5,
          },
        },
      });

      // When: Input Handler sends event to full queue
      try {
        await axios.post('http://localhost:8087/api/v1/events/process', {
          eventType: 'mouse.click',
          timestamp: 1699564800000,
          source: 'input-handler',
          data: {
            x: 100,
            y: 150,
            button: 'left',
            modifiers: [],
          },
        });
        fail('Expected request to fail');
      } catch (error: any) {
        // Then: Service unavailable error is returned
        expect(error.response.status).toBe(503);
        expect(error.response.data.error).toBe('Event queue full');
        expect(error.response.headers['retry-after']).toBe('5');
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
 *    http://localhost:9292/pacts/provider/EventProcessor/consumer/InputHandler/latest
 *
 * 5. Provider verification:
 *    See ../providers/event-processor/pact-verification.test.ts
 *
 * Contract States Required by Provider:
 * - "event processor is available"
 * - "event route route-123 exists"
 * - "event filters exist"
 * - "event queue is full"
 *
 * Test Coverage:
 * - Event processing (4 tests)
 * - Event routing (3 tests)
 * - Event filtering (2 tests)
 * - Event metrics (2 tests)
 * - Error handling (2 tests)
 * Total: 13 tests
 */
