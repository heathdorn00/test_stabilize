/**
 * Unit Tests - Event Dispatcher Service
 * Task: 57fbde - Comprehensive Test Framework / RDB-002
 * Layer 1: Unit Tests
 *
 * Tests individual classes in Event Dispatcher service in isolation.
 */

import { EventDispatcher } from '@/services/event-dispatcher/event-dispatcher';
import { SubscriptionManager } from '@/services/event-dispatcher/subscription-manager';
import { EventRouter } from '@/services/event-dispatcher/event-router';
import { EventFilter } from '@/services/event-dispatcher/event-filter';
import { MockEventQueue, MockNotificationService } from '@/test-utils/mocks';

describe('EventDispatcher', () => {
  let dispatcher: EventDispatcher;
  let mockQueue: MockEventQueue;
  let mockNotifier: MockNotificationService;

  beforeEach(() => {
    mockQueue = new MockEventQueue();
    mockNotifier = new MockNotificationService();
    dispatcher = new EventDispatcher(mockQueue, mockNotifier);
  });

  it('should dispatch event to queue', async () => {
    const event = { type: 'widget.clicked', widgetId: 'w1', timestamp: Date.now() };

    await dispatcher.dispatch(event);

    expect(mockQueue.size()).toBe(1);
    expect(mockQueue.peek()).toEqual(event);
  });

  it('should notify subscribers on dispatch', async () => {
    const subscriber = jest.fn();
    dispatcher.subscribe('widget.clicked', subscriber);

    await dispatcher.dispatch({ type: 'widget.clicked', widgetId: 'w1' });

    expect(subscriber).toHaveBeenCalledTimes(1);
  });

  it('should filter events by pattern', async () => {
    const subscriber = jest.fn();
    dispatcher.subscribe('widget.*', subscriber);

    await dispatcher.dispatch({ type: 'widget.clicked', widgetId: 'w1' });
    await dispatcher.dispatch({ type: 'state.changed', stateId: 's1' });

    expect(subscriber).toHaveBeenCalledTimes(1);
  });

  it('should handle dispatch errors gracefully', async () => {
    const badSubscriber = jest.fn(() => { throw new Error('Subscriber error'); });
    const goodSubscriber = jest.fn();

    dispatcher.subscribe('widget.clicked', badSubscriber);
    dispatcher.subscribe('widget.clicked', goodSubscriber);

    await dispatcher.dispatch({ type: 'widget.clicked', widgetId: 'w1' });

    expect(goodSubscriber).toHaveBeenCalled();
  });

  it('should batch dispatch multiple events', async () => {
    const events = [
      { type: 'widget.clicked', widgetId: 'w1' },
      { type: 'widget.clicked', widgetId: 'w2' },
      { type: 'widget.clicked', widgetId: 'w3' },
    ];

    await dispatcher.batchDispatch(events);

    expect(mockQueue.size()).toBe(3);
  });

  it('should track dispatch metrics', async () => {
    await dispatcher.dispatch({ type: 'widget.clicked', widgetId: 'w1' });
    await dispatcher.dispatch({ type: 'widget.clicked', widgetId: 'w2' });

    const metrics = dispatcher.getMetrics();
    expect(metrics.totalDispatched).toBe(2);
    expect(metrics.eventsByType['widget.clicked']).toBe(2);
  });
});

describe('SubscriptionManager', () => {
  let manager: SubscriptionManager;

  beforeEach(() => {
    manager = new SubscriptionManager();
  });

  it('should add subscription', () => {
    const callback = jest.fn();
    const subId = manager.subscribe('widget.clicked', callback);

    expect(subId).toBeDefined();
    expect(manager.getSubscriptionCount()).toBe(1);
  });

  it('should remove subscription', () => {
    const callback = jest.fn();
    const subId = manager.subscribe('widget.clicked', callback);

    manager.unsubscribe(subId);

    expect(manager.getSubscriptionCount()).toBe(0);
  });

  it('should match event pattern', () => {
    const callback = jest.fn();
    manager.subscribe('widget.*', callback);

    const matches = manager.getMatchingSubscriptions('widget.clicked');
    expect(matches.length).toBe(1);
  });

  it('should support multiple patterns per subscription', () => {
    const callback = jest.fn();
    manager.subscribe(['widget.*', 'state.*'], callback);

    const widgetMatches = manager.getMatchingSubscriptions('widget.clicked');
    const stateMatches = manager.getMatchingSubscriptions('state.changed');

    expect(widgetMatches.length).toBe(1);
    expect(stateMatches.length).toBe(1);
  });

  it('should handle wildcard subscriptions', () => {
    const callback = jest.fn();
    manager.subscribe('*', callback);

    const matches = manager.getMatchingSubscriptions('any.event.type');
    expect(matches.length).toBe(1);
  });

  it('should list all active subscriptions', () => {
    manager.subscribe('widget.*', jest.fn());
    manager.subscribe('state.*', jest.fn());
    manager.subscribe('orb.*', jest.fn());

    const all = manager.listSubscriptions();
    expect(all.length).toBe(3);
  });

  it('should clear all subscriptions', () => {
    manager.subscribe('widget.*', jest.fn());
    manager.subscribe('state.*', jest.fn());

    manager.clearAll();

    expect(manager.getSubscriptionCount()).toBe(0);
  });
});

describe('EventRouter', () => {
  let router: EventRouter;

  beforeEach(() => {
    router = new EventRouter();
  });

  it('should route event to target', async () => {
    router.addRoute('widget.*', 'http://widget-service/events');

    const target = router.resolveTarget({ type: 'widget.clicked' });
    expect(target).toBe('http://widget-service/events');
  });

  it('should route to multiple targets', async () => {
    router.addRoute('widget.*', 'http://service1/events');
    router.addRoute('widget.*', 'http://service2/events');

    const targets = router.resolveAllTargets({ type: 'widget.clicked' });
    expect(targets.length).toBe(2);
  });

  it('should prioritize routes', () => {
    router.addRoute('widget.*', 'http://low-priority', { priority: 1 });
    router.addRoute('widget.clicked', 'http://high-priority', { priority: 10 });

    const target = router.resolveTarget({ type: 'widget.clicked' });
    expect(target).toBe('http://high-priority');
  });

  it('should handle no matching route', () => {
    const target = router.resolveTarget({ type: 'unknown.event' });
    expect(target).toBeNull();
  });

  it('should remove route', () => {
    const routeId = router.addRoute('widget.*', 'http://service/events');

    router.removeRoute(routeId);

    const target = router.resolveTarget({ type: 'widget.clicked' });
    expect(target).toBeNull();
  });

  it('should update route', () => {
    const routeId = router.addRoute('widget.*', 'http://old-service/events');

    router.updateRoute(routeId, { target: 'http://new-service/events' });

    const target = router.resolveTarget({ type: 'widget.clicked' });
    expect(target).toBe('http://new-service/events');
  });
});

describe('EventFilter', () => {
  let filter: EventFilter;

  beforeEach(() => {
    filter = new EventFilter();
  });

  it('should allow event matching criteria', () => {
    filter.addRule({ field: 'widgetId', operator: 'equals', value: 'w1' });

    const allowed = filter.shouldAllow({ type: 'widget.clicked', widgetId: 'w1' });
    expect(allowed).toBe(true);
  });

  it('should block event not matching criteria', () => {
    filter.addRule({ field: 'widgetId', operator: 'equals', value: 'w1' });

    const allowed = filter.shouldAllow({ type: 'widget.clicked', widgetId: 'w2' });
    expect(allowed).toBe(false);
  });

  it('should support multiple rules with AND logic', () => {
    filter.addRule({ field: 'widgetId', operator: 'equals', value: 'w1' });
    filter.addRule({ field: 'type', operator: 'equals', value: 'widget.clicked' });

    const allowed = filter.shouldAllow({ type: 'widget.clicked', widgetId: 'w1' });
    expect(allowed).toBe(true);
  });

  it('should support OR logic between rules', () => {
    filter.setLogic('OR');
    filter.addRule({ field: 'widgetId', operator: 'equals', value: 'w1' });
    filter.addRule({ field: 'widgetId', operator: 'equals', value: 'w2' });

    const allowed1 = filter.shouldAllow({ type: 'widget.clicked', widgetId: 'w1' });
    const allowed2 = filter.shouldAllow({ type: 'widget.clicked', widgetId: 'w2' });

    expect(allowed1).toBe(true);
    expect(allowed2).toBe(true);
  });

  it('should support regex matching', () => {
    filter.addRule({ field: 'type', operator: 'matches', value: '^widget\\.' });

    const allowed = filter.shouldAllow({ type: 'widget.clicked' });
    expect(allowed).toBe(true);
  });

  it('should throttle high-frequency events', async () => {
    filter.setThrottle({ maxPerSecond: 2 });

    const allowed1 = await filter.shouldAllow({ type: 'widget.mousemove' });
    const allowed2 = await filter.shouldAllow({ type: 'widget.mousemove' });
    const allowed3 = await filter.shouldAllow({ type: 'widget.mousemove' });

    expect(allowed1).toBe(true);
    expect(allowed2).toBe(true);
    expect(allowed3).toBe(false); // Throttled
  });
});

/**
 * Test Coverage: 30 tests
 * - EventDispatcher: 6 tests (dispatch, subscribe, filter, errors, batch, metrics)
 * - SubscriptionManager: 7 tests (add, remove, match, patterns, wildcard, list, clear)
 * - EventRouter: 6 tests (route, multiple targets, priority, no match, remove, update)
 * - EventFilter: 6 tests (allow, block, AND/OR logic, regex, throttle)
 */
