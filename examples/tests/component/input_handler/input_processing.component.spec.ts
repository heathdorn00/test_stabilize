/**
 * Component Tests - Input Handler Input Processing
 * Task: 57fbde - Comprehensive Test Framework / RDB-002
 * Layer 2: Component Tests
 *
 * Tests interactions between EventParser, GestureRecognizer, InputValidator, and EventQueue.
 */

import { EventParser } from '@/services/input-handler/event-parser';
import { GestureRecognizer } from '@/services/input-handler/gesture-recognizer';
import { InputValidator } from '@/services/input-handler/input-validator';
import { EventQueue } from '@/services/input-handler/event-queue';
import { InputMapper } from '@/services/input-handler/input-mapper';
import { InputHandler } from '@/services/input-handler/input-handler';

describe('Input Handler Component - Input Processing', () => {
  let parser: EventParser;
  let gestureRecognizer: GestureRecognizer;
  let validator: InputValidator;
  let queue: EventQueue;
  let mapper: InputMapper;
  let inputHandler: InputHandler;

  beforeEach(() => {
    parser = new EventParser();
    gestureRecognizer = new GestureRecognizer();
    validator = new InputValidator();
    queue = new EventQueue();
    mapper = new InputMapper();

    inputHandler = new InputHandler({
      parser,
      gestureRecognizer,
      validator,
      queue,
      mapper,
    });

    validator.setBounds({ width: 1920, height: 1080 });
    mapper.loadDefaults();
  });

  describe('Mouse Input Processing', () => {
    it('should process mouse click through complete pipeline', async () => {
      const rawEvent = {
        type: 'mousedown',
        clientX: 150,
        clientY: 200,
        button: 0,
        timestamp: Date.now(),
      };

      await inputHandler.handleMouseEvent(rawEvent);

      expect(queue.size()).toBe(1);
      const event = queue.dequeue();
      expect(event.type).toBe('click');
      expect(event.x).toBe(150);
      expect(event.y).toBe(200);
      expect(event.button).toBe('left');
    });

    it('should validate and reject invalid mouse events', async () => {
      const invalidEvent = {
        type: 'mousedown',
        clientX: -100, // Invalid negative coordinate
        clientY: 200,
        button: 0,
        timestamp: Date.now(),
      };

      await inputHandler.handleMouseEvent(invalidEvent);

      expect(queue.size()).toBe(0); // Should be rejected
    });

    it('should validate coordinates within bounds', async () => {
      const outOfBounds = {
        type: 'mousedown',
        clientX: 2500, // Exceeds width of 1920
        clientY: 500,
        button: 0,
        timestamp: Date.now(),
      };

      await inputHandler.handleMouseEvent(outOfBounds);

      expect(queue.size()).toBe(0);
    });

    it('should normalize coordinates with offset and scale', async () => {
      parser.setCoordinateNormalization({
        offsetX: 100,
        offsetY: 200,
        scale: 2,
      });

      const rawEvent = {
        type: 'mousedown',
        clientX: 300,
        clientY: 600,
        button: 0,
        timestamp: Date.now(),
      };

      await inputHandler.handleMouseEvent(rawEvent);

      const event = queue.dequeue();
      expect(event.x).toBe(100); // (300 - 100) / 2
      expect(event.y).toBe(200); // (600 - 200) / 2
    });

    it('should map mouse events to actions', async () => {
      mapper.mapMouseButton('right', 'context-menu');

      const rawEvent = {
        type: 'mousedown',
        clientX: 150,
        clientY: 200,
        button: 2, // Right click
        timestamp: Date.now(),
      };

      await inputHandler.handleMouseEvent(rawEvent);

      const event = queue.dequeue();
      expect(event.action).toBe('context-menu');
    });
  });

  describe('Keyboard Input Processing', () => {
    it('should process keyboard event with modifiers', async () => {
      const rawEvent = {
        type: 'keydown',
        key: 's',
        code: 'KeyS',
        ctrlKey: true,
        shiftKey: false,
        altKey: false,
        metaKey: false,
        timestamp: Date.now(),
      };

      await inputHandler.handleKeyboardEvent(rawEvent);

      expect(queue.size()).toBe(1);
      const event = queue.dequeue();
      expect(event.key).toBe('s');
      expect(event.modifiers).toContain('ctrl');
    });

    it('should map key combinations to actions', async () => {
      mapper.mapKeyCombination(['ctrl', 's'], 'save');

      const rawEvent = {
        type: 'keydown',
        key: 's',
        code: 'KeyS',
        ctrlKey: true,
        shiftKey: false,
        altKey: false,
        metaKey: false,
        timestamp: Date.now(),
      };

      await inputHandler.handleKeyboardEvent(rawEvent);

      const event = queue.dequeue();
      expect(event.action).toBe('save');
    });

    it('should reject invalid keyboard events', async () => {
      const invalidEvent = {
        type: 'keydown',
        key: '', // Empty key
        code: 'Enter',
        ctrlKey: false,
        shiftKey: false,
        altKey: false,
        metaKey: false,
        timestamp: Date.now(),
      };

      await inputHandler.handleKeyboardEvent(invalidEvent);

      expect(queue.size()).toBe(0);
    });

    it('should validate modifier keys', async () => {
      const rawEvent = {
        type: 'keydown',
        key: 'a',
        code: 'KeyA',
        ctrlKey: true,
        shiftKey: true,
        altKey: true,
        metaKey: false,
        timestamp: Date.now(),
      };

      await inputHandler.handleKeyboardEvent(rawEvent);

      const event = queue.dequeue();
      expect(event.modifiers).toContain('ctrl');
      expect(event.modifiers).toContain('shift');
      expect(event.modifiers).toContain('alt');
      expect(event.modifiers.length).toBe(3);
    });
  });

  describe('Touch Input and Gesture Recognition', () => {
    it('should recognize tap gesture', async () => {
      const startTime = Date.now();

      await inputHandler.handleTouchEvent({
        type: 'touchstart',
        touches: [{ clientX: 100, clientY: 100, identifier: 0 }],
        timestamp: startTime,
      });

      await inputHandler.handleTouchEvent({
        type: 'touchend',
        touches: [],
        changedTouches: [{ clientX: 100, clientY: 100, identifier: 0 }],
        timestamp: startTime + 50,
      });

      const gesture = gestureRecognizer.getLastGesture();
      expect(gesture.type).toBe('tap');
    });

    it('should recognize swipe gesture', async () => {
      const startTime = Date.now();

      await inputHandler.handleTouchEvent({
        type: 'touchstart',
        touches: [{ clientX: 200, clientY: 100, identifier: 0 }],
        timestamp: startTime,
      });

      await inputHandler.handleTouchEvent({
        type: 'touchmove',
        touches: [{ clientX: 150, clientY: 100, identifier: 0 }],
        timestamp: startTime + 50,
      });

      await inputHandler.handleTouchEvent({
        type: 'touchend',
        touches: [],
        changedTouches: [{ clientX: 50, clientY: 100, identifier: 0 }],
        timestamp: startTime + 100,
      });

      const gesture = gestureRecognizer.getLastGesture();
      expect(gesture.type).toBe('swipe');
      expect(gesture.direction).toBe('left');
    });

    it('should recognize pinch gesture', async () => {
      const startTime = Date.now();

      await inputHandler.handleTouchEvent({
        type: 'touchstart',
        touches: [
          { clientX: 100, clientY: 100, identifier: 0 },
          { clientX: 200, clientY: 100, identifier: 1 },
        ],
        timestamp: startTime,
      });

      await inputHandler.handleTouchEvent({
        type: 'touchmove',
        touches: [
          { clientX: 125, clientY: 100, identifier: 0 },
          { clientX: 175, clientY: 100, identifier: 1 },
        ],
        timestamp: startTime + 100,
      });

      const gesture = gestureRecognizer.getLastGesture();
      expect(gesture.type).toBe('pinch');
      expect(gesture.scale).toBeLessThan(1);
    });

    it('should map gestures to actions', async () => {
      mapper.mapGesture('swipe-left', 'navigate-back');

      const startTime = Date.now();

      await inputHandler.handleTouchEvent({
        type: 'touchstart',
        touches: [{ clientX: 200, clientY: 100, identifier: 0 }],
        timestamp: startTime,
      });

      await inputHandler.handleTouchEvent({
        type: 'touchend',
        touches: [],
        changedTouches: [{ clientX: 50, clientY: 100, identifier: 0 }],
        timestamp: startTime + 100,
      });

      // Check if gesture was mapped to action
      const events = queue.getAll();
      const gestureEvent = events.find((e) => e.type === 'gesture');
      expect(gestureEvent?.action).toBe('navigate-back');
    });

    it('should validate multi-touch events', async () => {
      const invalidEvent = {
        type: 'touchmove',
        touches: [
          { clientX: 100, clientY: 200, identifier: 0 },
          { clientX: 300, clientY: 400, identifier: 0 }, // Duplicate ID
        ],
        timestamp: Date.now(),
      };

      await inputHandler.handleTouchEvent(invalidEvent);

      expect(queue.size()).toBe(0);
    });
  });

  describe('Event Queue Management', () => {
    it('should maintain FIFO order in queue', async () => {
      await inputHandler.handleMouseEvent({
        type: 'mousedown',
        clientX: 100,
        clientY: 100,
        button: 0,
      });

      await inputHandler.handleMouseEvent({
        type: 'mousedown',
        clientX: 200,
        clientY: 200,
        button: 0,
      });

      await inputHandler.handleMouseEvent({
        type: 'mousedown',
        clientX: 300,
        clientY: 300,
        button: 0,
      });

      const event1 = queue.dequeue();
      const event2 = queue.dequeue();
      const event3 = queue.dequeue();

      expect(event1.x).toBe(100);
      expect(event2.x).toBe(200);
      expect(event3.x).toBe(300);
    });

    it('should enforce queue size limit', async () => {
      queue.setMaxSize(5);

      // Send 10 events
      for (let i = 0; i < 10; i++) {
        await inputHandler.handleMouseEvent({
          type: 'mousedown',
          clientX: i * 10,
          clientY: i * 10,
          button: 0,
        });
      }

      expect(queue.size()).toBe(5);

      // First event should be dropped, second event should be first
      const firstEvent = queue.dequeue();
      expect(firstEvent.x).toBe(50); // Event 5, not event 0
    });

    it('should batch process queued events', async () => {
      await inputHandler.handleMouseEvent({
        type: 'mousedown',
        clientX: 100,
        clientY: 100,
        button: 0,
      });

      await inputHandler.handleMouseEvent({
        type: 'mousedown',
        clientX: 200,
        clientY: 200,
        button: 0,
      });

      const processedEvents: any[] = [];
      inputHandler.processQueue((event) => {
        processedEvents.push(event);
      });

      expect(processedEvents.length).toBe(2);
      expect(queue.isEmpty()).toBe(true);
    });
  });

  describe('Input Sanitization and Security', () => {
    it('should sanitize event data', async () => {
      const rawEvent = {
        type: 'mousedown',
        clientX: 150.7,
        clientY: 200.3,
        button: 0,
        extraField: 'should be removed',
        maliciousScript: '<script>alert("xss")</script>',
      };

      await inputHandler.handleMouseEvent(rawEvent);

      const event = queue.dequeue();
      expect(event.x).toBe(151); // Rounded
      expect(event.y).toBe(200);
      expect(event.extraField).toBeUndefined();
      expect(event.maliciousScript).toBeUndefined();
    });

    it('should prevent event injection', async () => {
      const rawEvent = {
        type: 'mousedown',
        clientX: 100,
        clientY: 100,
        button: 0,
        __proto__: { injected: true },
      };

      await inputHandler.handleMouseEvent(rawEvent);

      const event = queue.dequeue();
      expect(event.injected).toBeUndefined();
    });

    it('should validate timestamp freshness', async () => {
      validator.setTimestampTolerance(5000); // 5 seconds

      const oldEvent = {
        type: 'mousedown',
        clientX: 100,
        clientY: 100,
        button: 0,
        timestamp: Date.now() - 10000, // 10 seconds old
      };

      await inputHandler.handleMouseEvent(oldEvent);

      expect(queue.size()).toBe(0); // Should be rejected
    });
  });

  describe('Performance Optimization', () => {
    it('should throttle high-frequency mouse move events', async () => {
      inputHandler.setThrottling({ mousemove: { maxPerSecond: 60 } });

      // Send 200 mousemove events rapidly
      for (let i = 0; i < 200; i++) {
        await inputHandler.handleMouseEvent({
          type: 'mousemove',
          clientX: i,
          clientY: i,
          button: 0,
        });
      }

      // Should be throttled to ~60 events/second
      expect(queue.size()).toBeLessThan(70);
    });

    it('should debounce rapid key presses', async () => {
      inputHandler.setDebouncing({ keydown: { delay: 100 } });

      const events: any[] = [];
      inputHandler.on('keydown', (e: any) => events.push(e));

      // Rapid key presses
      for (let i = 0; i < 10; i++) {
        await inputHandler.handleKeyboardEvent({
          type: 'keydown',
          key: 'a',
          code: 'KeyA',
          ctrlKey: false,
          shiftKey: false,
          altKey: false,
          metaKey: false,
        });
      }

      await new Promise((resolve) => setTimeout(resolve, 150));

      // Should only trigger once after debounce delay
      expect(events.length).toBeLessThan(3);
    });

    it('should batch similar events', async () => {
      inputHandler.enableBatching({ batchSize: 5, batchDelay: 50 });

      for (let i = 0; i < 5; i++) {
        await inputHandler.handleMouseEvent({
          type: 'mousemove',
          clientX: i * 10,
          clientY: i * 10,
          button: 0,
        });
      }

      await new Promise((resolve) => setTimeout(resolve, 100));

      const batches = inputHandler.getBatches();
      expect(batches.length).toBe(1);
      expect(batches[0].events.length).toBe(5);
    });
  });

  describe('Error Handling and Recovery', () => {
    it('should handle parser errors gracefully', async () => {
      const malformedEvent = {
        type: 'mousedown',
        // Missing required fields
      };

      await inputHandler.handleMouseEvent(malformedEvent as any);

      expect(queue.size()).toBe(0);
      expect(inputHandler.getErrorCount()).toBe(1);
    });

    it('should recover from validator exceptions', async () => {
      // Force validator to throw
      validator.setStrictMode(true);

      const events: any[] = [];
      inputHandler.on('error', (e: any) => events.push(e));

      await inputHandler.handleMouseEvent({
        type: 'invalid-type',
        clientX: 100,
        clientY: 100,
        button: 0,
      } as any);

      expect(events.length).toBeGreaterThan(0);
    });

    it('should track error metrics', async () => {
      await inputHandler.handleMouseEvent({
        type: 'mousedown',
        clientX: -100, // Invalid
        clientY: 200,
        button: 0,
      });

      await inputHandler.handleMouseEvent({
        type: 'mousedown',
        clientX: 9999, // Out of bounds
        clientY: 200,
        button: 0,
      });

      const metrics = inputHandler.getMetrics();
      expect(metrics.errors.validation).toBe(2);
    });
  });
});

/**
 * Test Coverage: 27 tests
 * - Mouse input processing (5 tests)
 * - Keyboard input processing (4 tests)
 * - Touch input and gesture recognition (5 tests)
 * - Event queue management (3 tests)
 * - Input sanitization and security (3 tests)
 * - Performance optimization (3 tests)
 * - Error handling and recovery (3 tests)
 */
