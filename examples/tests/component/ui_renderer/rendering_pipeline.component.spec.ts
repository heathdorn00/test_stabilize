/**
 * Component Test - UI Renderer: Rendering Pipeline Component
 * Task: 57fbde - Comprehensive Test Framework / RDB-002
 * Layer 2: Component Tests
 *
 * Tests the interaction between RenderingContext, ShapeRenderer,
 * StyleApplicator, and BufferManager within UI Renderer service.
 */

import { RenderingPipelineComponent } from '@/services/ui-renderer/components/pipeline';
import { InMemoryFrameBuffer } from '@/test-utils/in-memory-framebuffer';
import { MockGraphicsEngine } from '@/test-utils/mock-graphics-engine';
import { MockPlatformAdapter } from '@/test-utils/mock-platform-adapter';

describe('Rendering Pipeline Component', () => {
  // ===========================================================================
  // Test Setup
  // ===========================================================================

  let component: RenderingPipelineComponent;
  let mockFrameBuffer: InMemoryFrameBuffer;
  let mockGraphicsEngine: MockGraphicsEngine;
  let mockPlatformAdapter: MockPlatformAdapter;

  beforeEach(() => {
    // Create in-memory implementations
    mockFrameBuffer = new InMemoryFrameBuffer(800, 600);
    mockGraphicsEngine = new MockGraphicsEngine();
    mockPlatformAdapter = new MockPlatformAdapter();

    // Initialize component with real internal classes
    component = new RenderingPipelineComponent({
      frameBuffer: mockFrameBuffer,
      graphicsEngine: mockGraphicsEngine,
      platformAdapter: mockPlatformAdapter,
    });
  });

  afterEach(() => {
    // Clear state
    mockFrameBuffer.clear();
    mockGraphicsEngine.clear();
    mockPlatformAdapter.clear();
  });

  // ===========================================================================
  // Rendering Context Tests
  // ===========================================================================

  describe('Rendering Context Management', () => {
    it('should create rendering context', async () => {
      // Arrange
      const config = {
        width: 800,
        height: 600,
        colorDepth: 32,
        antiAliasing: true,
      };

      // Act
      const context = await component.createContext(config);

      // Assert: Context created
      expect(context.id).toBeDefined();
      expect(context.width).toBe(800);
      expect(context.height).toBe(600);
      expect(context.state).toBe('ready');

      // Assert: Frame buffer initialized
      expect(mockFrameBuffer.isInitialized()).toBe(true);
      expect(mockFrameBuffer.getWidth()).toBe(800);
      expect(mockFrameBuffer.getHeight()).toBe(600);

      // Assert: Graphics engine configured
      expect(mockGraphicsEngine.isConfigured()).toBe(true);
      expect(mockGraphicsEngine.getAntiAliasing()).toBe(true);
    });

    it('should activate rendering context', async () => {
      // Arrange
      const context = await component.createContext({
        width: 800,
        height: 600,
        colorDepth: 32,
        antiAliasing: true,
      });

      // Act
      await component.activateContext(context.id);

      // Assert: Context activated
      const updatedContext = await component.getContext(context.id);
      expect(updatedContext.state).toBe('active');

      // Assert: Frame buffer bound
      expect(mockFrameBuffer.isBound()).toBe(true);

      // Assert: Graphics engine ready
      expect(mockGraphicsEngine.isReady()).toBe(true);
    });

    it('should switch between contexts', async () => {
      // Arrange: Create two contexts
      const context1 = await component.createContext({
        width: 800,
        height: 600,
        colorDepth: 32,
        antiAliasing: true,
      });
      const context2 = await component.createContext({
        width: 1024,
        height: 768,
        colorDepth: 32,
        antiAliasing: false,
      });

      // Act: Activate context1
      await component.activateContext(context1.id);
      expect(mockGraphicsEngine.getActiveContextId()).toBe(context1.id);

      // Act: Switch to context2
      await component.activateContext(context2.id);

      // Assert: Context2 now active
      expect(mockGraphicsEngine.getActiveContextId()).toBe(context2.id);

      // Assert: Context1 deactivated
      const ctx1 = await component.getContext(context1.id);
      expect(ctx1.state).toBe('inactive');
    });

    it('should destroy rendering context', async () => {
      // Arrange
      const context = await component.createContext({
        width: 800,
        height: 600,
        colorDepth: 32,
        antiAliasing: true,
      });
      await component.activateContext(context.id);

      // Act
      await component.destroyContext(context.id);

      // Assert: Context removed
      await expect(
        component.getContext(context.id)
      ).rejects.toThrow('Context not found');

      // Assert: Frame buffer released
      expect(mockFrameBuffer.isBound()).toBe(false);

      // Assert: Graphics engine context cleaned
      expect(mockGraphicsEngine.hasContext(context.id)).toBe(false);
    });
  });

  // ===========================================================================
  // Shape Rendering Tests
  // ===========================================================================

  describe('Shape Rendering', () => {
    let contextId: string;

    beforeEach(async () => {
      const context = await component.createContext({
        width: 800,
        height: 600,
        colorDepth: 32,
        antiAliasing: true,
      });
      contextId = context.id;
      await component.activateContext(contextId);
    });

    it('should render rectangle', async () => {
      // Arrange
      const shape = {
        type: 'rectangle',
        x: 100,
        y: 150,
        width: 200,
        height: 100,
        fillColor: '#FF0000',
        strokeColor: '#000000',
        strokeWidth: 2,
      };

      // Act
      await component.renderShape(contextId, shape);

      // Assert: Shape rendered to frame buffer
      const pixel = mockFrameBuffer.getPixel(150, 200);
      expect(pixel.red).toBeGreaterThan(200); // Red fill

      // Assert: Graphics engine draw call recorded
      const drawCalls = mockGraphicsEngine.getDrawCalls();
      expect(drawCalls).toHaveLength(1);
      expect(drawCalls[0].type).toBe('rectangle');
      expect(drawCalls[0].bounds).toEqual({
        x: 100,
        y: 150,
        width: 200,
        height: 100,
      });
    });

    it('should render circle', async () => {
      // Arrange
      const shape = {
        type: 'circle',
        centerX: 400,
        centerY: 300,
        radius: 50,
        fillColor: '#00FF00',
      };

      // Act
      await component.renderShape(contextId, shape);

      // Assert: Shape rendered
      const pixel = mockFrameBuffer.getPixel(400, 300);
      expect(pixel.green).toBeGreaterThan(200); // Green fill

      // Assert: Draw call recorded
      const drawCalls = mockGraphicsEngine.getDrawCalls();
      expect(drawCalls).toHaveLength(1);
      expect(drawCalls[0].type).toBe('circle');
    });

    it('should render text', async () => {
      // Arrange
      const text = {
        type: 'text',
        content: 'Hello World',
        x: 100,
        y: 200,
        font: 'Arial',
        fontSize: 16,
        color: '#000000',
      };

      // Act
      await component.renderText(contextId, text);

      // Assert: Text rendered
      const drawCalls = mockGraphicsEngine.getDrawCalls();
      expect(drawCalls).toHaveLength(1);
      expect(drawCalls[0].type).toBe('text');
      expect(drawCalls[0].content).toBe('Hello World');

      // Assert: Font loaded
      expect(mockGraphicsEngine.isFontLoaded('Arial', 16)).toBe(true);
    });

    it('should render complex path', async () => {
      // Arrange
      const path = {
        type: 'path',
        commands: [
          { op: 'moveTo', x: 100, y: 100 },
          { op: 'lineTo', x: 200, y: 100 },
          { op: 'lineTo', x: 200, y: 200 },
          { op: 'lineTo', x: 100, y: 200 },
          { op: 'closePath' },
        ],
        fillColor: '#0000FF',
      };

      // Act
      await component.renderPath(contextId, path);

      // Assert: Path rendered
      const drawCalls = mockGraphicsEngine.getDrawCalls();
      expect(drawCalls).toHaveLength(1);
      expect(drawCalls[0].type).toBe('path');
      expect(drawCalls[0].commands).toHaveLength(5);
    });

    it('should batch render multiple shapes', async () => {
      // Arrange
      const shapes = [
        {
          type: 'rectangle',
          x: 0,
          y: 0,
          width: 100,
          height: 100,
          fillColor: '#FF0000',
        },
        {
          type: 'circle',
          centerX: 200,
          centerY: 200,
          radius: 50,
          fillColor: '#00FF00',
        },
        {
          type: 'rectangle',
          x: 400,
          y: 400,
          width: 100,
          height: 100,
          fillColor: '#0000FF',
        },
      ];

      // Act
      await component.batchRenderShapes(contextId, shapes);

      // Assert: All shapes rendered
      const drawCalls = mockGraphicsEngine.getDrawCalls();
      expect(drawCalls).toHaveLength(3);

      // Assert: Batch optimization applied
      expect(mockGraphicsEngine.wasBatchOptimized()).toBe(true);
    });
  });

  // ===========================================================================
  // Style Application Tests
  // ===========================================================================

  describe('Style Application', () => {
    let contextId: string;

    beforeEach(async () => {
      const context = await component.createContext({
        width: 800,
        height: 600,
        colorDepth: 32,
        antiAliasing: true,
      });
      contextId = context.id;
      await component.activateContext(contextId);
    });

    it('should apply fill style', async () => {
      // Arrange
      const style = {
        fillColor: '#FF0000',
        fillOpacity: 0.8,
      };

      // Act
      await component.applyStyle(contextId, style);

      // Assert: Style applied to context
      const currentStyle = mockGraphicsEngine.getCurrentStyle();
      expect(currentStyle.fillColor).toBe('#FF0000');
      expect(currentStyle.fillOpacity).toBe(0.8);
    });

    it('should apply stroke style', async () => {
      // Arrange
      const style = {
        strokeColor: '#000000',
        strokeWidth: 3,
        strokeOpacity: 1.0,
        lineCap: 'round',
        lineJoin: 'miter',
      };

      // Act
      await component.applyStyle(contextId, style);

      // Assert: Style applied
      const currentStyle = mockGraphicsEngine.getCurrentStyle();
      expect(currentStyle.strokeColor).toBe('#000000');
      expect(currentStyle.strokeWidth).toBe(3);
      expect(currentStyle.lineCap).toBe('round');
    });

    it('should apply gradient fill', async () => {
      // Arrange
      const style = {
        fillType: 'linear-gradient',
        gradientStops: [
          { offset: 0, color: '#FF0000' },
          { offset: 0.5, color: '#00FF00' },
          { offset: 1, color: '#0000FF' },
        ],
        gradientStart: { x: 0, y: 0 },
        gradientEnd: { x: 100, y: 100 },
      };

      // Act
      await component.applyStyle(contextId, style);

      // Assert: Gradient created
      const currentStyle = mockGraphicsEngine.getCurrentStyle();
      expect(currentStyle.fillType).toBe('linear-gradient');
      expect(currentStyle.gradientStops).toHaveLength(3);

      // Assert: Gradient configured
      expect(mockGraphicsEngine.hasGradient()).toBe(true);
    });

    it('should apply shadow effect', async () => {
      // Arrange
      const style = {
        shadowColor: '#000000',
        shadowBlur: 10,
        shadowOffsetX: 5,
        shadowOffsetY: 5,
        shadowOpacity: 0.5,
      };

      // Act
      await component.applyStyle(contextId, style);

      // Assert: Shadow applied
      const currentStyle = mockGraphicsEngine.getCurrentStyle();
      expect(currentStyle.shadowBlur).toBe(10);
      expect(currentStyle.shadowOffsetX).toBe(5);
    });

    it('should stack and restore styles', async () => {
      // Arrange
      const style1 = { fillColor: '#FF0000' };
      const style2 = { fillColor: '#00FF00' };

      // Act: Apply and save style1
      await component.applyStyle(contextId, style1);
      await component.saveStyle(contextId);

      // Act: Apply style2
      await component.applyStyle(contextId, style2);
      let currentStyle = mockGraphicsEngine.getCurrentStyle();
      expect(currentStyle.fillColor).toBe('#00FF00');

      // Act: Restore to style1
      await component.restoreStyle(contextId);
      currentStyle = mockGraphicsEngine.getCurrentStyle();

      // Assert: Back to style1
      expect(currentStyle.fillColor).toBe('#FF0000');
    });
  });

  // ===========================================================================
  // Transform Tests
  // ===========================================================================

  describe('Transform Operations', () => {
    let contextId: string;

    beforeEach(async () => {
      const context = await component.createContext({
        width: 800,
        height: 600,
        colorDepth: 32,
        antiAliasing: true,
      });
      contextId = context.id;
      await component.activateContext(contextId);
    });

    it('should apply translation', async () => {
      // Arrange
      const dx = 100;
      const dy = 50;

      // Act
      await component.translate(contextId, dx, dy);

      // Assert: Transform applied
      const transform = mockGraphicsEngine.getCurrentTransform();
      expect(transform.translateX).toBe(100);
      expect(transform.translateY).toBe(50);
    });

    it('should apply rotation', async () => {
      // Arrange
      const angle = Math.PI / 4; // 45 degrees

      // Act
      await component.rotate(contextId, angle);

      // Assert: Transform applied
      const transform = mockGraphicsEngine.getCurrentTransform();
      expect(transform.rotation).toBeCloseTo(Math.PI / 4, 5);
    });

    it('should apply scaling', async () => {
      // Arrange
      const scaleX = 2.0;
      const scaleY = 1.5;

      // Act
      await component.scale(contextId, scaleX, scaleY);

      // Assert: Transform applied
      const transform = mockGraphicsEngine.getCurrentTransform();
      expect(transform.scaleX).toBe(2.0);
      expect(transform.scaleY).toBe(1.5);
    });

    it('should compose transforms', async () => {
      // Act: Apply multiple transforms
      await component.translate(contextId, 100, 50);
      await component.rotate(contextId, Math.PI / 4);
      await component.scale(contextId, 2.0, 2.0);

      // Assert: All transforms composed
      const transform = mockGraphicsEngine.getCurrentTransform();
      expect(transform.translateX).toBe(100);
      expect(transform.translateY).toBe(50);
      expect(transform.rotation).toBeCloseTo(Math.PI / 4, 5);
      expect(transform.scaleX).toBe(2.0);
      expect(transform.scaleY).toBe(2.0);
    });

    it('should save and restore transform state', async () => {
      // Act: Apply transform and save
      await component.translate(contextId, 100, 50);
      await component.saveTransform(contextId);

      // Act: Apply additional transform
      await component.rotate(contextId, Math.PI / 2);
      let transform = mockGraphicsEngine.getCurrentTransform();
      expect(transform.rotation).toBeCloseTo(Math.PI / 2, 5);

      // Act: Restore
      await component.restoreTransform(contextId);
      transform = mockGraphicsEngine.getCurrentTransform();

      // Assert: Back to translation only
      expect(transform.translateX).toBe(100);
      expect(transform.translateY).toBe(50);
      expect(transform.rotation).toBe(0);
    });
  });

  // ===========================================================================
  // Buffer Management Tests
  // ===========================================================================

  describe('Buffer Management', () => {
    let contextId: string;

    beforeEach(async () => {
      const context = await component.createContext({
        width: 800,
        height: 600,
        colorDepth: 32,
        antiAliasing: true,
      });
      contextId = context.id;
      await component.activateContext(contextId);
    });

    it('should clear frame buffer', async () => {
      // Arrange: Render some shapes
      await component.renderShape(contextId, {
        type: 'rectangle',
        x: 0,
        y: 0,
        width: 800,
        height: 600,
        fillColor: '#FF0000',
      });

      // Act: Clear buffer
      await component.clearBuffer(contextId);

      // Assert: Buffer cleared
      const pixel = mockFrameBuffer.getPixel(400, 300);
      expect(pixel.red).toBe(0);
      expect(pixel.green).toBe(0);
      expect(pixel.blue).toBe(0);
    });

    it('should swap buffers for double buffering', async () => {
      // Arrange: Render to back buffer
      await component.renderShape(contextId, {
        type: 'rectangle',
        x: 0,
        y: 0,
        width: 100,
        height: 100,
        fillColor: '#FF0000',
      });

      // Act: Swap buffers
      await component.swapBuffers(contextId);

      // Assert: Back buffer now front buffer
      expect(mockFrameBuffer.getFrontBufferId()).not.toBe(
        mockFrameBuffer.getBackBufferId()
      );

      // Assert: Platform adapter notified
      expect(mockPlatformAdapter.wasBufferSwapped()).toBe(true);
    });

    it('should flush rendering commands', async () => {
      // Arrange: Queue multiple render commands
      await component.renderShape(contextId, {
        type: 'rectangle',
        x: 0,
        y: 0,
        width: 100,
        height: 100,
        fillColor: '#FF0000',
      });
      await component.renderShape(contextId, {
        type: 'circle',
        centerX: 200,
        centerY: 200,
        radius: 50,
        fillColor: '#00FF00',
      });

      // Act: Flush
      await component.flush(contextId);

      // Assert: All commands executed
      const drawCalls = mockGraphicsEngine.getDrawCalls();
      expect(drawCalls).toHaveLength(2);

      // Assert: Buffer flushed
      expect(mockGraphicsEngine.isCommandQueueEmpty()).toBe(true);
    });

    it('should read pixels from buffer', async () => {
      // Arrange: Render shape
      await component.renderShape(contextId, {
        type: 'rectangle',
        x: 100,
        y: 100,
        width: 100,
        height: 100,
        fillColor: '#FF0000',
      });

      // Act: Read pixels
      const pixels = await component.readPixels(contextId, {
        x: 100,
        y: 100,
        width: 100,
        height: 100,
      });

      // Assert: Pixel data returned
      expect(pixels).toBeDefined();
      expect(pixels.width).toBe(100);
      expect(pixels.height).toBe(100);
      expect(pixels.data).toBeInstanceOf(Uint8Array);
      expect(pixels.data[0]).toBeGreaterThan(200); // Red channel
    });
  });

  // ===========================================================================
  // Performance Tests
  // ===========================================================================

  describe('Performance', () => {
    let contextId: string;

    beforeEach(async () => {
      const context = await component.createContext({
        width: 800,
        height: 600,
        colorDepth: 32,
        antiAliasing: true,
      });
      contextId = context.id;
      await component.activateContext(contextId);
    });

    it('should render 1000 shapes within time limit', async () => {
      // Arrange
      const shapes = Array.from({ length: 1000 }, (_, i) => ({
        type: 'rectangle',
        x: (i % 10) * 80,
        y: Math.floor(i / 10) * 60,
        width: 70,
        height: 50,
        fillColor: '#FF0000',
      }));

      const startTime = Date.now();

      // Act
      await component.batchRenderShapes(contextId, shapes);

      const duration = Date.now() - startTime;

      // Assert: Completed within 2 seconds
      expect(duration).toBeLessThan(2000);

      // Assert: All rendered
      const drawCalls = mockGraphicsEngine.getDrawCalls();
      expect(drawCalls.length).toBeGreaterThan(0);
    });

    it('should handle rapid context switches', async () => {
      // Arrange: Create multiple contexts
      const contexts = await Promise.all(
        Array.from({ length: 10 }, () =>
          component.createContext({
            width: 800,
            height: 600,
            colorDepth: 32,
            antiAliasing: true,
          })
        )
      );

      const startTime = Date.now();

      // Act: Switch between contexts rapidly
      for (let i = 0; i < 100; i++) {
        const ctx = contexts[i % 10];
        await component.activateContext(ctx.id);
      }

      const duration = Date.now() - startTime;

      // Assert: Completed within 1 second
      expect(duration).toBeLessThan(1000);
    });
  });
});

/**
 * Test Coverage Summary:
 *
 * - Rendering Context Management (4 tests)
 *   - Create, activate, switch, destroy
 *
 * - Shape Rendering (5 tests)
 *   - Rectangle, circle, text, path
 *   - Batch rendering
 *
 * - Style Application (5 tests)
 *   - Fill, stroke, gradient, shadow
 *   - Style stack (save/restore)
 *
 * - Transform Operations (5 tests)
 *   - Translation, rotation, scaling
 *   - Transform composition
 *   - Transform stack (save/restore)
 *
 * - Buffer Management (4 tests)
 *   - Clear, swap, flush, read pixels
 *
 * - Performance (2 tests)
 *   - Bulk rendering
 *   - Rapid context switching
 *
 * Total: 25 tests
 *
 * This component test verifies the interaction between:
 * - RenderingContext (context management)
 * - ShapeRenderer (shape drawing)
 * - StyleApplicator (style application)
 * - TransformManager (coordinate transforms)
 * - BufferManager (frame buffer operations)
 * - GraphicsEngine (low-level graphics API)
 */
