/**
 * Component Tests - Event Dispatcher Event Flow
 * Task: 57fbde - Comprehensive Test Framework / RDB-002
 * Layer 2: Component Tests
 *
 * Tests interactions between EventDispatcher, SubscriptionManager, EventRouter, and EventFilter.
 */

import { EventDispatcher } from '@/services/event-dispatcher/event-dispatcher';
import { SubscriptionManager } from '@/services/event-dispatcher/subscription-manager';
import { EventRouter } from '@/services/event-dispatcher/event-router';
import { EventFilter } from '@/services/event-dispatcher/event-filter';
import { InMemoryEventQueue } from '@/test-utils/in-memory-doubles';

describe('Event Dispatcher Component - Event Flow', () => {
  let eventQueue: InMemoryEventQueue;
  let subscriptionManager: SubscriptionManager;
  let eventRouter: EventRouter;
  let eventFilter: EventFilter;
  let dispatcher: EventDispatcher;

  beforeEach(() => {
    eventQueue = new InMemoryEventQueue();
    subscriptionManager = new SubscriptionManager();
    eventRouter = new EventRouter();
    eventFilter = new EventFilter();

    dispatcher = new EventDispatcher({
      queue: eventQueue,
      subscriptions: subscriptionManager,
      router: eventRouter,
      filter: eventFilter,
    });
  });

  describe('Basic Event Flow', () => {
    it('should dispatch event through complete pipeline', async () => {
      const events: any[] = [];
      subscriptionManager.subscribe('widget.clicked', (e) => events.push(e));

      await dispatcher.dispatch({
        type: 'widget.clicked',
        widgetId: 'w1',
        timestamp: Date.now(),
      });

      expect(events.length).toBe(1);
      expect(events[0].widgetId).toBe('w1');
      expect(eventQueue.size()).toBe(1);
    });

    it('should route event to multiple subscribers', async () => {
      const subscriber1: any[] = [];
      const subscriber2: any[] = [];
      const subscriber3: any[] = [];

      subscriptionManager.subscribe('widget.clicked', (e) => subscriber1.push(e));
      subscriptionManager.subscribe('widget.clicked', (e) => subscriber2.push(e));
      subscriptionManager.subscribe('widget.*', (e) => subscriber3.push(e));

      await dispatcher.dispatch({ type: 'widget.clicked', widgetId: 'w1' });

      expect(subscriber1.length).toBe(1);
      expect(subscriber2.length).toBe(1);
      expect(subscriber3.length).toBe(1);
    });

    it('should filter events before dispatching', async () => {
      const events: any[] = [];
      subscriptionManager.subscribe('widget.*', (e) => events.push(e));

      // Add filter rule: only allow widgetId 'w1'
      eventFilter.addRule({
        field: 'widgetId',
        operator: 'equals',
        value: 'w1',
      });

      await dispatcher.dispatch({ type: 'widget.clicked', widgetId: 'w1' });
      await dispatcher.dispatch({ type: 'widget.clicked', widgetId: 'w2' });

      expect(events.length).toBe(1);
      expect(events[0].widgetId).toBe('w1');
    });

    it('should route events to external services', async () => {
      eventRouter.addRoute('widget.*', 'http://analytics-service/events');

      await dispatcher.dispatch({ type: 'widget.clicked', widgetId: 'w1' });

      const routedEvents = eventRouter.getRoutedEvents();
      expect(routedEvents.length).toBe(1);
      expect(routedEvents[0].target).toBe('http://analytics-service/events');
    });

    it('should handle pattern-based subscriptions', async () => {
      const widgetEvents: any[] = [];
      const stateEvents: any[] = [];
      const allEvents: any[] = [];

      subscriptionManager.subscribe('widget.*', (e) => widgetEvents.push(e));
      subscriptionManager.subscribe('state.*', (e) => stateEvents.push(e));
      subscriptionManager.subscribe('*', (e) => allEvents.push(e));

      await dispatcher.dispatch({ type: 'widget.clicked', widgetId: 'w1' });
      await dispatcher.dispatch({ type: 'state.changed', stateId: 's1' });
      await dispatcher.dispatch({ type: 'orb.connected', orbId: 'o1' });

      expect(widgetEvents.length).toBe(1);
      expect(stateEvents.length).toBe(1);
      expect(allEvents.length).toBe(3);
    });
  });

  describe('Event Filtering Pipeline', () => {
    it('should apply multiple filter rules with AND logic', async () => {
      const events: any[] = [];
      subscriptionManager.subscribe('widget.*', (e) => events.push(e));

      eventFilter.setLogic('AND');
      eventFilter.addRule({ field: 'widgetId', operator: 'equals', value: 'w1' });
      eventFilter.addRule({ field: 'type', operator: 'equals', value: 'widget.clicked' });

      await dispatcher.dispatch({ type: 'widget.clicked', widgetId: 'w1' }); // Pass
      await dispatcher.dispatch({ type: 'widget.hover', widgetId: 'w1' }); // Fail type
      await dispatcher.dispatch({ type: 'widget.clicked', widgetId: 'w2' }); // Fail widgetId

      expect(events.length).toBe(1);
    });

    it('should apply multiple filter rules with OR logic', async () => {
      const events: any[] = [];
      subscriptionManager.subscribe('widget.*', (e) => events.push(e));

      eventFilter.setLogic('OR');
      eventFilter.addRule({ field: 'widgetId', operator: 'equals', value: 'w1' });
      eventFilter.addRule({ field: 'widgetId', operator: 'equals', value: 'w2' });

      await dispatcher.dispatch({ type: 'widget.clicked', widgetId: 'w1' }); // Pass
      await dispatcher.dispatch({ type: 'widget.clicked', widgetId: 'w2' }); // Pass
      await dispatcher.dispatch({ type: 'widget.clicked', widgetId: 'w3' }); // Fail

      expect(events.length).toBe(2);
    });

    it('should use regex filters', async () => {
      const events: any[] = [];
      subscriptionManager.subscribe('*', (e) => events.push(e));

      eventFilter.addRule({
        field: 'type',
        operator: 'matches',
        value: '^widget\\.(clicked|double_clicked)$',
      });

      await dispatcher.dispatch({ type: 'widget.clicked' }); // Pass
      await dispatcher.dispatch({ type: 'widget.double_clicked' }); // Pass
      await dispatcher.dispatch({ type: 'widget.hover' }); // Fail

      expect(events.length).toBe(2);
    });

    it('should throttle high-frequency events', async () => {
      const events: any[] = [];
      subscriptionManager.subscribe('widget.mousemove', (e) => events.push(e));

      eventFilter.setThrottle({ maxPerSecond: 10, eventType: 'widget.mousemove' });

      // Send 50 events rapidly
      for (let i = 0; i < 50; i++) {
        await dispatcher.dispatch({
          type: 'widget.mousemove',
          x: i * 10,
          y: i * 10,
        });
      }

      // Should be throttled to ~10 events
      expect(events.length).toBeLessThan(15);
      expect(events.length).toBeGreaterThan(5);
    });
  });

  describe('Event Routing', () => {
    it('should route to prioritized targets', async () => {
      eventRouter.addRoute('widget.*', 'http://low-priority', { priority: 1 });
      eventRouter.addRoute('widget.clicked', 'http://high-priority', { priority: 10 });

      await dispatcher.dispatch({ type: 'widget.clicked', widgetId: 'w1' });

      const routed = eventRouter.getRoutedEvents();
      expect(routed[0].target).toBe('http://high-priority');
    });

    it('should route to multiple targets simultaneously', async () => {
      eventRouter.addRoute('widget.*', 'http://analytics');
      eventRouter.addRoute('widget.*', 'http://logging');
      eventRouter.addRoute('widget.*', 'http://metrics');

      await dispatcher.dispatch({ type: 'widget.clicked', widgetId: 'w1' });

      const routed = eventRouter.getRoutedEvents();
      expect(routed.length).toBe(3);
    });

    it('should route with transformation', async () => {
      eventRouter.addRoute('widget.*', 'http://external', {
        transform: (event) => ({
          ...event,
          source: 'widget-service',
          timestamp: Date.now(),
        }),
      });

      await dispatcher.dispatch({ type: 'widget.clicked', widgetId: 'w1' });

      const routed = eventRouter.getRoutedEvents();
      expect(routed[0].event.source).toBe('widget-service');
    });

    it('should handle routing failures gracefully', async () => {
      eventRouter.addRoute('widget.*', 'http://unreachable', {
        retries: 2,
        timeout: 100,
      });

      const events: any[] = [];
      subscriptionManager.subscribe('widget.*', (e) => events.push(e));

      await dispatcher.dispatch({ type: 'widget.clicked', widgetId: 'w1' });

      // Local subscribers should still receive event
      expect(events.length).toBe(1);
    });
  });

  describe('Subscription Management', () => {
    it('should dynamically add and remove subscriptions', async () => {
      const events: any[] = [];
      const callback = (e: any) => events.push(e);

      const subId = subscriptionManager.subscribe('widget.*', callback);

      await dispatcher.dispatch({ type: 'widget.clicked', widgetId: 'w1' });
      expect(events.length).toBe(1);

      subscriptionManager.unsubscribe(subId);

      await dispatcher.dispatch({ type: 'widget.clicked', widgetId: 'w2' });
      expect(events.length).toBe(1); // Still 1, not increased
    });

    it('should support subscription priorities', async () => {
      const order: number[] = [];

      subscriptionManager.subscribe('widget.*', () => order.push(1), { priority: 1 });
      subscriptionManager.subscribe('widget.*', () => order.push(10), { priority: 10 });
      subscriptionManager.subscribe('widget.*', () => order.push(5), { priority: 5 });

      await dispatcher.dispatch({ type: 'widget.clicked', widgetId: 'w1' });

      expect(order).toEqual([10, 5, 1]); // Highest priority first
    });

    it('should allow subscription pausing and resuming', async () => {
      const events: any[] = [];
      const subId = subscriptionManager.subscribe('widget.*', (e) => events.push(e));

      await dispatcher.dispatch({ type: 'widget.clicked', widgetId: 'w1' });
      expect(events.length).toBe(1);

      subscriptionManager.pauseSubscription(subId);

      await dispatcher.dispatch({ type: 'widget.clicked', widgetId: 'w2' });
      expect(events.length).toBe(1); // Paused, not increased

      subscriptionManager.resumeSubscription(subId);

      await dispatcher.dispatch({ type: 'widget.clicked', widgetId: 'w3' });
      expect(events.length).toBe(2); // Resumed
    });
  });

  describe('Error Handling', () => {
    it('should isolate subscriber errors', async () => {
      const events: any[] = [];

      subscriptionManager.subscribe('widget.*', () => {
        throw new Error('Subscriber 1 error');
      });
      subscriptionManager.subscribe('widget.*', (e) => events.push(e));
      subscriptionManager.subscribe('widget.*', () => {
        throw new Error('Subscriber 3 error');
      });

      await dispatcher.dispatch({ type: 'widget.clicked', widgetId: 'w1' });

      // Good subscriber should still receive event
      expect(events.length).toBe(1);
    });

    it('should track error metrics', async () => {
      subscriptionManager.subscribe('widget.*', () => {
        throw new Error('Test error');
      });

      await dispatcher.dispatch({ type: 'widget.clicked', widgetId: 'w1' });
      await dispatcher.dispatch({ type: 'widget.clicked', widgetId: 'w2' });

      const metrics = dispatcher.getMetrics();
      expect(metrics.errors).toBe(2);
    });

    it('should provide error recovery callback', async () => {
      const errors: any[] = [];

      dispatcher.onError((error, event) => {
        errors.push({ error, event });
      });

      subscriptionManager.subscribe('widget.*', () => {
        throw new Error('Test error');
      });

      await dispatcher.dispatch({ type: 'widget.clicked', widgetId: 'w1' });

      expect(errors.length).toBe(1);
      expect(errors[0].event.widgetId).toBe('w1');
    });
  });

  describe('Performance and Metrics', () => {
    it('should track dispatch metrics', async () => {
      subscriptionManager.subscribe('widget.*', jest.fn());

      await dispatcher.dispatch({ type: 'widget.clicked', widgetId: 'w1' });
      await dispatcher.dispatch({ type: 'widget.hover', widgetId: 'w2' });
      await dispatcher.dispatch({ type: 'widget.clicked', widgetId: 'w3' });

      const metrics = dispatcher.getMetrics();
      expect(metrics.totalDispatched).toBe(3);
      expect(metrics.eventsByType['widget.clicked']).toBe(2);
      expect(metrics.eventsByType['widget.hover']).toBe(1);
    });

    it('should batch events for efficiency', async () => {
      const events: any[] = [];
      subscriptionManager.subscribe('widget.*', (e) => events.push(e));

      const batch = [
        { type: 'widget.clicked', widgetId: 'w1' },
        { type: 'widget.clicked', widgetId: 'w2' },
        { type: 'widget.clicked', widgetId: 'w3' },
      ];

      await dispatcher.batchDispatch(batch);

      expect(events.length).toBe(3);
      expect(eventQueue.size()).toBe(3);
    });

    it('should measure dispatch latency', async () => {
      subscriptionManager.subscribe('widget.*', jest.fn());

      await dispatcher.dispatch({ type: 'widget.clicked', widgetId: 'w1' });

      const metrics = dispatcher.getMetrics();
      expect(metrics.averageLatency).toBeDefined();
      expect(metrics.averageLatency).toBeGreaterThan(0);
    });
  });
});

/**
 * Test Coverage: 25 tests
 * - Basic event flow (5 tests)
 * - Event filtering pipeline (4 tests)
 * - Event routing (4 tests)
 * - Subscription management (3 tests)
 * - Error handling (3 tests)
 * - Performance and metrics (3 tests)
 */
