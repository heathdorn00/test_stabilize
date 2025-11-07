/**
 * Pact Contract Test Example - API Gateway ↔ Widget Core
 * Task: 57fbde - Set up comprehensive test framework
 * Layer 3: Contract Tests (Consumer-Driven Contracts)
 *
 * This test defines the contract that API Gateway (consumer) expects
 * from Widget Core service (provider).
 */

import { Pact } from '@pact-foundation/pact';
import { like, eachLike } from '@pact-foundation/pact/dsl/matchers';
import path from 'path';
import axios from 'axios';

describe('API Gateway → Widget Core Contract', () => {
  const provider = new Pact({
    consumer: 'APIGateway',
    provider: 'WidgetCore',
    port: 8080,
    log: path.resolve(process.cwd(), 'logs', 'pact.log'),
    dir: path.resolve(process.cwd(), 'pacts'),
    logLevel: 'info',
  });

  beforeAll(() => provider.setup());
  afterAll(() => provider.finalize());
  afterEach(() => provider.verify());

  // =========================================================================
  // Contract: Create Widget
  // =========================================================================

  describe('POST /widgets', () => {
    it('creates a new widget and returns widget ID', async () => {
      // Define the contract (consumer expectation)
      await provider.addInteraction({
        state: 'widget core is available',
        uponReceiving: 'a request to create a button widget',
        withRequest: {
          method: 'POST',
          path: '/widgets',
          headers: {
            'Content-Type': 'application/json',
          },
          body: {
            type: 'button',
            label: 'Submit',
            enabled: true,
          },
        },
        willRespondWith: {
          status: 201,
          headers: {
            'Content-Type': 'application/json',
          },
          body: {
            widget_id: like(123),
            type: 'button',
            label: 'Submit',
            enabled: true,
            created_at: like('2025-11-05T12:00:00Z'),
          },
        },
      });

      // Execute consumer code (API Gateway makes request)
      const response = await axios.post(`${provider.mockService.baseUrl}/widgets`, {
        type: 'button',
        label: 'Submit',
        enabled: true,
      }, {
        headers: { 'Content-Type': 'application/json' },
      });

      // Verify response matches contract
      expect(response.status).toBe(201);
      expect(response.data).toHaveProperty('widget_id');
      expect(response.data.type).toBe('button');
      expect(response.data.label).toBe('Submit');
    });

    it('rejects invalid widget creation request', async () => {
      await provider.addInteraction({
        state: 'widget core is available',
        uponReceiving: 'a request to create widget with missing type',
        withRequest: {
          method: 'POST',
          path: '/widgets',
          headers: {
            'Content-Type': 'application/json',
          },
          body: {
            label: 'Submit',
            // Missing 'type' field
          },
        },
        willRespondWith: {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
          },
          body: {
            error: like('Invalid request'),
            message: like('Field "type" is required'),
          },
        },
      });

      // Execute and expect error
      try {
        await axios.post(`${provider.mockService.baseUrl}/widgets`, {
          label: 'Submit',
        });
        fail('Should have thrown 400 error');
      } catch (error: any) {
        expect(error.response.status).toBe(400);
        expect(error.response.data).toHaveProperty('error');
      }
    });
  });

  // =========================================================================
  // Contract: Get Widget
  // =========================================================================

  describe('GET /widgets/{id}', () => {
    it('retrieves an existing widget', async () => {
      await provider.addInteraction({
        state: 'widget with ID 123 exists',
        uponReceiving: 'a request to get widget by ID',
        withRequest: {
          method: 'GET',
          path: '/widgets/123',
        },
        willRespondWith: {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
          },
          body: {
            widget_id: 123,
            type: 'button',
            label: like('Submit'),
            enabled: true,
            created_at: like('2025-11-05T12:00:00Z'),
          },
        },
      });

      const response = await axios.get(`${provider.mockService.baseUrl}/widgets/123`);

      expect(response.status).toBe(200);
      expect(response.data.widget_id).toBe(123);
      expect(response.data.type).toBe('button');
    });

    it('returns 404 for non-existent widget', async () => {
      await provider.addInteraction({
        state: 'widget with ID 999 does not exist',
        uponReceiving: 'a request to get non-existent widget',
        withRequest: {
          method: 'GET',
          path: '/widgets/999',
        },
        willRespondWith: {
          status: 404,
          headers: {
            'Content-Type': 'application/json',
          },
          body: {
            error: 'Not Found',
            message: like('Widget with ID 999 not found'),
          },
        },
      });

      try {
        await axios.get(`${provider.mockService.baseUrl}/widgets/999`);
        fail('Should have thrown 404 error');
      } catch (error: any) {
        expect(error.response.status).toBe(404);
      }
    });
  });

  // =========================================================================
  // Contract: List Widgets
  // =========================================================================

  describe('GET /widgets', () => {
    it('retrieves a list of widgets', async () => {
      await provider.addInteraction({
        state: 'widgets exist in the system',
        uponReceiving: 'a request to list widgets',
        withRequest: {
          method: 'GET',
          path: '/widgets',
          query: {
            limit: '10',
            offset: '0',
          },
        },
        willRespondWith: {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
          },
          body: {
            widgets: eachLike({
              widget_id: like(123),
              type: like('button'),
              label: like('Submit'),
              enabled: true,
            }),
            total: like(42),
            limit: 10,
            offset: 0,
          },
        },
      });

      const response = await axios.get(`${provider.mockService.baseUrl}/widgets`, {
        params: { limit: 10, offset: 0 },
      });

      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('widgets');
      expect(Array.isArray(response.data.widgets)).toBe(true);
      expect(response.data).toHaveProperty('total');
    });
  });

  // =========================================================================
  // Contract: Update Widget
  // =========================================================================

  describe('PATCH /widgets/{id}', () => {
    it('updates widget properties', async () => {
      await provider.addInteraction({
        state: 'widget with ID 123 exists',
        uponReceiving: 'a request to update widget label',
        withRequest: {
          method: 'PATCH',
          path: '/widgets/123',
          headers: {
            'Content-Type': 'application/json',
          },
          body: {
            label: 'Updated Label',
          },
        },
        willRespondWith: {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
          },
          body: {
            widget_id: 123,
            type: 'button',
            label: 'Updated Label',
            enabled: true,
            updated_at: like('2025-11-05T12:30:00Z'),
          },
        },
      });

      const response = await axios.patch(
        `${provider.mockService.baseUrl}/widgets/123`,
        { label: 'Updated Label' },
        { headers: { 'Content-Type': 'application/json' } }
      );

      expect(response.status).toBe(200);
      expect(response.data.label).toBe('Updated Label');
    });
  });

  // =========================================================================
  // Contract: Delete Widget
  // =========================================================================

  describe('DELETE /widgets/{id}', () => {
    it('deletes an existing widget', async () => {
      await provider.addInteraction({
        state: 'widget with ID 123 exists',
        uponReceiving: 'a request to delete widget',
        withRequest: {
          method: 'DELETE',
          path: '/widgets/123',
        },
        willRespondWith: {
          status: 204,
        },
      });

      const response = await axios.delete(`${provider.mockService.baseUrl}/widgets/123`);

      expect(response.status).toBe(204);
    });
  });
});

/**
 * COVERAGE TARGET: All service contracts defined
 *
 * Contract Coverage:
 * - POST /widgets: 2 scenarios (success, validation error)
 * - GET /widgets/{id}: 2 scenarios (found, not found)
 * - GET /widgets: 1 scenario (list)
 * - PATCH /widgets/{id}: 1 scenario (update)
 * - DELETE /widgets/{id}: 1 scenario (delete)
 *
 * Total: 7 contract test cases
 *
 * Run Consumer Tests:
 *   npm test
 *
 * Publish Contracts to Pact Broker:
 *   npm run pact:publish
 *
 * Provider Verification (run on Widget Core service):
 *   npm run pact:verify
 */
