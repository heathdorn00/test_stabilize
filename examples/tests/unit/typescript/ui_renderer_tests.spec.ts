/**
 * Unit Tests - UI Renderer Service (TypeScript)
 * Task: 57fbde - Comprehensive Test Framework / RDB-002
 * Layer 1: Unit Tests
 *
 * Tests individual classes in UI Renderer service in isolation.
 */

import { ShapeRenderer } from '@/services/ui-renderer/shape-renderer';
import { StyleApplicator } from '@/services/ui-renderer/style-applicator';
import { TransformManager } from '@/services/ui-renderer/transform-manager';
import { FrameBuffer } from '@/services/ui-renderer/frame-buffer';
import { RenderContext } from '@/services/ui-renderer/render-context';
import { MockGraphicsContext } from '@/test-utils/mocks';

describe('ShapeRenderer', () => {
  let renderer: ShapeRenderer;
  let mockContext: MockGraphicsContext;

  beforeEach(() => {
    mockContext = new MockGraphicsContext();
    renderer = new ShapeRenderer(mockContext);
  });

  it('should render rectangle', () => {
    const shape = {
      type: 'rectangle',
      x: 10,
      y: 20,
      width: 100,
      height: 50,
    };

    renderer.render(shape);

    expect(mockContext.hasShape('rectangle')).toBe(true);
    expect(mockContext.getLastShape()).toMatchObject({
      x: 10,
      y: 20,
      width: 100,
      height: 50,
    });
  });

  it('should render circle', () => {
    const shape = {
      type: 'circle',
      x: 50,
      y: 50,
      radius: 25,
    };

    renderer.render(shape);

    expect(mockContext.hasShape('circle')).toBe(true);
    expect(mockContext.getLastShape()).toMatchObject({
      x: 50,
      y: 50,
      radius: 25,
    });
  });

  it('should render line', () => {
    const shape = {
      type: 'line',
      x1: 0,
      y1: 0,
      x2: 100,
      y2: 100,
    };

    renderer.render(shape);

    expect(mockContext.hasShape('line')).toBe(true);
  });

  it('should render polygon', () => {
    const shape = {
      type: 'polygon',
      points: [
        { x: 0, y: 0 },
        { x: 50, y: 0 },
        { x: 25, y: 50 },
      ],
    };

    renderer.render(shape);

    expect(mockContext.hasShape('polygon')).toBe(true);
    expect(mockContext.getLastShape().points.length).toBe(3);
  });

  it('should render text', () => {
    const shape = {
      type: 'text',
      x: 10,
      y: 20,
      text: 'Hello World',
      fontSize: 16,
      fontFamily: 'Arial',
    };

    renderer.render(shape);

    expect(mockContext.hasShape('text')).toBe(true);
    expect(mockContext.getLastShape().text).toBe('Hello World');
  });

  it('should handle empty shape list', () => {
    expect(() => renderer.renderBatch([])).not.toThrow();
    expect(mockContext.getShapeCount()).toBe(0);
  });

  it('should batch render multiple shapes', () => {
    const shapes = [
      { type: 'rectangle', x: 0, y: 0, width: 10, height: 10 },
      { type: 'circle', x: 20, y: 20, radius: 5 },
      { type: 'line', x1: 0, y1: 0, x2: 30, y2: 30 },
    ];

    renderer.renderBatch(shapes);

    expect(mockContext.getShapeCount()).toBe(3);
  });

  it('should apply clipping region', () => {
    renderer.setClipRegion({ x: 0, y: 0, width: 100, height: 100 });

    const shape = { type: 'rectangle', x: 50, y: 50, width: 200, height: 200 };
    renderer.render(shape);

    expect(mockContext.isClipped()).toBe(true);
  });

  it('should clear clipping region', () => {
    renderer.setClipRegion({ x: 0, y: 0, width: 100, height: 100 });
    renderer.clearClipRegion();

    expect(mockContext.isClipped()).toBe(false);
  });

  it('should track render count', () => {
    renderer.render({ type: 'rectangle', x: 0, y: 0, width: 10, height: 10 });
    renderer.render({ type: 'circle', x: 0, y: 0, radius: 5 });

    expect(renderer.getRenderCount()).toBe(2);
  });

  it('should reset render count', () => {
    renderer.render({ type: 'rectangle', x: 0, y: 0, width: 10, height: 10 });
    renderer.resetCount();

    expect(renderer.getRenderCount()).toBe(0);
  });
});

describe('StyleApplicator', () => {
  let applicator: StyleApplicator;
  let mockContext: MockGraphicsContext;

  beforeEach(() => {
    mockContext = new MockGraphicsContext();
    applicator = new StyleApplicator(mockContext);
  });

  it('should apply fill color', () => {
    applicator.applyFillColor('#FF0000');

    expect(mockContext.getFillColor()).toBe('#FF0000');
  });

  it('should apply stroke color', () => {
    applicator.applyStrokeColor('#00FF00');

    expect(mockContext.getStrokeColor()).toBe('#00FF00');
  });

  it('should apply stroke width', () => {
    applicator.applyStrokeWidth(5);

    expect(mockContext.getStrokeWidth()).toBe(5);
  });

  it('should apply opacity', () => {
    applicator.applyOpacity(0.5);

    expect(mockContext.getOpacity()).toBe(0.5);
  });

  it('should apply font style', () => {
    applicator.applyFont({
      family: 'Arial',
      size: 16,
      weight: 'bold',
      style: 'italic',
    });

    const font = mockContext.getFont();
    expect(font.family).toBe('Arial');
    expect(font.size).toBe(16);
    expect(font.weight).toBe('bold');
  });

  it('should apply shadow', () => {
    applicator.applyShadow({
      offsetX: 2,
      offsetY: 2,
      blur: 4,
      color: '#000000',
    });

    const shadow = mockContext.getShadow();
    expect(shadow.offsetX).toBe(2);
    expect(shadow.blur).toBe(4);
  });

  it('should clear shadow', () => {
    applicator.applyShadow({ offsetX: 2, offsetY: 2, blur: 4, color: '#000000' });
    applicator.clearShadow();

    expect(mockContext.hasShadow()).toBe(false);
  });

  it('should apply gradient fill', () => {
    const gradient = {
      type: 'linear',
      x0: 0,
      y0: 0,
      x1: 100,
      y1: 0,
      stops: [
        { offset: 0, color: '#FF0000' },
        { offset: 1, color: '#0000FF' },
      ],
    };

    applicator.applyGradient(gradient);

    expect(mockContext.hasGradient()).toBe(true);
  });

  it('should apply line cap style', () => {
    applicator.applyLineCap('round');

    expect(mockContext.getLineCap()).toBe('round');
  });

  it('should apply line join style', () => {
    applicator.applyLineJoin('bevel');

    expect(mockContext.getLineJoin()).toBe('bevel');
  });

  it('should apply composite operation', () => {
    applicator.applyCompositeOperation('multiply');

    expect(mockContext.getCompositeOperation()).toBe('multiply');
  });

  it('should reset all styles to defaults', () => {
    applicator.applyFillColor('#FF0000');
    applicator.applyStrokeWidth(10);
    applicator.applyOpacity(0.5);

    applicator.resetToDefaults();

    expect(mockContext.getFillColor()).toBe('#000000');
    expect(mockContext.getStrokeWidth()).toBe(1);
    expect(mockContext.getOpacity()).toBe(1);
  });
});

describe('TransformManager', () => {
  let transformManager: TransformManager;
  let mockContext: MockGraphicsContext;

  beforeEach(() => {
    mockContext = new MockGraphicsContext();
    transformManager = new TransformManager(mockContext);
  });

  it('should apply translation', () => {
    transformManager.translate(50, 100);

    const transform = mockContext.getTransform();
    expect(transform.tx).toBe(50);
    expect(transform.ty).toBe(100);
  });

  it('should apply rotation', () => {
    transformManager.rotate(Math.PI / 4); // 45 degrees

    const transform = mockContext.getTransform();
    expect(transform.rotation).toBeCloseTo(Math.PI / 4, 5);
  });

  it('should apply scale', () => {
    transformManager.scale(2, 3);

    const transform = mockContext.getTransform();
    expect(transform.scaleX).toBe(2);
    expect(transform.scaleY).toBe(3);
  });

  it('should apply uniform scale', () => {
    transformManager.scaleUniform(2);

    const transform = mockContext.getTransform();
    expect(transform.scaleX).toBe(2);
    expect(transform.scaleY).toBe(2);
  });

  it('should save transform state', () => {
    transformManager.translate(10, 20);
    transformManager.save();

    expect(transformManager.getStackDepth()).toBe(1);
  });

  it('should restore transform state', () => {
    transformManager.translate(10, 20);
    transformManager.save();

    transformManager.translate(30, 40);
    transformManager.restore();

    const transform = mockContext.getTransform();
    expect(transform.tx).toBe(10);
    expect(transform.ty).toBe(20);
  });

  it('should handle nested save/restore', () => {
    transformManager.translate(10, 10);
    transformManager.save();

    transformManager.translate(20, 20);
    transformManager.save();

    transformManager.translate(30, 30);

    transformManager.restore(); // Back to (30, 30)
    transformManager.restore(); // Back to (10, 10)

    const transform = mockContext.getTransform();
    expect(transform.tx).toBe(10);
  });

  it('should reset transform to identity', () => {
    transformManager.translate(50, 100);
    transformManager.rotate(Math.PI / 2);
    transformManager.scale(2, 3);

    transformManager.resetToIdentity();

    const transform = mockContext.getTransform();
    expect(transform.tx).toBe(0);
    expect(transform.ty).toBe(0);
    expect(transform.rotation).toBe(0);
    expect(transform.scaleX).toBe(1);
    expect(transform.scaleY).toBe(1);
  });

  it('should transform point', () => {
    transformManager.translate(10, 20);
    transformManager.scale(2, 2);

    const result = transformManager.transformPoint({ x: 5, y: 5 });

    expect(result.x).toBe(20); // (5 * 2) + 10
    expect(result.y).toBe(30); // (5 * 2) + 20
  });

  it('should inverse transform point', () => {
    transformManager.translate(10, 20);
    transformManager.scale(2, 2);

    const result = transformManager.inverseTransformPoint({ x: 20, y: 30 });

    expect(result.x).toBe(5);
    expect(result.y).toBe(5);
  });

  it('should handle empty transform stack', () => {
    expect(() => transformManager.restore()).not.toThrow();
  });
});

describe('FrameBuffer', () => {
  let frameBuffer: FrameBuffer;

  beforeEach(() => {
    frameBuffer = new FrameBuffer(800, 600);
  });

  it('should initialize with correct dimensions', () => {
    expect(frameBuffer.getWidth()).toBe(800);
    expect(frameBuffer.getHeight()).toBe(600);
  });

  it('should set pixel color', () => {
    frameBuffer.setPixel(10, 20, { r: 255, g: 0, b: 0, a: 255 });

    const pixel = frameBuffer.getPixel(10, 20);
    expect(pixel.r).toBe(255);
    expect(pixel.g).toBe(0);
    expect(pixel.b).toBe(0);
  });

  it('should clear to color', () => {
    frameBuffer.setPixel(10, 20, { r: 255, g: 0, b: 0, a: 255 });
    frameBuffer.clear({ r: 0, g: 0, b: 0, a: 255 });

    const pixel = frameBuffer.getPixel(10, 20);
    expect(pixel.r).toBe(0);
  });

  it('should fill rectangle', () => {
    frameBuffer.fillRect(10, 10, 50, 30, { r: 100, g: 150, b: 200, a: 255 });

    const pixel = frameBuffer.getPixel(15, 15);
    expect(pixel.r).toBe(100);
    expect(pixel.g).toBe(150);
    expect(pixel.b).toBe(200);
  });

  it('should handle out-of-bounds pixel access', () => {
    const pixel = frameBuffer.getPixel(1000, 1000);
    expect(pixel).toBeNull();
  });

  it('should copy region to another buffer', () => {
    const source = new FrameBuffer(100, 100);
    source.fillRect(0, 0, 100, 100, { r: 255, g: 0, b: 0, a: 255 });

    frameBuffer.copyFrom(source, { x: 0, y: 0, width: 50, height: 50 }, { x: 10, y: 10 });

    const pixel = frameBuffer.getPixel(15, 15);
    expect(pixel.r).toBe(255);
  });

  it('should resize buffer', () => {
    frameBuffer.resize(1024, 768);

    expect(frameBuffer.getWidth()).toBe(1024);
    expect(frameBuffer.getHeight()).toBe(768);
  });

  it('should get buffer data', () => {
    frameBuffer.setPixel(0, 0, { r: 255, g: 128, b: 64, a: 255 });

    const data = frameBuffer.getData();
    expect(data).toBeInstanceOf(Uint8ClampedArray);
    expect(data.length).toBe(800 * 600 * 4);
  });

  it('should create from existing data', () => {
    const data = new Uint8ClampedArray(100 * 100 * 4);
    data[0] = 255; // Red channel of first pixel

    const buffer = FrameBuffer.fromData(data, 100, 100);
    const pixel = buffer.getPixel(0, 0);

    expect(pixel.r).toBe(255);
  });
});

describe('RenderContext', () => {
  let context: RenderContext;

  beforeEach(() => {
    context = new RenderContext({ width: 800, height: 600 });
  });

  it('should initialize with dimensions', () => {
    expect(context.getWidth()).toBe(800);
    expect(context.getHeight()).toBe(600);
  });

  it('should track dirty regions', () => {
    context.markDirty({ x: 10, y: 10, width: 50, height: 50 });

    expect(context.hasDirtyRegions()).toBe(true);
  });

  it('should merge overlapping dirty regions', () => {
    context.markDirty({ x: 10, y: 10, width: 50, height: 50 });
    context.markDirty({ x: 30, y: 30, width: 50, height: 50 });

    const regions = context.getDirtyRegions();
    expect(regions.length).toBe(1); // Should merge
  });

  it('should clear dirty regions', () => {
    context.markDirty({ x: 10, y: 10, width: 50, height: 50 });
    context.clearDirty();

    expect(context.hasDirtyRegions()).toBe(false);
  });

  it('should set viewport', () => {
    context.setViewport({ x: 0, y: 0, width: 400, height: 300 });

    const viewport = context.getViewport();
    expect(viewport.width).toBe(400);
    expect(viewport.height).toBe(300);
  });

  it('should track render layers', () => {
    context.createLayer('background');
    context.createLayer('foreground');

    expect(context.getLayerCount()).toBe(2);
  });

  it('should switch active layer', () => {
    context.createLayer('background');
    context.createLayer('foreground');

    context.setActiveLayer('foreground');

    expect(context.getActiveLayer()).toBe('foreground');
  });

  it('should handle non-existent layer', () => {
    expect(() => context.setActiveLayer('invalid')).toThrow(/layer not found/i);
  });
});

/**
 * Test Coverage: 51 tests
 * - ShapeRenderer: 11 tests (rectangle, circle, line, polygon, text, batch, clip, count)
 * - StyleApplicator: 12 tests (fill, stroke, opacity, font, shadow, gradient, line styles, composite, reset)
 * - TransformManager: 12 tests (translate, rotate, scale, save/restore, identity, point transforms)
 * - FrameBuffer: 9 tests (dimensions, pixels, clear, fill, copy, resize, data access)
 * - RenderContext: 7 tests (dimensions, dirty regions, viewport, layers)
 */
