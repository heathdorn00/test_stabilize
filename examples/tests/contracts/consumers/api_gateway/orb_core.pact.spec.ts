/**
 * Pact Consumer Contract Test - API Gateway → ORB Core
 * Task: 57fbde - Comprehensive Test Framework / RDB-002
 * Layer 3: Contract Tests (Consumer Side)
 *
 * This test defines the contract between API Gateway (consumer)
 * and ORB Core (provider) for CORBA/ORB operations and health checks.
 */

import { Pact } from '@pact-foundation/pact';
import { like, eachLike } from '@pact-foundation/pact/src/dsl/matchers';
import axios from 'axios';
import path from 'path';

// Initialize Pact
const provider = new Pact({
  consumer: 'APIGateway',
  provider: 'ORBCore',
  port: 12001,
  log: path.resolve(process.cwd(), 'logs', 'pact.log'),
  dir: path.resolve(process.cwd(), 'pacts'),
  logLevel: 'info',
});

describe('API Gateway → ORB Core Contract', () => {
  // ===========================================================================
  // Setup and Teardown
  // ===========================================================================

  beforeAll(() => provider.setup());
  afterEach(() => provider.verify());
  afterAll(() => provider.finalize());

  // ===========================================================================
  // Health Check Contracts
  // ===========================================================================

  describe('Health Check', () => {
    it('should return ORB health status', async () => {
      // Given: ORB Core is healthy
      await provider.addInteraction({
        state: 'orb core is healthy',
        uponReceiving: 'a request for ORB health status',
        withRequest: {
          method: 'GET',
          path: '/api/v1/health',
        },
        willRespondWith: {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
          },
          body: {
            status: 'healthy',
            timestamp: like('2024-01-15T10:30:00Z'),
            orb: {
              status: 'running',
              activeConnections: like(5),
              totalRequests: like(1523),
            },
            polyorb: {
              status: 'active',
              adaRuntimeVersion: like('GNAT 12.2'),
            },
          },
        },
      });

      // When: API Gateway requests health status
      const response = await axios.get('http://localhost:12001/api/v1/health');

      // Then: Response indicates healthy status
      expect(response.status).toBe(200);
      expect(response.data.status).toBe('healthy');
      expect(response.data.orb.status).toBe('running');
      expect(response.data.polyorb.status).toBe('active');
    });

    it('should return unhealthy status when ORB is degraded', async () => {
      // Given: ORB Core is degraded
      await provider.addInteraction({
        state: 'orb core is degraded',
        uponReceiving: 'a request for health status when degraded',
        withRequest: {
          method: 'GET',
          path: '/api/v1/health',
        },
        willRespondWith: {
          status: 503,
          headers: {
            'Content-Type': 'application/json',
          },
          body: {
            status: 'unhealthy',
            timestamp: like('2024-01-15T10:30:00Z'),
            orb: {
              status: 'degraded',
              error: like('Connection pool exhausted'),
            },
          },
        },
      });

      // When: API Gateway requests health status
      try {
        await axios.get('http://localhost:12001/api/v1/health');
        fail('Expected request to return 503');
      } catch (error: any) {
        // Then: Response indicates unhealthy status
        expect(error.response.status).toBe(503);
        expect(error.response.data.status).toBe('unhealthy');
        expect(error.response.data.orb.status).toBe('degraded');
      }
    });
  });

  // ===========================================================================
  // ORB Connection Management Contracts
  // ===========================================================================

  describe('ORB Connection Management', () => {
    it('should return ORB connection pool status', async () => {
      // Given: ORB Core is running
      await provider.addInteraction({
        state: 'orb core is running',
        uponReceiving: 'a request for connection pool status',
        withRequest: {
          method: 'GET',
          path: '/api/v1/orb/connections',
        },
        willRespondWith: {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
          },
          body: {
            pool: {
              total: like(10),
              active: like(3),
              idle: like(7),
              maxSize: like(20),
            },
            connections: eachLike({
              id: like('conn-123'),
              status: like('active'),
              createdAt: like('2024-01-15T10:25:00Z'),
              lastUsedAt: like('2024-01-15T10:29:50Z'),
            }),
          },
        },
      });

      // When: API Gateway requests connection pool status
      const response = await axios.get(
        'http://localhost:12001/api/v1/orb/connections'
      );

      // Then: Response includes pool status
      expect(response.status).toBe(200);
      expect(response.data.pool.total).toBeDefined();
      expect(response.data.pool.active).toBeDefined();
      expect(response.data.connections).toBeInstanceOf(Array);
    });
  });

  // ===========================================================================
  // CORBA Object Reference Contracts
  // ===========================================================================

  describe('CORBA Object References', () => {
    it('should create CORBA object reference', async () => {
      // Given: ORB Core is available
      await provider.addInteraction({
        state: 'orb core is available',
        uponReceiving: 'a request to create CORBA object reference',
        withRequest: {
          method: 'POST',
          path: '/api/v1/orb/objects',
          headers: {
            'Content-Type': 'application/json',
          },
          body: {
            type: 'Widget',
            identifier: 'widget-123',
          },
        },
        willRespondWith: {
          status: 201,
          headers: {
            'Content-Type': 'application/json',
          },
          body: {
            objectRef: like('IOR:010000001700000049444c3a4d795769646765743a312e30000000'),
            type: 'Widget',
            identifier: 'widget-123',
            createdAt: like('2024-01-15T10:30:00Z'),
          },
        },
      });

      // When: API Gateway creates CORBA object reference
      const response = await axios.post(
        'http://localhost:12001/api/v1/orb/objects',
        {
          type: 'Widget',
          identifier: 'widget-123',
        }
      );

      // Then: Object reference is created
      expect(response.status).toBe(201);
      expect(response.data.objectRef).toBeDefined();
      expect(response.data.type).toBe('Widget');
      expect(response.data.identifier).toBe('widget-123');
    });

    it('should retrieve CORBA object reference by identifier', async () => {
      // Given: CORBA object widget-123 exists
      await provider.addInteraction({
        state: 'CORBA object widget-123 exists',
        uponReceiving: 'a request to retrieve CORBA object reference',
        withRequest: {
          method: 'GET',
          path: '/api/v1/orb/objects/widget-123',
        },
        willRespondWith: {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
          },
          body: {
            objectRef: like('IOR:010000001700000049444c3a4d795769646765743a312e30000000'),
            type: 'Widget',
            identifier: 'widget-123',
            status: 'active',
          },
        },
      });

      // When: API Gateway retrieves object reference
      const response = await axios.get(
        'http://localhost:12001/api/v1/orb/objects/widget-123'
      );

      // Then: Object reference is returned
      expect(response.status).toBe(200);
      expect(response.data.objectRef).toBeDefined();
      expect(response.data.identifier).toBe('widget-123');
      expect(response.data.status).toBe('active');
    });

    it('should return 404 when object reference does not exist', async () => {
      // Given: ORB Core is available
      await provider.addInteraction({
        state: 'orb core is available',
        uponReceiving: 'a request for non-existent CORBA object',
        withRequest: {
          method: 'GET',
          path: '/api/v1/orb/objects/widget-999',
        },
        willRespondWith: {
          status: 404,
          headers: {
            'Content-Type': 'application/json',
          },
          body: {
            error: 'Object reference not found',
            identifier: 'widget-999',
          },
        },
      });

      // When: API Gateway requests non-existent object
      try {
        await axios.get('http://localhost:12001/api/v1/orb/objects/widget-999');
        fail('Expected request to return 404');
      } catch (error: any) {
        // Then: 404 response is returned
        expect(error.response.status).toBe(404);
        expect(error.response.data.error).toBe('Object reference not found');
      }
    });

    it('should delete CORBA object reference', async () => {
      // Given: CORBA object widget-123 exists
      await provider.addInteraction({
        state: 'CORBA object widget-123 exists',
        uponReceiving: 'a request to delete CORBA object reference',
        withRequest: {
          method: 'DELETE',
          path: '/api/v1/orb/objects/widget-123',
        },
        willRespondWith: {
          status: 204,
        },
      });

      // When: API Gateway deletes object reference
      const response = await axios.delete(
        'http://localhost:12001/api/v1/orb/objects/widget-123'
      );

      // Then: Object is deleted successfully
      expect(response.status).toBe(204);
    });
  });

  // ===========================================================================
  // Phase 1 Memory Deallocation Metrics Contracts
  // ===========================================================================

  describe('Phase 1 Memory Deallocation Metrics', () => {
    it('should return memory deallocation metrics', async () => {
      // Given: ORB Core has processed deallocations
      await provider.addInteraction({
        state: 'orb core has processed 1523 deallocations',
        uponReceiving: 'a request for deallocation metrics',
        withRequest: {
          method: 'GET',
          path: '/api/v1/metrics/deallocations',
        },
        willRespondWith: {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
          },
          body: {
            total: like(1523),
            critical: like(45),
            byType: {
              Buffer: like(856),
              Reference: like(312),
              Servant: like(310),
              Critical: like(45),
            },
            lastDeallocation: like('2024-01-15T10:29:58Z'),
          },
        },
      });

      // When: API Gateway requests deallocation metrics
      const response = await axios.get(
        'http://localhost:12001/api/v1/metrics/deallocations'
      );

      // Then: Metrics are returned
      expect(response.status).toBe(200);
      expect(response.data.total).toBeGreaterThan(0);
      expect(response.data.critical).toBeDefined();
      expect(response.data.byType).toBeDefined();
    });
  });

  // ===========================================================================
  // ORB Performance Metrics Contracts
  // ===========================================================================

  describe('ORB Performance Metrics', () => {
    it('should return ORB performance metrics', async () => {
      // Given: ORB Core is processing requests
      await provider.addInteraction({
        state: 'orb core is processing requests',
        uponReceiving: 'a request for performance metrics',
        withRequest: {
          method: 'GET',
          path: '/api/v1/metrics/performance',
        },
        willRespondWith: {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
          },
          body: {
            requests: {
              total: like(1523),
              successful: like(1502),
              failed: like(21),
              averageLatency: like(85.5),
              p95Latency: like(234.2),
              p99Latency: like(456.8),
            },
            throughput: {
              requestsPerSecond: like(12.5),
              messagesPerSecond: like(25.0),
            },
            timestamp: like('2024-01-15T10:30:00Z'),
          },
        },
      });

      // When: API Gateway requests performance metrics
      const response = await axios.get(
        'http://localhost:12001/api/v1/metrics/performance'
      );

      // Then: Performance metrics are returned
      expect(response.status).toBe(200);
      expect(response.data.requests.total).toBeDefined();
      expect(response.data.requests.averageLatency).toBeDefined();
      expect(response.data.throughput.requestsPerSecond).toBeDefined();
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
 *    http://localhost:9292/pacts/provider/ORBCore/consumer/APIGateway/latest
 *
 * 5. Provider verification:
 *    See ../providers/orb-core/pact-verification.test.ts
 *
 * Contract States Required by Provider:
 * - "orb core is healthy"
 * - "orb core is degraded"
 * - "orb core is running"
 * - "orb core is available"
 * - "CORBA object widget-123 exists"
 * - "orb core has processed 1523 deallocations"
 * - "orb core is processing requests"
 *
 * Phase 1 Validation:
 * - Deallocation metrics validate Phase 1 refactor (73 instances)
 * - Critical deallocation counter tracks memory zeroization (3 instances)
 * - Metrics accessible via /api/v1/metrics/deallocations
 */
