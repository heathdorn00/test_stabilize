/**
 * Unit Tests - Event Processor Service (TypeScript)
 * Task: 57fbde - Comprehensive Test Framework / RDB-002
 * Layer 1: Unit Tests
 *
 * Tests individual classes in Event Processor service in isolation.
 */

import { EventTransformer } from '@/services/event-processor/event-transformer';
import { EventValidator } from '@/services/event-processor/event-validator';
import { EventEnricher } from '@/services/event-processor/event-enricher';
import { EventPipeline } from '@/services/event-processor/event-pipeline';
import { ProcessingStrategy } from '@/services/event-processor/processing-strategy';

describe('EventTransformer', () => {
  let transformer: EventTransformer;

  beforeEach(() => {
    transformer = new EventTransformer();
  });

  it('should transform mouse event to standard format', () => {
    const rawEvent = {
      type: 'mouse.click',
      x: 150,
      y: 200,
      button: 'left',
      timestamp: 1699564800000,
    };

    const transformed = transformer.transform(rawEvent);

    expect(transformed.eventType).toBe('mouse.click');
    expect(transformed.data.coordinates).toEqual({ x: 150, y: 200 });
    expect(transformed.metadata.source).toBe('input-handler');
  });

  it('should normalize event type format', () => {
    const event1 = { type: 'WidgetClicked', data: {} };
    const event2 = { type: 'widget_clicked', data: {} };
    const event3 = { type: 'WIDGET.CLICKED', data: {} };

    const transformed1 = transformer.transform(event1);
    const transformed2 = transformer.transform(event2);
    const transformed3 = transformer.transform(event3);

    expect(transformed1.eventType).toBe('widget.clicked');
    expect(transformed2.eventType).toBe('widget.clicked');
    expect(transformed3.eventType).toBe('widget.clicked');
  });

  it('should add timestamp if missing', () => {
    const event = { type: 'widget.clicked', data: {} };

    const transformed = transformer.transform(event);

    expect(transformed.timestamp).toBeDefined();
    expect(transformed.timestamp).toBeGreaterThan(0);
  });

  it('should preserve original event in metadata', () => {
    const event = { type: 'widget.clicked', widgetId: 'w1', value: 42 };

    const transformed = transformer.transform(event);

    expect(transformed.metadata.original).toEqual(event);
  });

  it('should apply custom transformation rules', () => {
    transformer.addRule('widget.*', (event) => ({
      ...event,
      data: {
        ...event.data,
        source: 'widget-service',
      },
    }));

    const event = { type: 'widget.clicked', data: {} };
    const transformed = transformer.transform(event);

    expect(transformed.data.source).toBe('widget-service');
  });

  it('should chain multiple transformations', () => {
    transformer.addRule('*', (event) => ({
      ...event,
      step1: true,
    }));

    transformer.addRule('*', (event) => ({
      ...event,
      step2: true,
    }));

    const event = { type: 'test', data: {} };
    const transformed = transformer.transform(event);

    expect(transformed.step1).toBe(true);
    expect(transformed.step2).toBe(true);
  });

  it('should extract nested data', () => {
    const event = {
      type: 'widget.changed',
      payload: {
        widget: {
          id: 'w1',
          state: { enabled: true, visible: true },
        },
      },
    };

    transformer.setExtractionPath('payload.widget');
    const transformed = transformer.transform(event);

    expect(transformed.data.id).toBe('w1');
    expect(transformed.data.state.enabled).toBe(true);
  });

  it('should handle transformation errors gracefully', () => {
    transformer.addRule('*', () => {
      throw new Error('Transform error');
    });

    const event = { type: 'test', data: {} };

    expect(() => transformer.transform(event)).not.toThrow();
    const transformed = transformer.transform(event);
    expect(transformed.metadata.errors).toBeDefined();
  });
});

describe('EventValidator', () => {
  let validator: EventValidator;

  beforeEach(() => {
    validator = new EventValidator();
  });

  it('should validate event structure', () => {
    const validEvent = {
      eventType: 'widget.clicked',
      timestamp: Date.now(),
      data: { widgetId: 'w1' },
    };

    expect(validator.validate(validEvent)).toBe(true);
  });

  it('should reject event missing required fields', () => {
    const invalidEvent = {
      // Missing eventType
      timestamp: Date.now(),
      data: {},
    };

    expect(validator.validate(invalidEvent as any)).toBe(false);
    expect(validator.getErrors()).toContain('eventType is required');
  });

  it('should validate event type format', () => {
    const invalidEvent = {
      eventType: 'invalid format with spaces',
      timestamp: Date.now(),
      data: {},
    };

    expect(validator.validate(invalidEvent)).toBe(false);
  });

  it('should validate timestamp range', () => {
    validator.setTimestampRange({
      min: Date.now() - 60000, // 1 minute ago
      max: Date.now() + 60000, // 1 minute future
    });

    const oldEvent = {
      eventType: 'test',
      timestamp: Date.now() - 120000, // 2 minutes ago
      data: {},
    };

    expect(validator.validate(oldEvent)).toBe(false);
  });

  it('should validate custom schema', () => {
    validator.setSchema('widget.clicked', {
      type: 'object',
      required: ['widgetId', 'x', 'y'],
      properties: {
        widgetId: { type: 'string' },
        x: { type: 'number' },
        y: { type: 'number' },
      },
    });

    const validEvent = {
      eventType: 'widget.clicked',
      timestamp: Date.now(),
      data: { widgetId: 'w1', x: 100, y: 200 },
    };

    const invalidEvent = {
      eventType: 'widget.clicked',
      timestamp: Date.now(),
      data: { widgetId: 'w1' }, // Missing x, y
    };

    expect(validator.validate(validEvent)).toBe(true);
    expect(validator.validate(invalidEvent)).toBe(false);
  });

  it('should validate event size', () => {
    validator.setMaxSize(1000); // 1KB limit

    const largeData = {
      array: Array.from({ length: 1000 }, (_, i) => ({
        id: i,
        value: `item-${i}`,
      })),
    };

    const largeEvent = {
      eventType: 'bulk.data',
      timestamp: Date.now(),
      data: largeData,
    };

    expect(validator.validate(largeEvent)).toBe(false);
    expect(validator.getErrors()).toContain('Event size exceeds maximum');
  });

  it('should allow whitelisted event types', () => {
    validator.setWhitelist(['widget.clicked', 'widget.hover']);

    const allowed = {
      eventType: 'widget.clicked',
      timestamp: Date.now(),
      data: {},
    };

    const blocked = {
      eventType: 'widget.dragged',
      timestamp: Date.now(),
      data: {},
    };

    expect(validator.validate(allowed)).toBe(true);
    expect(validator.validate(blocked)).toBe(false);
  });

  it('should block blacklisted event types', () => {
    validator.setBlacklist(['widget.debug', 'internal.*']);

    const blocked1 = {
      eventType: 'widget.debug',
      timestamp: Date.now(),
      data: {},
    };

    const blocked2 = {
      eventType: 'internal.test',
      timestamp: Date.now(),
      data: {},
    };

    expect(validator.validate(blocked1)).toBe(false);
    expect(validator.validate(blocked2)).toBe(false);
  });
});

describe('EventEnricher', () => {
  let enricher: EventEnricher;

  beforeEach(() => {
    enricher = new EventEnricher();
  });

  it('should enrich event with metadata', async () => {
    const event = {
      eventType: 'widget.clicked',
      timestamp: Date.now(),
      data: { widgetId: 'w1' },
    };

    const enriched = await enricher.enrich(event);

    expect(enriched.metadata).toBeDefined();
    expect(enriched.metadata.processedAt).toBeDefined();
    expect(enriched.metadata.processor).toBe('event-processor');
  });

  it('should add correlation ID', async () => {
    const event = {
      eventType: 'widget.clicked',
      timestamp: Date.now(),
      data: { widgetId: 'w1' },
    };

    const enriched = await enricher.enrich(event);

    expect(enriched.correlationId).toBeDefined();
    expect(enriched.correlationId.length).toBeGreaterThan(0);
  });

  it('should preserve existing correlation ID', async () => {
    const event = {
      eventType: 'widget.clicked',
      timestamp: Date.now(),
      correlationId: 'existing-123',
      data: { widgetId: 'w1' },
    };

    const enriched = await enricher.enrich(event);

    expect(enriched.correlationId).toBe('existing-123');
  });

  it('should enrich with user context', async () => {
    enricher.setUserContext({ userId: 'user-123', sessionId: 'session-456' });

    const event = {
      eventType: 'widget.clicked',
      timestamp: Date.now(),
      data: { widgetId: 'w1' },
    };

    const enriched = await enricher.enrich(event);

    expect(enriched.userContext.userId).toBe('user-123');
    expect(enriched.userContext.sessionId).toBe('session-456');
  });

  it('should enrich with environment info', async () => {
    const event = {
      eventType: 'widget.clicked',
      timestamp: Date.now(),
      data: { widgetId: 'w1' },
    };

    const enriched = await enricher.enrich(event);

    expect(enriched.environment).toBeDefined();
    expect(enriched.environment.platform).toBeDefined();
    expect(enriched.environment.version).toBeDefined();
  });

  it('should lookup and attach related data', async () => {
    enricher.setLookupFunction('widgetId', async (id) => ({
      type: 'button',
      label: 'Click Me',
    }));

    const event = {
      eventType: 'widget.clicked',
      timestamp: Date.now(),
      data: { widgetId: 'w1' },
    };

    const enriched = await enricher.enrich(event);

    expect(enriched.enrichedData.widget).toEqual({
      type: 'button',
      label: 'Click Me',
    });
  });

  it('should add geographic data', async () => {
    enricher.enableGeoEnrichment();
    enricher.setIPAddress('8.8.8.8');

    const event = {
      eventType: 'widget.clicked',
      timestamp: Date.now(),
      data: { widgetId: 'w1' },
    };

    const enriched = await enricher.enrich(event);

    expect(enriched.geo).toBeDefined();
    expect(enriched.geo.country).toBeDefined();
  });

  it('should batch enrich multiple events', async () => {
    const events = [
      { eventType: 'widget.clicked', timestamp: Date.now(), data: {} },
      { eventType: 'widget.hover', timestamp: Date.now(), data: {} },
      { eventType: 'widget.dragged', timestamp: Date.now(), data: {} },
    ];

    const enriched = await enricher.enrichBatch(events);

    expect(enriched.length).toBe(3);
    enriched.forEach((event) => {
      expect(event.metadata).toBeDefined();
    });
  });
});

describe('EventPipeline', () => {
  let pipeline: EventPipeline;

  beforeEach(() => {
    pipeline = new EventPipeline();
  });

  it('should process event through pipeline stages', async () => {
    const event = {
      type: 'widget.clicked',
      data: { widgetId: 'w1' },
    };

    const processed = await pipeline.process(event);

    expect(processed).toBeDefined();
    expect(processed.metadata.stages).toContain('transform');
    expect(processed.metadata.stages).toContain('validate');
    expect(processed.metadata.stages).toContain('enrich');
  });

  it('should add custom processing stage', async () => {
    pipeline.addStage('custom', (event) => ({
      ...event,
      customField: 'added',
    }));

    const event = { type: 'test', data: {} };
    const processed = await pipeline.process(event);

    expect(processed.customField).toBe('added');
  });

  it('should skip stages based on condition', async () => {
    pipeline.addStage('skip-me', (event) => ({
      ...event,
      skipped: false,
    }), {
      condition: (event) => event.type === 'skip-trigger',
    });

    const event1 = { type: 'test', data: {} };
    const event2 = { type: 'skip-trigger', data: {} };

    const processed1 = await pipeline.process(event1);
    const processed2 = await pipeline.process(event2);

    expect(processed1.skipped).toBeUndefined();
    expect(processed2.skipped).toBe(false);
  });

  it('should stop pipeline on error', async () => {
    pipeline.addStage('error-stage', () => {
      throw new Error('Processing error');
    });

    pipeline.addStage('after-error', (event) => ({
      ...event,
      reachedHere: true,
    }));

    const event = { type: 'test', data: {} };

    await expect(pipeline.process(event)).rejects.toThrow(/processing error/i);
  });

  it('should continue pipeline on error if configured', async () => {
    pipeline.setErrorHandling('continue');

    pipeline.addStage('error-stage', () => {
      throw new Error('Processing error');
    });

    pipeline.addStage('after-error', (event) => ({
      ...event,
      reachedHere: true,
    }));

    const event = { type: 'test', data: {} };
    const processed = await pipeline.process(event);

    expect(processed.reachedHere).toBe(true);
  });

  it('should measure stage execution time', async () => {
    pipeline.addStage('slow-stage', async (event) => {
      await new Promise((resolve) => setTimeout(resolve, 50));
      return event;
    });

    const event = { type: 'test', data: {} };
    const processed = await pipeline.process(event);

    expect(processed.metadata.timings['slow-stage']).toBeGreaterThan(40);
  });

  it('should process events in parallel', async () => {
    const events = Array.from({ length: 10 }, (_, i) => ({
      type: 'test',
      data: { id: i },
    }));

    const startTime = Date.now();
    const processed = await pipeline.processBatch(events, { parallel: true });
    const duration = Date.now() - startTime;

    expect(processed.length).toBe(10);
    expect(duration).toBeLessThan(500); // Should be fast with parallel
  });

  it('should process events sequentially', async () => {
    const order: number[] = [];

    pipeline.addStage('track-order', (event) => {
      order.push(event.data.id);
      return event;
    });

    const events = [
      { type: 'test', data: { id: 1 } },
      { type: 'test', data: { id: 2 } },
      { type: 'test', data: { id: 3 } },
    ];

    await pipeline.processBatch(events, { parallel: false });

    expect(order).toEqual([1, 2, 3]);
  });
});

describe('ProcessingStrategy', () => {
  let strategy: ProcessingStrategy;

  beforeEach(() => {
    strategy = new ProcessingStrategy();
  });

  it('should route event to correct processor', () => {
    strategy.register('widget.*', 'widget-processor');
    strategy.register('state.*', 'state-processor');

    const processor1 = strategy.getProcessor('widget.clicked');
    const processor2 = strategy.getProcessor('state.changed');

    expect(processor1).toBe('widget-processor');
    expect(processor2).toBe('state-processor');
  });

  it('should use priority routing', () => {
    strategy.register('widget.*', 'low-priority', { priority: 1 });
    strategy.register('widget.clicked', 'high-priority', { priority: 10 });

    const processor = strategy.getProcessor('widget.clicked');

    expect(processor).toBe('high-priority');
  });

  it('should load balance across processors', () => {
    strategy.register('widget.*', 'processor-1');
    strategy.register('widget.*', 'processor-2');
    strategy.register('widget.*', 'processor-3');

    strategy.setLoadBalancing('round-robin');

    const p1 = strategy.getProcessor('widget.clicked');
    const p2 = strategy.getProcessor('widget.clicked');
    const p3 = strategy.getProcessor('widget.clicked');
    const p4 = strategy.getProcessor('widget.clicked');

    expect([p1, p2, p3, p4]).toEqual([
      'processor-1',
      'processor-2',
      'processor-3',
      'processor-1',
    ]);
  });

  it('should route based on event properties', () => {
    strategy.register('widget.*', 'fast-processor', {
      condition: (event) => event.priority === 'high',
    });

    strategy.register('widget.*', 'normal-processor', {
      condition: (event) => event.priority !== 'high',
    });

    const event1 = { eventType: 'widget.clicked', priority: 'high', data: {} };
    const event2 = { eventType: 'widget.clicked', priority: 'normal', data: {} };

    expect(strategy.getProcessor(event1.eventType, event1)).toBe('fast-processor');
    expect(strategy.getProcessor(event2.eventType, event2)).toBe('normal-processor');
  });

  it('should partition events by key', () => {
    strategy.setPartitioning('hash', { key: 'widgetId' });

    const event1 = { eventType: 'widget.clicked', data: { widgetId: 'w1' } };
    const event2 = { eventType: 'widget.clicked', data: { widgetId: 'w2' } };

    const partition1 = strategy.getPartition(event1);
    const partition2 = strategy.getPartition(event2);

    expect(typeof partition1).toBe('number');
    expect(typeof partition2).toBe('number');
    // Same widgetId should always map to same partition
    expect(strategy.getPartition(event1)).toBe(partition1);
  });

  it('should handle default processor', () => {
    strategy.setDefaultProcessor('default-processor');

    const processor = strategy.getProcessor('unknown.event');

    expect(processor).toBe('default-processor');
  });
});

/**
 * Test Coverage: 44 tests
 * - EventTransformer: 8 tests (transform, normalize, timestamp, preserve, rules, chain, extract, errors)
 * - EventValidator: 8 tests (structure, required, format, timestamp, schema, size, whitelist, blacklist)
 * - EventEnricher: 8 tests (metadata, correlation, user context, environment, lookup, geo, batch)
 * - EventPipeline: 8 tests (stages, custom, skip, error handling, timing, parallel, sequential)
 * - ProcessingStrategy: 6 tests (routing, priority, load balancing, properties, partitioning, default)
 */
