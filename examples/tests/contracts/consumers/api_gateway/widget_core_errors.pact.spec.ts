/**
 * Pact Consumer Contract Test - API Gateway → Widget Core (Error Scenarios)
 * Task: 57fbde - Comprehensive Test Framework / RDB-002
 * Layer 3: Contract Tests (Consumer Side)
 *
 * This test defines error handling contracts between API Gateway (consumer)
 * and Widget Core (provider), covering validation, rate limiting, and failure scenarios.
 */

import { Pact } from '@pact-foundation/pact';
import { like, eachLike } from '@pact-foundation/pact/src/dsl/matchers';
import axios from 'axios';
import path from 'path';

const provider = new Pact({
  consumer: 'APIGateway',
  provider: 'WidgetCore',
  port: 8086,
  log: path.resolve(process.cwd(), 'logs', 'pact.log'),
  dir: path.resolve(process.cwd(), 'pacts'),
  logLevel: 'info',
});

describe('API Gateway → Widget Core Error Contracts', () => {
  beforeAll(() => provider.setup());
  afterEach(() => provider.verify());
  afterAll(() => provider.finalize());

  // ===========================================================================
  // Validation Error Contracts
  // ===========================================================================

  describe('Validation Errors', () => {
    it('should return 400 for missing required fields', async () => {
      await provider.addInteraction({
        state: 'widget core is available',
        uponReceiving: 'a request with missing required fields',
        withRequest: {
          method: 'POST',
          path: '/api/v1/widgets',
          headers: {
            'Content-Type': 'application/json',
          },
          body: {
            type: 'button',
            // Missing: label, width, height
          },
        },
        willRespondWith: {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
          },
          body: {
            error: 'Validation failed',
            missingFields: eachLike('label'),
            message: like('Required fields are missing'),
          },
        },
      });

      try {
        await axios.post('http://localhost:8086/api/v1/widgets', {
          type: 'button',
        });
        fail('Expected request to fail');
      } catch (error: any) {
        expect(error.response.status).toBe(400);
        expect(error.response.data.error).toBe('Validation failed');
        expect(error.response.data.missingFields).toBeInstanceOf(Array);
      }
    });

    it('should return 400 for invalid field types', async () => {
      await provider.addInteraction({
        state: 'widget core is available',
        uponReceiving: 'a request with invalid field types',
        withRequest: {
          method: 'POST',
          path: '/api/v1/widgets',
          headers: {
            'Content-Type': 'application/json',
          },
          body: {
            type: 'button',
            label: 'Test',
            width: 'not-a-number',
            height: 'not-a-number',
          },
        },
        willRespondWith: {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
          },
          body: {
            error: 'Validation failed',
            invalidFields: eachLike({
              field: like('width'),
              expected: like('number'),
              received: like('string'),
            }),
          },
        },
      });

      try {
        await axios.post('http://localhost:8086/api/v1/widgets', {
          type: 'button',
          label: 'Test',
          width: 'not-a-number',
          height: 'not-a-number',
        });
        fail('Expected request to fail');
      } catch (error: any) {
        expect(error.response.status).toBe(400);
        expect(error.response.data.invalidFields).toBeInstanceOf(Array);
      }
    });

    it('should return 400 for out-of-range values', async () => {
      await provider.addInteraction({
        state: 'widget core is available',
        uponReceiving: 'a request with out-of-range values',
        withRequest: {
          method: 'POST',
          path: '/api/v1/widgets',
          headers: {
            'Content-Type': 'application/json',
          },
          body: {
            type: 'button',
            label: 'Test',
            width: -100,
            height: 10000,
          },
        },
        willRespondWith: {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
          },
          body: {
            error: 'Validation failed',
            invalidFields: eachLike({
              field: like('width'),
              reason: like('Value must be between 1 and 2000'),
              value: like(-100),
            }),
          },
        },
      });

      try {
        await axios.post('http://localhost:8086/api/v1/widgets', {
          type: 'button',
          label: 'Test',
          width: -100,
          height: 10000,
        });
        fail('Expected request to fail');
      } catch (error: any) {
        expect(error.response.status).toBe(400);
        expect(error.response.data.error).toBe('Validation failed');
      }
    });

    it('should return 400 for invalid widget type', async () => {
      await provider.addInteraction({
        state: 'widget core is available',
        uponReceiving: 'a request with invalid widget type',
        withRequest: {
          method: 'POST',
          path: '/api/v1/widgets',
          headers: {
            'Content-Type': 'application/json',
          },
          body: {
            type: 'invalid_type',
            label: 'Test',
            width: 100,
            height: 50,
          },
        },
        willRespondWith: {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
          },
          body: {
            error: 'Invalid widget type',
            type: 'invalid_type',
            supportedTypes: eachLike('button'),
          },
        },
      });

      try {
        await axios.post('http://localhost:8086/api/v1/widgets', {
          type: 'invalid_type',
          label: 'Test',
          width: 100,
          height: 50,
        });
        fail('Expected request to fail');
      } catch (error: any) {
        expect(error.response.status).toBe(400);
        expect(error.response.data.supportedTypes).toBeInstanceOf(Array);
      }
    });
  });

  // ===========================================================================
  // Rate Limiting Contracts
  // ===========================================================================

  describe('Rate Limiting', () => {
    it('should return 429 when rate limit exceeded', async () => {
      await provider.addInteraction({
        state: 'rate limit exceeded for client',
        uponReceiving: 'a request when rate limit exceeded',
        withRequest: {
          method: 'POST',
          path: '/api/v1/widgets',
          headers: {
            'Content-Type': 'application/json',
            'X-Client-ID': 'client-123',
          },
          body: {
            type: 'button',
            label: 'Test',
            width: 100,
            height: 50,
          },
        },
        willRespondWith: {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': '60',
            'X-RateLimit-Limit': '100',
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': '1705320000',
          },
          body: {
            error: 'Rate limit exceeded',
            limit: 100,
            retryAfter: 60,
            message: like('Too many requests. Please retry after 60 seconds.'),
          },
        },
      });

      try {
        await axios.post(
          'http://localhost:8086/api/v1/widgets',
          {
            type: 'button',
            label: 'Test',
            width: 100,
            height: 50,
          },
          {
            headers: {
              'X-Client-ID': 'client-123',
            },
          }
        );
        fail('Expected request to fail');
      } catch (error: any) {
        expect(error.response.status).toBe(429);
        expect(error.response.headers['retry-after']).toBe('60');
        expect(error.response.data.retryAfter).toBe(60);
      }
    });
  });

  // ===========================================================================
  // Resource Not Found Contracts
  // ===========================================================================

  describe('Resource Not Found', () => {
    it('should return 404 for non-existent widget', async () => {
      await provider.addInteraction({
        state: 'widget 99999 does not exist',
        uponReceiving: 'a request for non-existent widget',
        withRequest: {
          method: 'GET',
          path: '/api/v1/widgets/99999',
        },
        willRespondWith: {
          status: 404,
          headers: {
            'Content-Type': 'application/json',
          },
          body: {
            error: 'Widget not found',
            widgetId: 99999,
            message: like('Widget with ID 99999 does not exist'),
          },
        },
      });

      try {
        await axios.get('http://localhost:8086/api/v1/widgets/99999');
        fail('Expected request to fail');
      } catch (error: any) {
        expect(error.response.status).toBe(404);
        expect(error.response.data.error).toBe('Widget not found');
        expect(error.response.data.widgetId).toBe(99999);
      }
    });

    it('should return 404 for update on non-existent widget', async () => {
      await provider.addInteraction({
        state: 'widget 99999 does not exist',
        uponReceiving: 'an update request for non-existent widget',
        withRequest: {
          method: 'PUT',
          path: '/api/v1/widgets/99999',
          headers: {
            'Content-Type': 'application/json',
          },
          body: {
            label: 'Updated',
          },
        },
        willRespondWith: {
          status: 404,
          headers: {
            'Content-Type': 'application/json',
          },
          body: {
            error: 'Widget not found',
            widgetId: 99999,
          },
        },
      });

      try {
        await axios.put('http://localhost:8086/api/v1/widgets/99999', {
          label: 'Updated',
        });
        fail('Expected request to fail');
      } catch (error: any) {
        expect(error.response.status).toBe(404);
      }
    });

    it('should return 404 for delete on non-existent widget', async () => {
      await provider.addInteraction({
        state: 'widget 99999 does not exist',
        uponReceiving: 'a delete request for non-existent widget',
        withRequest: {
          method: 'DELETE',
          path: '/api/v1/widgets/99999',
        },
        willRespondWith: {
          status: 404,
          headers: {
            'Content-Type': 'application/json',
          },
          body: {
            error: 'Widget not found',
            widgetId: 99999,
          },
        },
      });

      try {
        await axios.delete('http://localhost:8086/api/v1/widgets/99999');
        fail('Expected request to fail');
      } catch (error: any) {
        expect(error.response.status).toBe(404);
      }
    });
  });

  // ===========================================================================
  // Conflict Contracts
  // ===========================================================================

  describe('Conflict Errors', () => {
    it('should return 409 for duplicate widget creation', async () => {
      await provider.addInteraction({
        state: 'widget with client ID widget-unique-123 exists',
        uponReceiving: 'a request to create duplicate widget',
        withRequest: {
          method: 'POST',
          path: '/api/v1/widgets',
          headers: {
            'Content-Type': 'application/json',
            'X-Idempotency-Key': 'widget-unique-123',
          },
          body: {
            type: 'button',
            label: 'Test',
            width: 100,
            height: 50,
          },
        },
        willRespondWith: {
          status: 409,
          headers: {
            'Content-Type': 'application/json',
          },
          body: {
            error: 'Widget already exists',
            existingWidgetId: like(123),
            idempotencyKey: 'widget-unique-123',
          },
        },
      });

      try {
        await axios.post(
          'http://localhost:8086/api/v1/widgets',
          {
            type: 'button',
            label: 'Test',
            width: 100,
            height: 50,
          },
          {
            headers: {
              'X-Idempotency-Key': 'widget-unique-123',
            },
          }
        );
        fail('Expected request to fail');
      } catch (error: any) {
        expect(error.response.status).toBe(409);
        expect(error.response.data.error).toBe('Widget already exists');
      }
    });

    it('should return 409 for concurrent modification', async () => {
      await provider.addInteraction({
        state: 'widget 123 exists with version 5',
        uponReceiving: 'an update with outdated version',
        withRequest: {
          method: 'PUT',
          path: '/api/v1/widgets/123',
          headers: {
            'Content-Type': 'application/json',
            'If-Match': '"version-3"',
          },
          body: {
            label: 'Updated',
          },
        },
        willRespondWith: {
          status: 409,
          headers: {
            'Content-Type': 'application/json',
            'ETag': '"version-5"',
          },
          body: {
            error: 'Concurrent modification detected',
            currentVersion: 5,
            requestedVersion: 3,
            message: like('Widget has been modified. Please refresh and retry.'),
          },
        },
      });

      try {
        await axios.put(
          'http://localhost:8086/api/v1/widgets/123',
          {
            label: 'Updated',
          },
          {
            headers: {
              'If-Match': '"version-3"',
            },
          }
        );
        fail('Expected request to fail');
      } catch (error: any) {
        expect(error.response.status).toBe(409);
        expect(error.response.data.error).toBe('Concurrent modification detected');
      }
    });
  });

  // ===========================================================================
  // Server Error Contracts
  // ===========================================================================

  describe('Server Errors', () => {
    it('should return 500 for internal server error', async () => {
      await provider.addInteraction({
        state: 'widget core has internal error',
        uponReceiving: 'a request when server error occurs',
        withRequest: {
          method: 'GET',
          path: '/api/v1/widgets',
        },
        willRespondWith: {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
          },
          body: {
            error: 'Internal server error',
            requestId: like('req-abc123'),
            message: like('An unexpected error occurred. Please try again later.'),
          },
        },
      });

      try {
        await axios.get('http://localhost:8086/api/v1/widgets');
        fail('Expected request to fail');
      } catch (error: any) {
        expect(error.response.status).toBe(500);
        expect(error.response.data.requestId).toBeDefined();
      }
    });

    it('should return 503 for service unavailable', async () => {
      await provider.addInteraction({
        state: 'widget core is under maintenance',
        uponReceiving: 'a request during maintenance',
        withRequest: {
          method: 'GET',
          path: '/api/v1/widgets',
        },
        willRespondWith: {
          status: 503,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': '300',
          },
          body: {
            error: 'Service unavailable',
            reason: like('Maintenance in progress'),
            retryAfter: 300,
          },
        },
      });

      try {
        await axios.get('http://localhost:8086/api/v1/widgets');
        fail('Expected request to fail');
      } catch (error: any) {
        expect(error.response.status).toBe(503);
        expect(error.response.headers['retry-after']).toBe('300');
      }
    });

    it('should return 504 for gateway timeout', async () => {
      await provider.addInteraction({
        state: 'widget core is slow to respond',
        uponReceiving: 'a request that times out',
        withRequest: {
          method: 'POST',
          path: '/api/v1/widgets',
          headers: {
            'Content-Type': 'application/json',
          },
          body: {
            type: 'button',
            label: 'Test',
            width: 100,
            height: 50,
          },
        },
        willRespondWith: {
          status: 504,
          headers: {
            'Content-Type': 'application/json',
          },
          body: {
            error: 'Gateway timeout',
            message: like('Request to Widget Core timed out after 30 seconds'),
          },
        },
      });

      try {
        await axios.post('http://localhost:8086/api/v1/widgets', {
          type: 'button',
          label: 'Test',
          width: 100,
          height: 50,
        });
        fail('Expected request to fail');
      } catch (error: any) {
        expect(error.response.status).toBe(504);
        expect(error.response.data.error).toBe('Gateway timeout');
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
 *    http://localhost:9292/pacts/provider/WidgetCore/consumer/APIGateway/latest
 *
 * 5. Provider verification:
 *    See ../providers/widget-core/pact-verification.test.ts
 *
 * Contract States Required by Provider:
 * - "widget core is available"
 * - "rate limit exceeded for client"
 * - "widget 99999 does not exist"
 * - "widget with client ID widget-unique-123 exists"
 * - "widget 123 exists with version 5"
 * - "widget core has internal error"
 * - "widget core is under maintenance"
 * - "widget core is slow to respond"
 *
 * Test Coverage:
 * - Validation errors (4 tests)
 * - Rate limiting (1 test)
 * - Resource not found (3 tests)
 * - Conflict errors (2 tests)
 * - Server errors (3 tests)
 * Total: 13 tests
 */
