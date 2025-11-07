/**
 * Unit Tests - Input Handler Service (TypeScript)
 * Task: 57fbde - Comprehensive Test Framework / RDB-002
 * Layer 1: Unit Tests
 *
 * Tests individual classes in Input Handler service in isolation.
 */

import { EventParser } from '@/services/input-handler/event-parser';
import { GestureRecognizer } from '@/services/input-handler/gesture-recognizer';
import { InputValidator } from '@/services/input-handler/input-validator';
import { EventQueue } from '@/services/input-handler/event-queue';
import { InputMapper } from '@/services/input-handler/input-mapper';

describe('EventParser', () => {
  let parser: EventParser;

  beforeEach(() => {
    parser = new EventParser();
  });

  it('should parse mouse click event', () => {
    const rawEvent = {
      type: 'mousedown',
      clientX: 150,
      clientY: 200,
      button: 0,
      timestamp: Date.now(),
    };

    const parsed = parser.parseMouseEvent(rawEvent);

    expect(parsed.type).toBe('click');
    expect(parsed.x).toBe(150);
    expect(parsed.y).toBe(200);
    expect(parsed.button).toBe('left');
  });

  it('should parse mouse move event', () => {
    const rawEvent = {
      type: 'mousemove',
      clientX: 100,
      clientY: 150,
      timestamp: Date.now(),
    };

    const parsed = parser.parseMouseEvent(rawEvent);

    expect(parsed.type).toBe('mousemove');
    expect(parsed.x).toBe(100);
    expect(parsed.y).toBe(150);
  });

  it('should detect right mouse button', () => {
    const rawEvent = {
      type: 'mousedown',
      clientX: 50,
      clientY: 50,
      button: 2,
      timestamp: Date.now(),
    };

    const parsed = parser.parseMouseEvent(rawEvent);

    expect(parsed.button).toBe('right');
  });

  it('should detect middle mouse button', () => {
    const rawEvent = {
      type: 'mousedown',
      clientX: 50,
      clientY: 50,
      button: 1,
      timestamp: Date.now(),
    };

    const parsed = parser.parseMouseEvent(rawEvent);

    expect(parsed.button).toBe('middle');
  });

  it('should parse keyboard event', () => {
    const rawEvent = {
      type: 'keydown',
      key: 'Enter',
      code: 'Enter',
      ctrlKey: false,
      shiftKey: false,
      altKey: false,
      metaKey: false,
      timestamp: Date.now(),
    };

    const parsed = parser.parseKeyboardEvent(rawEvent);

    expect(parsed.type).toBe('keydown');
    expect(parsed.key).toBe('Enter');
    expect(parsed.modifiers).toEqual([]);
  });

  it('should detect keyboard modifiers', () => {
    const rawEvent = {
      type: 'keydown',
      key: 'c',
      code: 'KeyC',
      ctrlKey: true,
      shiftKey: true,
      altKey: false,
      metaKey: false,
      timestamp: Date.now(),
    };

    const parsed = parser.parseKeyboardEvent(rawEvent);

    expect(parsed.modifiers).toContain('ctrl');
    expect(parsed.modifiers).toContain('shift');
  });

  it('should parse touch event', () => {
    const rawEvent = {
      type: 'touchstart',
      touches: [
        { clientX: 100, clientY: 200, identifier: 0 },
      ],
      timestamp: Date.now(),
    };

    const parsed = parser.parseTouchEvent(rawEvent);

    expect(parsed.type).toBe('touchstart');
    expect(parsed.touches[0].x).toBe(100);
    expect(parsed.touches[0].y).toBe(200);
  });

  it('should parse multi-touch event', () => {
    const rawEvent = {
      type: 'touchmove',
      touches: [
        { clientX: 100, clientY: 200, identifier: 0 },
        { clientX: 300, clientY: 400, identifier: 1 },
      ],
      timestamp: Date.now(),
    };

    const parsed = parser.parseTouchEvent(rawEvent);

    expect(parsed.touches.length).toBe(2);
  });

  it('should normalize coordinates', () => {
    parser.setCoordinateNormalization({ offsetX: 50, offsetY: 100, scale: 2 });

    const rawEvent = {
      type: 'mousedown',
      clientX: 150,
      clientY: 200,
      button: 0,
      timestamp: Date.now(),
    };

    const parsed = parser.parseMouseEvent(rawEvent);

    expect(parsed.x).toBe(50); // (150 - 50) / 2
    expect(parsed.y).toBe(50); // (200 - 100) / 2
  });

  it('should handle missing timestamp', () => {
    const rawEvent = {
      type: 'mousedown',
      clientX: 100,
      clientY: 100,
      button: 0,
    };

    const parsed = parser.parseMouseEvent(rawEvent);

    expect(parsed.timestamp).toBeDefined();
    expect(parsed.timestamp).toBeGreaterThan(0);
  });
});

describe('GestureRecognizer', () => {
  let recognizer: GestureRecognizer;

  beforeEach(() => {
    recognizer = new GestureRecognizer();
  });

  it('should detect single tap', () => {
    recognizer.onTouchStart({ x: 100, y: 100, id: 0 }, Date.now());
    recognizer.onTouchEnd({ x: 100, y: 100, id: 0 }, Date.now() + 50);

    const gesture = recognizer.getLastGesture();
    expect(gesture.type).toBe('tap');
  });

  it('should detect double tap', () => {
    const now = Date.now();

    recognizer.onTouchStart({ x: 100, y: 100, id: 0 }, now);
    recognizer.onTouchEnd({ x: 100, y: 100, id: 0 }, now + 50);

    recognizer.onTouchStart({ x: 100, y: 100, id: 0 }, now + 150);
    recognizer.onTouchEnd({ x: 100, y: 100, id: 0 }, now + 200);

    const gesture = recognizer.getLastGesture();
    expect(gesture.type).toBe('double-tap');
  });

  it('should detect long press', () => {
    const now = Date.now();

    recognizer.onTouchStart({ x: 100, y: 100, id: 0 }, now);
    recognizer.onTouchEnd({ x: 100, y: 100, id: 0 }, now + 600);

    const gesture = recognizer.getLastGesture();
    expect(gesture.type).toBe('long-press');
  });

  it('should detect swipe left', () => {
    const now = Date.now();

    recognizer.onTouchStart({ x: 200, y: 100, id: 0 }, now);
    recognizer.onTouchMove({ x: 150, y: 100, id: 0 }, now + 50);
    recognizer.onTouchMove({ x: 100, y: 100, id: 0 }, now + 100);
    recognizer.onTouchEnd({ x: 50, y: 100, id: 0 }, now + 150);

    const gesture = recognizer.getLastGesture();
    expect(gesture.type).toBe('swipe');
    expect(gesture.direction).toBe('left');
  });

  it('should detect swipe right', () => {
    const now = Date.now();

    recognizer.onTouchStart({ x: 50, y: 100, id: 0 }, now);
    recognizer.onTouchEnd({ x: 200, y: 100, id: 0 }, now + 150);

    const gesture = recognizer.getLastGesture();
    expect(gesture.direction).toBe('right');
  });

  it('should detect swipe up', () => {
    const now = Date.now();

    recognizer.onTouchStart({ x: 100, y: 200, id: 0 }, now);
    recognizer.onTouchEnd({ x: 100, y: 50, id: 0 }, now + 150);

    const gesture = recognizer.getLastGesture();
    expect(gesture.direction).toBe('up');
  });

  it('should detect swipe down', () => {
    const now = Date.now();

    recognizer.onTouchStart({ x: 100, y: 50, id: 0 }, now);
    recognizer.onTouchEnd({ x: 100, y: 200, id: 0 }, now + 150);

    const gesture = recognizer.getLastGesture();
    expect(gesture.direction).toBe('down');
  });

  it('should detect pinch gesture', () => {
    const now = Date.now();

    recognizer.onTouchStart({ x: 100, y: 100, id: 0 }, now);
    recognizer.onTouchStart({ x: 200, y: 100, id: 1 }, now);

    recognizer.onTouchMove({ x: 125, y: 100, id: 0 }, now + 50);
    recognizer.onTouchMove({ x: 175, y: 100, id: 1 }, now + 50);

    const gesture = recognizer.getLastGesture();
    expect(gesture.type).toBe('pinch');
    expect(gesture.scale).toBeLessThan(1);
  });

  it('should detect zoom gesture', () => {
    const now = Date.now();

    recognizer.onTouchStart({ x: 150, y: 100, id: 0 }, now);
    recognizer.onTouchStart({ x: 160, y: 100, id: 1 }, now);

    recognizer.onTouchMove({ x: 100, y: 100, id: 0 }, now + 50);
    recognizer.onTouchMove({ x: 200, y: 100, id: 1 }, now + 50);

    const gesture = recognizer.getLastGesture();
    expect(gesture.type).toBe('pinch');
    expect(gesture.scale).toBeGreaterThan(1);
  });

  it('should detect rotation gesture', () => {
    const now = Date.now();

    recognizer.onTouchStart({ x: 100, y: 100, id: 0 }, now);
    recognizer.onTouchStart({ x: 200, y: 100, id: 1 }, now);

    recognizer.onTouchMove({ x: 150, y: 50, id: 0 }, now + 50);
    recognizer.onTouchMove({ x: 150, y: 150, id: 1 }, now + 50);

    const gesture = recognizer.getLastGesture();
    expect(gesture.type).toBe('rotate');
    expect(gesture.angle).toBeDefined();
  });

  it('should require minimum distance for swipe', () => {
    const now = Date.now();

    recognizer.onTouchStart({ x: 100, y: 100, id: 0 }, now);
    recognizer.onTouchEnd({ x: 105, y: 100, id: 0 }, now + 50);

    const gesture = recognizer.getLastGesture();
    expect(gesture.type).not.toBe('swipe');
  });

  it('should timeout slow swipes', () => {
    const now = Date.now();

    recognizer.onTouchStart({ x: 100, y: 100, id: 0 }, now);
    recognizer.onTouchEnd({ x: 200, y: 100, id: 0 }, now + 2000);

    const gesture = recognizer.getLastGesture();
    expect(gesture.type).not.toBe('swipe');
  });

  it('should reset state on cancel', () => {
    recognizer.onTouchStart({ x: 100, y: 100, id: 0 }, Date.now());
    recognizer.onTouchCancel({ x: 100, y: 100, id: 0 }, Date.now());

    const gesture = recognizer.getLastGesture();
    expect(gesture).toBeNull();
  });
});

describe('InputValidator', () => {
  let validator: InputValidator;

  beforeEach(() => {
    validator = new InputValidator();
  });

  it('should validate mouse event coordinates', () => {
    const event = { type: 'click', x: 150, y: 200, button: 'left' };

    expect(validator.validateMouseEvent(event)).toBe(true);
  });

  it('should reject negative coordinates', () => {
    const event = { type: 'click', x: -10, y: 200, button: 'left' };

    expect(validator.validateMouseEvent(event)).toBe(false);
  });

  it('should validate coordinates within bounds', () => {
    validator.setBounds({ width: 800, height: 600 });

    const valid = { type: 'click', x: 400, y: 300, button: 'left' };
    const invalid = { type: 'click', x: 900, y: 300, button: 'left' };

    expect(validator.validateMouseEvent(valid)).toBe(true);
    expect(validator.validateMouseEvent(invalid)).toBe(false);
  });

  it('should validate button values', () => {
    const validButtons = ['left', 'right', 'middle'];

    validButtons.forEach(button => {
      const event = { type: 'click', x: 100, y: 100, button };
      expect(validator.validateMouseEvent(event)).toBe(true);
    });

    const invalid = { type: 'click', x: 100, y: 100, button: 'invalid' };
    expect(validator.validateMouseEvent(invalid)).toBe(false);
  });

  it('should validate keyboard event', () => {
    const event = {
      type: 'keydown',
      key: 'Enter',
      code: 'Enter',
      modifiers: ['ctrl'],
    };

    expect(validator.validateKeyboardEvent(event)).toBe(true);
  });

  it('should reject empty key', () => {
    const event = {
      type: 'keydown',
      key: '',
      code: 'Enter',
      modifiers: [],
    };

    expect(validator.validateKeyboardEvent(event)).toBe(false);
  });

  it('should validate modifier keys', () => {
    const validModifiers = ['ctrl', 'shift', 'alt', 'meta'];

    validModifiers.forEach(modifier => {
      const event = {
        type: 'keydown',
        key: 'a',
        code: 'KeyA',
        modifiers: [modifier],
      };
      expect(validator.validateKeyboardEvent(event)).toBe(true);
    });
  });

  it('should reject invalid modifiers', () => {
    const event = {
      type: 'keydown',
      key: 'a',
      code: 'KeyA',
      modifiers: ['invalid'],
    };

    expect(validator.validateKeyboardEvent(event)).toBe(false);
  });

  it('should validate touch event', () => {
    const event = {
      type: 'touchstart',
      touches: [{ x: 100, y: 200, id: 0 }],
    };

    expect(validator.validateTouchEvent(event)).toBe(true);
  });

  it('should require at least one touch', () => {
    const event = {
      type: 'touchstart',
      touches: [],
    };

    expect(validator.validateTouchEvent(event)).toBe(false);
  });

  it('should validate touch IDs are unique', () => {
    const event = {
      type: 'touchmove',
      touches: [
        { x: 100, y: 200, id: 0 },
        { x: 300, y: 400, id: 0 }, // Duplicate ID
      ],
    };

    expect(validator.validateTouchEvent(event)).toBe(false);
  });

  it('should sanitize event data', () => {
    const event = {
      type: 'click',
      x: 150.7,
      y: 200.3,
      button: 'left',
      extraField: 'should be removed',
    };

    const sanitized = validator.sanitize(event);

    expect(sanitized.x).toBe(151); // Rounded
    expect(sanitized.y).toBe(200);
    expect(sanitized.extraField).toBeUndefined();
  });
});

describe('EventQueue', () => {
  let queue: EventQueue;

  beforeEach(() => {
    queue = new EventQueue();
  });

  it('should enqueue event', () => {
    const event = { type: 'click', x: 100, y: 100, button: 'left' };

    queue.enqueue(event);

    expect(queue.size()).toBe(1);
  });

  it('should dequeue event', () => {
    const event = { type: 'click', x: 100, y: 100, button: 'left' };

    queue.enqueue(event);
    const dequeued = queue.dequeue();

    expect(dequeued).toEqual(event);
    expect(queue.size()).toBe(0);
  });

  it('should maintain FIFO order', () => {
    const event1 = { type: 'click', x: 100, y: 100 };
    const event2 = { type: 'click', x: 200, y: 200 };
    const event3 = { type: 'click', x: 300, y: 300 };

    queue.enqueue(event1);
    queue.enqueue(event2);
    queue.enqueue(event3);

    expect(queue.dequeue().x).toBe(100);
    expect(queue.dequeue().x).toBe(200);
    expect(queue.dequeue().x).toBe(300);
  });

  it('should return null when empty', () => {
    expect(queue.dequeue()).toBeNull();
  });

  it('should peek without removing', () => {
    const event = { type: 'click', x: 100, y: 100 };

    queue.enqueue(event);
    const peeked = queue.peek();

    expect(peeked).toEqual(event);
    expect(queue.size()).toBe(1);
  });

  it('should clear queue', () => {
    queue.enqueue({ type: 'click', x: 100, y: 100 });
    queue.enqueue({ type: 'click', x: 200, y: 200 });

    queue.clear();

    expect(queue.size()).toBe(0);
  });

  it('should enforce max size', () => {
    queue.setMaxSize(3);

    queue.enqueue({ type: 'click', x: 100, y: 100 });
    queue.enqueue({ type: 'click', x: 200, y: 200 });
    queue.enqueue({ type: 'click', x: 300, y: 300 });
    queue.enqueue({ type: 'click', x: 400, y: 400 }); // Should drop oldest

    expect(queue.size()).toBe(3);
    expect(queue.peek().x).toBe(200); // First event dropped
  });

  it('should check if empty', () => {
    expect(queue.isEmpty()).toBe(true);

    queue.enqueue({ type: 'click', x: 100, y: 100 });

    expect(queue.isEmpty()).toBe(false);
  });

  it('should get all events without removing', () => {
    queue.enqueue({ type: 'click', x: 100, y: 100 });
    queue.enqueue({ type: 'click', x: 200, y: 200 });

    const all = queue.getAll();

    expect(all.length).toBe(2);
    expect(queue.size()).toBe(2);
  });
});

describe('InputMapper', () => {
  let mapper: InputMapper;

  beforeEach(() => {
    mapper = new InputMapper();
  });

  it('should map key to action', () => {
    mapper.mapKey('Enter', 'submit');

    const action = mapper.getAction('Enter');
    expect(action).toBe('submit');
  });

  it('should map key combination to action', () => {
    mapper.mapKeyCombination(['ctrl', 's'], 'save');

    const action = mapper.getActionForCombination(['ctrl', 's']);
    expect(action).toBe('save');
  });

  it('should map mouse button to action', () => {
    mapper.mapMouseButton('right', 'context-menu');

    const action = mapper.getMouseButtonAction('right');
    expect(action).toBe('context-menu');
  });

  it('should map gesture to action', () => {
    mapper.mapGesture('swipe-left', 'navigate-back');

    const action = mapper.getGestureAction('swipe-left');
    expect(action).toBe('navigate-back');
  });

  it('should override existing mapping', () => {
    mapper.mapKey('Enter', 'submit');
    mapper.mapKey('Enter', 'confirm');

    const action = mapper.getAction('Enter');
    expect(action).toBe('confirm');
  });

  it('should unmap key', () => {
    mapper.mapKey('Enter', 'submit');
    mapper.unmapKey('Enter');

    const action = mapper.getAction('Enter');
    expect(action).toBeUndefined();
  });

  it('should get all mappings', () => {
    mapper.mapKey('Enter', 'submit');
    mapper.mapKey('Escape', 'cancel');

    const mappings = mapper.getAllMappings();
    expect(Object.keys(mappings).length).toBe(2);
  });

  it('should reset all mappings', () => {
    mapper.mapKey('Enter', 'submit');
    mapper.mapKey('Escape', 'cancel');

    mapper.resetAll();

    expect(Object.keys(mapper.getAllMappings()).length).toBe(0);
  });

  it('should load default mappings', () => {
    mapper.loadDefaults();

    expect(mapper.getAction('Enter')).toBeDefined();
    expect(mapper.getAction('Escape')).toBeDefined();
  });

  it('should export and import configuration', () => {
    mapper.mapKey('Enter', 'submit');
    mapper.mapKey('Escape', 'cancel');

    const config = mapper.exportConfig();
    const newMapper = new InputMapper();
    newMapper.importConfig(config);

    expect(newMapper.getAction('Enter')).toBe('submit');
    expect(newMapper.getAction('Escape')).toBe('cancel');
  });
});

/**
 * Test Coverage: 52 tests
 * - EventParser: 10 tests (mouse, keyboard, touch, multi-touch, normalization)
 * - GestureRecognizer: 13 tests (tap, double-tap, long-press, swipe directions, pinch, zoom, rotate)
 * - InputValidator: 12 tests (coordinates, bounds, buttons, keys, modifiers, touches, sanitization)
 * - EventQueue: 9 tests (enqueue, dequeue, FIFO, peek, clear, max size, empty check)
 * - InputMapper: 10 tests (key mapping, combinations, mouse, gestures, override, unmap, export/import)
 */
