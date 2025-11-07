/**
 * Pact Consumer Contract Test - Widget Core → Platform Adapter
 * Task: 57fbde - Comprehensive Test Framework / RDB-002
 * Layer 3: Contract Tests (Consumer Side)
 *
 * This test defines the contract between Widget Core (consumer)
 * and Platform Adapter (provider) for platform-specific rendering.
 */

import { Pact } from '@pact-foundation/pact';
import { like, eachLike, term } from '@pact-foundation/pact/src/dsl/matchers';
import axios from 'axios';
import path from 'path';

// Initialize Pact
const provider = new Pact({
  consumer: 'WidgetCore',
  provider: 'PlatformAdapter',
  port: 8084,
  log: path.resolve(process.cwd(), 'logs', 'pact.log'),
  dir: path.resolve(process.cwd(), 'pacts'),
  logLevel: 'info',
});

describe('Widget Core → Platform Adapter Contract', () => {
  // ===========================================================================
  // Setup and Teardown
  // ===========================================================================

  beforeAll(() => provider.setup());
  afterEach(() => provider.verify());
  afterAll(() => provider.finalize());

  // ===========================================================================
  // Platform Capability Contracts
  // ===========================================================================

  describe('Platform Capabilities', () => {
    it('should return platform capabilities', async () => {
      // Given: Platform Adapter is available
      await provider.addInteraction({
        state: 'platform adapter is available',
        uponReceiving: 'a request for platform capabilities',
        withRequest: {
          method: 'GET',
          path: '/api/v1/platform/capabilities',
        },
        willRespondWith: {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
          },
          body: {
            platform: like('wxGTK'),
            version: like('3.2.0'),
            capabilities: {
              rendering: {
                hardwareAcceleration: like(true),
                antiAliasing: like(true),
                transparency: like(true),
              },
              input: {
                multiTouch: like(true),
                gestures: like(true),
                stylus: like(false),
              },
              features: eachLike('custom_fonts'),
            },
          },
        },
      });

      // When: Widget Core requests capabilities
      const response = await axios.get(
        'http://localhost:8084/api/v1/platform/capabilities'
      );

      // Then: Capabilities are returned
      expect(response.status).toBe(200);
      expect(response.data.platform).toBeDefined();
      expect(response.data.capabilities.rendering).toBeDefined();
    });
  });

  // ===========================================================================
  // Widget Rendering Contracts
  // ===========================================================================

  describe('Widget Rendering', () => {
    it('should render widget with platform-specific code', async () => {
      // Given: Platform Adapter is available
      await provider.addInteraction({
        state: 'platform adapter is available',
        uponReceiving: 'a request to render button widget',
        withRequest: {
          method: 'POST',
          path: '/api/v1/platform/render',
          headers: {
            'Content-Type': 'application/json',
          },
          body: {
            widgetId: 'widget-123',
            type: 'button',
            properties: {
              label: 'Click Me',
              width: 100,
              height: 50,
              enabled: true,
            },
            parentId: null,
          },
        },
        willRespondWith: {
          status: 201,
          headers: {
            'Content-Type': 'application/json',
          },
          body: {
            renderingId: like('render-456'),
            widgetId: 'widget-123',
            platformHandle: like(12345),
            bounds: {
              x: like(0),
              y: like(0),
              width: 100,
              height: 50,
            },
            rendered: true,
          },
        },
      });

      // When: Widget Core requests rendering
      const response = await axios.post(
        'http://localhost:8084/api/v1/platform/render',
        {
          widgetId: 'widget-123',
          type: 'button',
          properties: {
            label: 'Click Me',
            width: 100,
            height: 50,
            enabled: true,
          },
          parentId: null,
        }
      );

      // Then: Rendering succeeds
      expect(response.status).toBe(201);
      expect(response.data.renderingId).toBeDefined();
      expect(response.data.platformHandle).toBeDefined();
      expect(response.data.rendered).toBe(true);
    });

    it('should update widget rendering', async () => {
      // Given: Widget render-456 exists
      await provider.addInteraction({
        state: 'widget rendering render-456 exists',
        uponReceiving: 'a request to update widget rendering',
        withRequest: {
          method: 'PUT',
          path: '/api/v1/platform/render/render-456',
          headers: {
            'Content-Type': 'application/json',
          },
          body: {
            properties: {
              label: 'Updated Label',
              enabled: false,
            },
          },
        },
        willRespondWith: {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
          },
          body: {
            renderingId: 'render-456',
            updated: true,
            redrawn: true,
          },
        },
      });

      // When: Widget Core updates rendering
      const response = await axios.put(
        'http://localhost:8084/api/v1/platform/render/render-456',
        {
          properties: {
            label: 'Updated Label',
            enabled: false,
          },
        }
      );

      // Then: Update succeeds
      expect(response.status).toBe(200);
      expect(response.data.updated).toBe(true);
      expect(response.data.redrawn).toBe(true);
    });

    it('should destroy widget rendering', async () => {
      // Given: Widget rendering render-456 exists
      await provider.addInteraction({
        state: 'widget rendering render-456 exists',
        uponReceiving: 'a request to destroy widget rendering',
        withRequest: {
          method: 'DELETE',
          path: '/api/v1/platform/render/render-456',
        },
        willRespondWith: {
          status: 204,
        },
      });

      // When: Widget Core destroys rendering
      const response = await axios.delete(
        'http://localhost:8084/api/v1/platform/render/render-456'
      );

      // Then: Rendering is destroyed
      expect(response.status).toBe(204);
    });
  });

  // ===========================================================================
  // Event Handling Contracts
  // ===========================================================================

  describe('Event Handling', () => {
    it('should register event handler for widget', async () => {
      // Given: Widget rendering render-456 exists
      await provider.addInteraction({
        state: 'widget rendering render-456 exists',
        uponReceiving: 'a request to register event handler',
        withRequest: {
          method: 'POST',
          path: '/api/v1/platform/events/subscribe',
          headers: {
            'Content-Type': 'application/json',
          },
          body: {
            renderingId: 'render-456',
            eventTypes: ['click', 'hover'],
            callbackUrl: like('http://widget-core:8081/api/v1/events/callback'),
          },
        },
        willRespondWith: {
          status: 201,
          headers: {
            'Content-Type': 'application/json',
          },
          body: {
            subscriptionId: like('sub-789'),
            renderingId: 'render-456',
            eventTypes: ['click', 'hover'],
            active: true,
          },
        },
      });

      // When: Widget Core subscribes to events
      const response = await axios.post(
        'http://localhost:8084/api/v1/platform/events/subscribe',
        {
          renderingId: 'render-456',
          eventTypes: ['click', 'hover'],
          callbackUrl: 'http://widget-core:8081/api/v1/events/callback',
        }
      );

      // Then: Subscription succeeds
      expect(response.status).toBe(201);
      expect(response.data.subscriptionId).toBeDefined();
      expect(response.data.active).toBe(true);
    });

    it('should unsubscribe from events', async () => {
      // Given: Event subscription sub-789 exists
      await provider.addInteraction({
        state: 'event subscription sub-789 exists',
        uponReceiving: 'a request to unsubscribe from events',
        withRequest: {
          method: 'DELETE',
          path: '/api/v1/platform/events/subscribe/sub-789',
        },
        willRespondWith: {
          status: 204,
        },
      });

      // When: Widget Core unsubscribes
      const response = await axios.delete(
        'http://localhost:8084/api/v1/platform/events/subscribe/sub-789'
      );

      // Then: Unsubscribe succeeds
      expect(response.status).toBe(204);
    });
  });

  // ===========================================================================
  // Layout Management Contracts
  // ===========================================================================

  describe('Layout Management', () => {
    it('should calculate widget layout', async () => {
      // Given: Platform Adapter is available
      await provider.addInteraction({
        state: 'platform adapter is available',
        uponReceiving: 'a request to calculate layout',
        withRequest: {
          method: 'POST',
          path: '/api/v1/platform/layout/calculate',
          headers: {
            'Content-Type': 'application/json',
          },
          body: {
            widgets: [
              {
                widgetId: 'widget-1',
                type: 'button',
                requestedWidth: 100,
                requestedHeight: 50,
              },
              {
                widgetId: 'widget-2',
                type: 'label',
                requestedWidth: 200,
                requestedHeight: 30,
              },
            ],
            constraints: {
              containerWidth: 400,
              containerHeight: 300,
              layoutType: 'horizontal',
            },
          },
        },
        willRespondWith: {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
          },
          body: {
            layout: eachLike({
              widgetId: like('widget-1'),
              bounds: {
                x: like(0),
                y: like(0),
                width: like(100),
                height: like(50),
              },
            }),
            totalBounds: {
              width: like(300),
              height: like(50),
            },
          },
        },
      });

      // When: Widget Core requests layout calculation
      const response = await axios.post(
        'http://localhost:8084/api/v1/platform/layout/calculate',
        {
          widgets: [
            {
              widgetId: 'widget-1',
              type: 'button',
              requestedWidth: 100,
              requestedHeight: 50,
            },
            {
              widgetId: 'widget-2',
              type: 'label',
              requestedWidth: 200,
              requestedHeight: 30,
            },
          ],
          constraints: {
            containerWidth: 400,
            containerHeight: 300,
            layoutType: 'horizontal',
          },
        }
      );

      // Then: Layout is calculated
      expect(response.status).toBe(200);
      expect(response.data.layout).toBeInstanceOf(Array);
      expect(response.data.totalBounds).toBeDefined();
    });
  });

  // ===========================================================================
  // Resource Management Contracts
  // ===========================================================================

  describe('Resource Management', () => {
    it('should load platform font', async () => {
      // Given: Platform Adapter is available
      await provider.addInteraction({
        state: 'platform adapter is available',
        uponReceiving: 'a request to load font',
        withRequest: {
          method: 'POST',
          path: '/api/v1/platform/resources/fonts',
          headers: {
            'Content-Type': 'application/json',
          },
          body: {
            family: 'Arial',
            size: 12,
            weight: 'normal',
            style: 'normal',
          },
        },
        willRespondWith: {
          status: 201,
          headers: {
            'Content-Type': 'application/json',
          },
          body: {
            fontId: like('font-abc123'),
            family: 'Arial',
            size: 12,
            loaded: true,
          },
        },
      });

      // When: Widget Core loads font
      const response = await axios.post(
        'http://localhost:8084/api/v1/platform/resources/fonts',
        {
          family: 'Arial',
          size: 12,
          weight: 'normal',
          style: 'normal',
        }
      );

      // Then: Font is loaded
      expect(response.status).toBe(201);
      expect(response.data.fontId).toBeDefined();
      expect(response.data.loaded).toBe(true);
    });

    it('should load platform image', async () => {
      // Given: Platform Adapter is available
      await provider.addInteraction({
        state: 'platform adapter is available',
        uponReceiving: 'a request to load image',
        withRequest: {
          method: 'POST',
          path: '/api/v1/platform/resources/images',
          headers: {
            'Content-Type': 'application/json',
          },
          body: {
            url: 'https://example.com/icon.png',
            width: 32,
            height: 32,
          },
        },
        willRespondWith: {
          status: 201,
          headers: {
            'Content-Type': 'application/json',
          },
          body: {
            imageId: like('image-def456'),
            url: 'https://example.com/icon.png',
            width: 32,
            height: 32,
            loaded: true,
            format: like('PNG'),
          },
        },
      });

      // When: Widget Core loads image
      const response = await axios.post(
        'http://localhost:8084/api/v1/platform/resources/images',
        {
          url: 'https://example.com/icon.png',
          width: 32,
          height: 32,
        }
      );

      // Then: Image is loaded
      expect(response.status).toBe(201);
      expect(response.data.imageId).toBeDefined();
      expect(response.data.loaded).toBe(true);
    });
  });

  // ===========================================================================
  // Error Handling Contracts
  // ===========================================================================

  describe('Error Handling', () => {
    it('should handle invalid widget type', async () => {
      // Given: Platform Adapter is available
      await provider.addInteraction({
        state: 'platform adapter is available',
        uponReceiving: 'a request to render invalid widget type',
        withRequest: {
          method: 'POST',
          path: '/api/v1/platform/render',
          headers: {
            'Content-Type': 'application/json',
          },
          body: {
            widgetId: 'widget-999',
            type: 'invalid_type',
            properties: {},
            parentId: null,
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

      // When: Widget Core requests rendering with invalid type
      try {
        await axios.post('http://localhost:8084/api/v1/platform/render', {
          widgetId: 'widget-999',
          type: 'invalid_type',
          properties: {},
          parentId: null,
        });
        fail('Expected request to fail');
      } catch (error: any) {
        // Then: Error response is returned
        expect(error.response.status).toBe(400);
        expect(error.response.data.error).toBe('Invalid widget type');
        expect(error.response.data.supportedTypes).toBeInstanceOf(Array);
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
 *    http://localhost:9292/pacts/provider/PlatformAdapter/consumer/WidgetCore/latest
 *
 * 5. Provider verification:
 *    See ../providers/platform-adapter/pact-verification.test.ts
 *
 * Contract States Required by Provider:
 * - "platform adapter is available"
 * - "widget rendering render-456 exists"
 * - "event subscription sub-789 exists"
 *
 * Test Coverage:
 * - Platform capabilities (1 test)
 * - Widget rendering (3 tests)
 * - Event handling (2 tests)
 * - Layout management (1 test)
 * - Resource management (2 tests)
 * - Error handling (1 test)
 * Total: 10 tests
 */
