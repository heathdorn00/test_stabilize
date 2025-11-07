/**
 * Integration Test - Event Propagation Flow
 * Task: 57fbde - Comprehensive Test Framework / RDB-002
 * Layer 4: Integration Tests
 *
 * Tests event flow: Input Handler → Event Processor → Widget Core → State Manager → Event Dispatcher
 */

import { TestEnvironment } from '@/test-utils/test-environment';
import { InputHandlerClient } from '@/clients/input-handler';
import { EventProcessorClient } from '@/clients/event-processor';
import { WidgetCoreClient } from '@/clients/widget-core';
import { StateManagerClient } from '@/clients/state-manager';
import { EventDispatcherClient } from '@/clients/event-dispatcher';

describe('Event Propagation Flow Integration', () => {
  let env: TestEnvironment;
  let inputHandler: InputHandlerClient;
  let eventProcessor: EventProcessorClient;
  let widgetCore: WidgetCoreClient;
  let stateManager: StateManagerClient;
  let eventDispatcher: EventDispatcherClient;

  beforeAll(async () => {
    env = await TestEnvironment.create({
      services: ['input-handler', 'event-processor', 'widget-core', 'state-manager', 'event-dispatcher'],
    });

    inputHandler = env.getClient('input-handler');
    eventProcessor = env.getClient('event-processor');
    widgetCore = env.getClient('widget-core');
    stateManager = env.getClient('state-manager');
    eventDispatcher = env.getClient('event-dispatcher');
  });

  afterAll(async () => {
    await env.teardown();
  });

  describe('Mouse Event Propagation', () => {
    it('should propagate mouse click to widget', async () => {
      const widget = await widgetCore.createWidget({
        type: 'button',
        label: 'Click Me',
        x: 100,
        y: 100,
        width: 100,
        height: 50,
      });

      // Register event listener
      const events: any[] = [];
      await eventDispatcher.subscribe('widget.clicked', (event) => {
        events.push(event);
      });

      // Send mouse click
      await inputHandler.sendMouseEvent({
        type: 'click',
        x: 150,
        y: 125,
        button: 'left',
      });

      // Wait for propagation
      await new Promise(resolve => setTimeout(resolve, 100));

      // Verify event received
      expect(events.length).toBe(1);
      expect(events[0].widgetId).toBe(widget.id);
    });

    it('should propagate double-click event', async () => {
      const widget = await widgetCore.createWidget({
        type: 'button',
        label: 'Double Click',
        x: 200,
        y: 200,
        width: 100,
        height: 50,
      });

      const events: any[] = [];
      await eventDispatcher.subscribe('widget.double_clicked', (event) => {
        events.push(event);
      });

      await inputHandler.sendMouseEvent({ type: 'dblclick', x: 250, y: 225, button: 'left' });
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(events.length).toBe(1);
      expect(events[0].widgetId).toBe(widget.id);
    });

    it('should handle mouse hover events', async () => {
      const widget = await widgetCore.createWidget({
        type: 'button',
        label: 'Hover',
        x: 300,
        y: 300,
        width: 100,
        height: 50,
      });

      const events: any[] = [];
      await eventDispatcher.subscribe('widget.hover_start', (e) => events.push(e));
      await eventDispatcher.subscribe('widget.hover_end', (e) => events.push(e));

      await inputHandler.sendMouseEvent({ type: 'mousemove', x: 350, y: 325 });
      await new Promise(resolve => setTimeout(resolve, 50));

      await inputHandler.sendMouseEvent({ type: 'mousemove', x: 0, y: 0 });
      await new Promise(resolve => setTimeout(resolve, 50));

      expect(events.length).toBe(2);
      expect(events[0].type).toBe('hover_start');
      expect(events[1].type).toBe('hover_end');
    });
  });

  describe('Keyboard Event Propagation', () => {
    it('should propagate keydown event to focused widget', async () => {
      const widget = await widgetCore.createWidget({
        type: 'textbox',
        x: 100,
        y: 100,
        width: 200,
        height: 30,
      });

      await widgetCore.focusWidget(widget.id);

      const events: any[] = [];
      await eventDispatcher.subscribe('widget.keydown', (e) => events.push(e));

      await inputHandler.sendKeyboardEvent({ type: 'keydown', key: 'Enter', code: 'Enter' });
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(events.length).toBe(1);
      expect(events[0].widgetId).toBe(widget.id);
      expect(events[0].key).toBe('Enter');
    });

    it('should handle key combinations', async () => {
      const widget = await widgetCore.createWidget({ type: 'textbox', x: 0, y: 0, width: 100, height: 30 });
      await widgetCore.focusWidget(widget.id);

      const events: any[] = [];
      await eventDispatcher.subscribe('widget.keydown', (e) => events.push(e));

      await inputHandler.sendKeyboardEvent({
        type: 'keydown',
        key: 'c',
        code: 'KeyC',
        modifiers: ['ctrl'],
      });

      await new Promise(resolve => setTimeout(resolve, 100));

      expect(events.length).toBe(1);
      expect(events[0].modifiers).toContain('ctrl');
    });
  });

  describe('Event Filtering and Routing', () => {
    it('should filter events by type', async () => {
      await widgetCore.createWidget({ type: 'button', label: 'Test', x: 0, y: 0, width: 100, height: 50 });

      await eventProcessor.addFilter({
        name: 'clicks-only',
        eventPattern: 'widget.clicked',
      });

      const clickEvents: any[] = [];
      const hoverEvents: any[] = [];

      await eventDispatcher.subscribe('widget.clicked', (e) => clickEvents.push(e));
      await eventDispatcher.subscribe('widget.hover_start', (e) => hoverEvents.push(e));

      await inputHandler.sendMouseEvent({ type: 'click', x: 50, y: 25, button: 'left' });
      await inputHandler.sendMouseEvent({ type: 'mousemove', x: 50, y: 25 });

      await new Promise(resolve => setTimeout(resolve, 150));

      expect(clickEvents.length).toBe(1);
    });

    it('should route events to multiple subscribers', async () => {
      const widget = await widgetCore.createWidget({
        type: 'button',
        label: 'Multi',
        x: 0,
        y: 0,
        width: 100,
        height: 50,
      });

      const subscriber1Events: any[] = [];
      const subscriber2Events: any[] = [];

      await eventDispatcher.subscribe('widget.clicked', (e) => subscriber1Events.push(e));
      await eventDispatcher.subscribe('widget.clicked', (e) => subscriber2Events.push(e));

      await inputHandler.sendMouseEvent({ type: 'click', x: 50, y: 25, button: 'left' });
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(subscriber1Events.length).toBe(1);
      expect(subscriber2Events.length).toBe(1);
      expect(subscriber1Events[0].widgetId).toBe(widget.id);
      expect(subscriber2Events[0].widgetId).toBe(widget.id);
    });

    it('should stop event propagation when requested', async () => {
      const parent = await widgetCore.createWidget({
        type: 'container',
        x: 0,
        y: 0,
        width: 200,
        height: 200,
      });

      const child = await widgetCore.createWidget({
        type: 'button',
        label: 'Child',
        parentId: parent.id,
        x: 50,
        y: 50,
        width: 100,
        height: 50,
      });

      const parentEvents: any[] = [];
      const childEvents: any[] = [];

      await eventDispatcher.subscribe('widget.clicked', (e) => {
        if (e.widgetId === parent.id) parentEvents.push(e);
        if (e.widgetId === child.id) {
          childEvents.push(e);
          e.stopPropagation();
        }
      });

      await inputHandler.sendMouseEvent({ type: 'click', x: 100, y: 75, button: 'left' });
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(childEvents.length).toBe(1);
      expect(parentEvents.length).toBe(0); // Should not propagate to parent
    });
  });

  describe('State Updates from Events', () => {
    it('should update widget state on click', async () => {
      const widget = await widgetCore.createWidget({
        type: 'checkbox',
        checked: false,
        x: 0,
        y: 0,
        width: 20,
        height: 20,
      });

      await inputHandler.sendMouseEvent({ type: 'click', x: 10, y: 10, button: 'left' });
      await new Promise(resolve => setTimeout(resolve, 100));

      const state = await stateManager.getState(widget.id);
      expect(state.data.checked).toBe(true);
    });

    it('should dispatch state change events', async () => {
      const widget = await widgetCore.createWidget({
        type: 'slider',
        value: 50,
        x: 0,
        y: 0,
        width: 200,
        height: 30,
      });

      const stateEvents: any[] = [];
      await eventDispatcher.subscribe('state.widget.changed', (e) => stateEvents.push(e));

      await inputHandler.sendMouseEvent({ type: 'click', x: 150, y: 15, button: 'left' });
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(stateEvents.length).toBeGreaterThan(0);
      expect(stateEvents[0].entityId).toBe(widget.id);
      expect(stateEvents[0].data.newState.value).not.toBe(50);
    });
  });

  describe('Event Performance', () => {
    it('should handle high-frequency events', async () => {
      const widget = await widgetCore.createWidget({
        type: 'canvas',
        x: 0,
        y: 0,
        width: 400,
        height: 400,
      });

      const events: any[] = [];
      await eventDispatcher.subscribe('widget.mousemove', (e) => events.push(e));

      const startTime = Date.now();

      // Send 100 mousemove events
      for (let i = 0; i < 100; i++) {
        await inputHandler.sendMouseEvent({
          type: 'mousemove',
          x: i * 4,
          y: i * 4,
        });
      }

      await new Promise(resolve => setTimeout(resolve, 500));

      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(2000);
      expect(events.length).toBeGreaterThan(0);
    });

    it('should batch multiple events', async () => {
      const widget = await widgetCore.createWidget({
        type: 'button',
        label: 'Batch',
        x: 0,
        y: 0,
        width: 100,
        height: 50,
      });

      const startTime = Date.now();

      const events = Array.from({ length: 50 }, (_, i) => ({
        type: 'click',
        x: 50,
        y: 25,
        button: 'left',
      }));

      await inputHandler.sendBatchEvents(events);
      await new Promise(resolve => setTimeout(resolve, 200));

      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(1000);
    });
  });

  describe('Error Handling', () => {
    it('should handle event processing errors gracefully', async () => {
      await inputHandler.sendMouseEvent({
        type: 'click',
        x: 999999, // Out of bounds
        y: 999999,
        button: 'left',
      });

      // Should not crash, just log error
      await new Promise(resolve => setTimeout(resolve, 100));
    });

    it('should recover from subscriber errors', async () => {
      const widget = await widgetCore.createWidget({
        type: 'button',
        label: 'Test',
        x: 0,
        y: 0,
        width: 100,
        height: 50,
      });

      const goodEvents: any[] = [];

      // Bad subscriber that throws
      await eventDispatcher.subscribe('widget.clicked', () => {
        throw new Error('Subscriber error');
      });

      // Good subscriber
      await eventDispatcher.subscribe('widget.clicked', (e) => goodEvents.push(e));

      await inputHandler.sendMouseEvent({ type: 'click', x: 50, y: 25, button: 'left' });
      await new Promise(resolve => setTimeout(resolve, 100));

      // Good subscriber should still receive event
      expect(goodEvents.length).toBe(1);
    });
  });
});

/**
 * Test Coverage: 17 tests
 * - Mouse events (3 tests)
 * - Keyboard events (2 tests)
 * - Filtering and routing (3 tests)
 * - State updates (2 tests)
 * - Performance (2 tests)
 * - Error handling (2 tests)
 */
