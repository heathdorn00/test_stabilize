/**
 * Pact Consumer Contract Test - Widget Core → UI Renderer
 * Task: 57fbde - Comprehensive Test Framework / RDB-002
 * Layer 3: Contract Tests (Consumer Side)
 *
 * This test defines the contract between Widget Core (consumer)
 * and UI Renderer (provider) for visual rendering and styling.
 */

import { Pact } from '@pact-foundation/pact';
import { like, eachLike } from '@pact-foundation/pact/src/dsl/matchers';
import axios from 'axios';
import path from 'path';

const provider = new Pact({
  consumer: 'WidgetCore',
  provider: 'UIRenderer',
  port: 8085,
  log: path.resolve(process.cwd(), 'logs', 'pact.log'),
  dir: path.resolve(process.cwd(), 'pacts'),
  logLevel: 'info',
});

describe('Widget Core → UI Renderer Contract', () => {
  beforeAll(() => provider.setup());
  afterEach(() => provider.verify());
  afterAll(() => provider.finalize());

  // ===========================================================================
  // Rendering Context Contracts
  // ===========================================================================

  describe('Rendering Context', () => {
    it('should create rendering context', async () => {
      await provider.addInteraction({
        state: 'ui renderer is available',
        uponReceiving: 'a request to create rendering context',
        withRequest: {
          method: 'POST',
          path: '/api/v1/render/contexts',
          headers: {
            'Content-Type': 'application/json',
          },
          body: {
            width: 800,
            height: 600,
            dpi: 96,
            colorDepth: 24,
          },
        },
        willRespondWith: {
          status: 201,
          headers: {
            'Content-Type': 'application/json',
          },
          body: {
            contextId: like('ctx-abc123'),
            width: 800,
            height: 600,
            ready: true,
          },
        },
      });

      const response = await axios.post(
        'http://localhost:8085/api/v1/render/contexts',
        {
          width: 800,
          height: 600,
          dpi: 96,
          colorDepth: 24,
        }
      );

      expect(response.status).toBe(201);
      expect(response.data.contextId).toBeDefined();
      expect(response.data.ready).toBe(true);
    });

    it('should destroy rendering context', async () => {
      await provider.addInteraction({
        state: 'rendering context ctx-abc123 exists',
        uponReceiving: 'a request to destroy rendering context',
        withRequest: {
          method: 'DELETE',
          path: '/api/v1/render/contexts/ctx-abc123',
        },
        willRespondWith: {
          status: 204,
        },
      });

      const response = await axios.delete(
        'http://localhost:8085/api/v1/render/contexts/ctx-abc123'
      );

      expect(response.status).toBe(204);
    });
  });

  // ===========================================================================
  // Shape Rendering Contracts
  // ===========================================================================

  describe('Shape Rendering', () => {
    it('should render rectangle', async () => {
      await provider.addInteraction({
        state: 'rendering context ctx-abc123 exists',
        uponReceiving: 'a request to render rectangle',
        withRequest: {
          method: 'POST',
          path: '/api/v1/render/shapes/rectangle',
          headers: {
            'Content-Type': 'application/json',
          },
          body: {
            contextId: 'ctx-abc123',
            x: 10,
            y: 20,
            width: 100,
            height: 50,
            fillColor: '#FF0000',
            strokeColor: '#000000',
            strokeWidth: 2,
          },
        },
        willRespondWith: {
          status: 201,
          headers: {
            'Content-Type': 'application/json',
          },
          body: {
            shapeId: like('shape-rect-001'),
            type: 'rectangle',
            rendered: true,
          },
        },
      });

      const response = await axios.post(
        'http://localhost:8085/api/v1/render/shapes/rectangle',
        {
          contextId: 'ctx-abc123',
          x: 10,
          y: 20,
          width: 100,
          height: 50,
          fillColor: '#FF0000',
          strokeColor: '#000000',
          strokeWidth: 2,
        }
      );

      expect(response.status).toBe(201);
      expect(response.data.shapeId).toBeDefined();
      expect(response.data.rendered).toBe(true);
    });

    it('should render circle', async () => {
      await provider.addInteraction({
        state: 'rendering context ctx-abc123 exists',
        uponReceiving: 'a request to render circle',
        withRequest: {
          method: 'POST',
          path: '/api/v1/render/shapes/circle',
          headers: {
            'Content-Type': 'application/json',
          },
          body: {
            contextId: 'ctx-abc123',
            centerX: 50,
            centerY: 50,
            radius: 25,
            fillColor: '#00FF00',
          },
        },
        willRespondWith: {
          status: 201,
          headers: {
            'Content-Type': 'application/json',
          },
          body: {
            shapeId: like('shape-circle-001'),
            type: 'circle',
            rendered: true,
          },
        },
      });

      const response = await axios.post(
        'http://localhost:8085/api/v1/render/shapes/circle',
        {
          contextId: 'ctx-abc123',
          centerX: 50,
          centerY: 50,
          radius: 25,
          fillColor: '#00FF00',
        }
      );

      expect(response.status).toBe(201);
      expect(response.data.type).toBe('circle');
    });

    it('should render text', async () => {
      await provider.addInteraction({
        state: 'rendering context ctx-abc123 exists',
        uponReceiving: 'a request to render text',
        withRequest: {
          method: 'POST',
          path: '/api/v1/render/text',
          headers: {
            'Content-Type': 'application/json',
          },
          body: {
            contextId: 'ctx-abc123',
            text: 'Hello World',
            x: 10,
            y: 30,
            fontFamily: 'Arial',
            fontSize: 14,
            color: '#000000',
          },
        },
        willRespondWith: {
          status: 201,
          headers: {
            'Content-Type': 'application/json',
          },
          body: {
            textId: like('text-001'),
            rendered: true,
            bounds: {
              width: like(80),
              height: like(16),
            },
          },
        },
      });

      const response = await axios.post(
        'http://localhost:8085/api/v1/render/text',
        {
          contextId: 'ctx-abc123',
          text: 'Hello World',
          x: 10,
          y: 30,
          fontFamily: 'Arial',
          fontSize: 14,
          color: '#000000',
        }
      );

      expect(response.status).toBe(201);
      expect(response.data.textId).toBeDefined();
      expect(response.data.bounds).toBeDefined();
    });
  });

  // ===========================================================================
  // Style Application Contracts
  // ===========================================================================

  describe('Style Application', () => {
    it('should apply style to widget', async () => {
      await provider.addInteraction({
        state: 'rendering context ctx-abc123 exists',
        uponReceiving: 'a request to apply style',
        withRequest: {
          method: 'POST',
          path: '/api/v1/render/styles/apply',
          headers: {
            'Content-Type': 'application/json',
          },
          body: {
            contextId: 'ctx-abc123',
            widgetId: 'widget-123',
            styles: {
              backgroundColor: '#FFFFFF',
              borderColor: '#CCCCCC',
              borderWidth: 1,
              borderRadius: 4,
              padding: 8,
            },
          },
        },
        willRespondWith: {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
          },
          body: {
            applied: true,
            invalidProperties: [],
          },
        },
      });

      const response = await axios.post(
        'http://localhost:8085/api/v1/render/styles/apply',
        {
          contextId: 'ctx-abc123',
          widgetId: 'widget-123',
          styles: {
            backgroundColor: '#FFFFFF',
            borderColor: '#CCCCCC',
            borderWidth: 1,
            borderRadius: 4,
            padding: 8,
          },
        }
      );

      expect(response.status).toBe(200);
      expect(response.data.applied).toBe(true);
    });

    it('should return invalid style properties', async () => {
      await provider.addInteraction({
        state: 'rendering context ctx-abc123 exists',
        uponReceiving: 'a request with invalid style properties',
        withRequest: {
          method: 'POST',
          path: '/api/v1/render/styles/apply',
          headers: {
            'Content-Type': 'application/json',
          },
          body: {
            contextId: 'ctx-abc123',
            widgetId: 'widget-123',
            styles: {
              backgroundColor: 'invalid-color',
              borderWidth: -5,
            },
          },
        },
        willRespondWith: {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
          },
          body: {
            applied: false,
            invalidProperties: eachLike('backgroundColor'),
            errors: eachLike({
              property: like('backgroundColor'),
              reason: like('Invalid color format'),
            }),
          },
        },
      });

      try {
        await axios.post('http://localhost:8085/api/v1/render/styles/apply', {
          contextId: 'ctx-abc123',
          widgetId: 'widget-123',
          styles: {
            backgroundColor: 'invalid-color',
            borderWidth: -5,
          },
        });
        fail('Expected request to fail');
      } catch (error: any) {
        expect(error.response.status).toBe(400);
        expect(error.response.data.applied).toBe(false);
        expect(error.response.data.invalidProperties).toBeInstanceOf(Array);
      }
    });
  });

  // ===========================================================================
  // Animation Contracts
  // ===========================================================================

  describe('Animation', () => {
    it('should create animation', async () => {
      await provider.addInteraction({
        state: 'rendering context ctx-abc123 exists',
        uponReceiving: 'a request to create animation',
        withRequest: {
          method: 'POST',
          path: '/api/v1/render/animations',
          headers: {
            'Content-Type': 'application/json',
          },
          body: {
            contextId: 'ctx-abc123',
            widgetId: 'widget-123',
            type: 'fade',
            duration: 300,
            easing: 'ease-in-out',
            properties: {
              opacity: { from: 0, to: 1 },
            },
          },
        },
        willRespondWith: {
          status: 201,
          headers: {
            'Content-Type': 'application/json',
          },
          body: {
            animationId: like('anim-001'),
            created: true,
            status: 'pending',
          },
        },
      });

      const response = await axios.post(
        'http://localhost:8085/api/v1/render/animations',
        {
          contextId: 'ctx-abc123',
          widgetId: 'widget-123',
          type: 'fade',
          duration: 300,
          easing: 'ease-in-out',
          properties: {
            opacity: { from: 0, to: 1 },
          },
        }
      );

      expect(response.status).toBe(201);
      expect(response.data.animationId).toBeDefined();
    });

    it('should start animation', async () => {
      await provider.addInteraction({
        state: 'animation anim-001 exists',
        uponReceiving: 'a request to start animation',
        withRequest: {
          method: 'POST',
          path: '/api/v1/render/animations/anim-001/start',
        },
        willRespondWith: {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
          },
          body: {
            animationId: 'anim-001',
            status: 'running',
            startedAt: like('2024-01-15T10:30:00Z'),
          },
        },
      });

      const response = await axios.post(
        'http://localhost:8085/api/v1/render/animations/anim-001/start'
      );

      expect(response.status).toBe(200);
      expect(response.data.status).toBe('running');
    });

    it('should stop animation', async () => {
      await provider.addInteraction({
        state: 'animation anim-001 is running',
        uponReceiving: 'a request to stop animation',
        withRequest: {
          method: 'POST',
          path: '/api/v1/render/animations/anim-001/stop',
        },
        willRespondWith: {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
          },
          body: {
            animationId: 'anim-001',
            status: 'stopped',
            stoppedAt: like('2024-01-15T10:30:01Z'),
          },
        },
      });

      const response = await axios.post(
        'http://localhost:8085/api/v1/render/animations/anim-001/stop'
      );

      expect(response.status).toBe(200);
      expect(response.data.status).toBe('stopped');
    });
  });

  // ===========================================================================
  // Batch Rendering Contracts
  // ===========================================================================

  describe('Batch Rendering', () => {
    it('should render multiple shapes in batch', async () => {
      await provider.addInteraction({
        state: 'rendering context ctx-abc123 exists',
        uponReceiving: 'a request to render batch of shapes',
        withRequest: {
          method: 'POST',
          path: '/api/v1/render/batch',
          headers: {
            'Content-Type': 'application/json',
          },
          body: {
            contextId: 'ctx-abc123',
            operations: [
              {
                type: 'rectangle',
                x: 10,
                y: 10,
                width: 50,
                height: 50,
              },
              {
                type: 'circle',
                centerX: 100,
                centerY: 100,
                radius: 25,
              },
              {
                type: 'text',
                text: 'Label',
                x: 10,
                y: 80,
              },
            ],
          },
        },
        willRespondWith: {
          status: 201,
          headers: {
            'Content-Type': 'application/json',
          },
          body: {
            batchId: like('batch-001'),
            results: eachLike({
              shapeId: like('shape-001'),
              rendered: like(true),
            }),
            successCount: like(3),
            failureCount: like(0),
          },
        },
      });

      const response = await axios.post(
        'http://localhost:8085/api/v1/render/batch',
        {
          contextId: 'ctx-abc123',
          operations: [
            {
              type: 'rectangle',
              x: 10,
              y: 10,
              width: 50,
              height: 50,
            },
            {
              type: 'circle',
              centerX: 100,
              centerY: 100,
              radius: 25,
            },
            {
              type: 'text',
              text: 'Label',
              x: 10,
              y: 80,
            },
          ],
        }
      );

      expect(response.status).toBe(201);
      expect(response.data.batchId).toBeDefined();
      expect(response.data.results).toBeInstanceOf(Array);
      expect(response.data.successCount).toBeGreaterThan(0);
    });
  });

  // ===========================================================================
  // Performance Contracts
  // ===========================================================================

  describe('Performance', () => {
    it('should return rendering performance metrics', async () => {
      await provider.addInteraction({
        state: 'rendering context ctx-abc123 exists',
        uponReceiving: 'a request for performance metrics',
        withRequest: {
          method: 'GET',
          path: '/api/v1/render/contexts/ctx-abc123/metrics',
        },
        willRespondWith: {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
          },
          body: {
            contextId: 'ctx-abc123',
            metrics: {
              framesRendered: like(1500),
              averageFps: like(60.0),
              droppedFrames: like(5),
              renderTime: {
                average: like(12.5),
                p95: like(18.2),
                p99: like(23.4),
              },
            },
          },
        },
      });

      const response = await axios.get(
        'http://localhost:8085/api/v1/render/contexts/ctx-abc123/metrics'
      );

      expect(response.status).toBe(200);
      expect(response.data.metrics.framesRendered).toBeDefined();
      expect(response.data.metrics.averageFps).toBeDefined();
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
 *    http://localhost:9292/pacts/provider/UIRenderer/consumer/WidgetCore/latest
 *
 * 5. Provider verification:
 *    See ../providers/ui-renderer/pact-verification.test.ts
 *
 * Contract States Required by Provider:
 * - "ui renderer is available"
 * - "rendering context ctx-abc123 exists"
 * - "animation anim-001 exists"
 * - "animation anim-001 is running"
 *
 * Test Coverage:
 * - Rendering context (2 tests)
 * - Shape rendering (3 tests)
 * - Style application (2 tests)
 * - Animation (3 tests)
 * - Batch rendering (1 test)
 * - Performance metrics (1 test)
 * Total: 12 tests
 */
