/**
 * Unit Tests - ORB Core Service (TypeScript)
 * Task: 57fbde - Comprehensive Test Framework / RDB-002
 * Layer 1: Unit Tests
 *
 * Tests individual classes in ORB Core service in isolation.
 */

import { ConnectionPool } from '@/services/orb-core/connection-pool';
import { RequestHandler } from '@/services/orb-core/request-handler';
import { ObjectReference } from '@/services/orb-core/object-reference';
import { MessageSerializer } from '@/services/orb-core/message-serializer';
import { ResponseCache } from '@/services/orb-core/response-cache';
import { MockConnection } from '@/test-utils/mocks';

describe('ConnectionPool', () => {
  let pool: ConnectionPool;

  beforeEach(() => {
    pool = new ConnectionPool({ maxConnections: 5, minConnections: 2 });
  });

  afterEach(async () => {
    await pool.close();
  });

  it('should initialize with minimum connections', async () => {
    await pool.initialize();

    expect(pool.getActiveConnections()).toBe(2);
    expect(pool.getIdleConnections()).toBe(2);
  });

  it('should acquire connection from pool', async () => {
    await pool.initialize();

    const conn = await pool.acquire();

    expect(conn).toBeDefined();
    expect(pool.getActiveConnections()).toBe(1);
    expect(pool.getIdleConnections()).toBe(1);
  });

  it('should release connection back to pool', async () => {
    await pool.initialize();

    const conn = await pool.acquire();
    await pool.release(conn);

    expect(pool.getIdleConnections()).toBe(2);
  });

  it('should create new connection when pool is exhausted', async () => {
    await pool.initialize();

    const conn1 = await pool.acquire();
    const conn2 = await pool.acquire();
    const conn3 = await pool.acquire(); // Should create new connection

    expect(pool.getTotalConnections()).toBe(3);
  });

  it('should enforce maximum connections limit', async () => {
    await pool.initialize();

    const connections = [];
    for (let i = 0; i < 5; i++) {
      connections.push(await pool.acquire());
    }

    // 6th acquisition should wait
    const timeout = new Promise((resolve) => setTimeout(() => resolve('timeout'), 100));
    const acquire = pool.acquire();

    const result = await Promise.race([acquire, timeout]);
    expect(result).toBe('timeout');

    // Release one and retry
    await pool.release(connections[0]);
    const conn6 = await pool.acquire();
    expect(conn6).toBeDefined();
  });

  it('should remove dead connections', async () => {
    await pool.initialize();

    const conn = await pool.acquire();
    conn.markAsDead();
    await pool.release(conn);

    expect(pool.getTotalConnections()).toBe(1); // Dead connection removed
  });

  it('should health check idle connections', async () => {
    await pool.initialize();
    pool.setHealthCheckInterval(50);

    await new Promise((resolve) => setTimeout(resolve, 150));

    // Health check should have run
    const stats = pool.getStats();
    expect(stats.healthChecks).toBeGreaterThan(0);
  });

  it('should drain pool gracefully', async () => {
    await pool.initialize();

    const conn1 = await pool.acquire();
    const conn2 = await pool.acquire();

    await pool.drain();

    expect(pool.getTotalConnections()).toBe(0);
  });

  it('should track connection statistics', async () => {
    await pool.initialize();

    await pool.acquire();
    await pool.acquire();

    const stats = pool.getStats();
    expect(stats.totalAcquired).toBe(2);
    expect(stats.activeConnections).toBe(2);
  });

  it('should handle connection errors', async () => {
    pool.setConnectionFactory(() => {
      throw new Error('Connection failed');
    });

    await expect(pool.acquire()).rejects.toThrow(/connection failed/i);
  });
});

describe('RequestHandler', () => {
  let handler: RequestHandler;
  let mockConnection: MockConnection;

  beforeEach(() => {
    mockConnection = new MockConnection();
    handler = new RequestHandler(mockConnection);
  });

  it('should send request and receive response', async () => {
    mockConnection.setResponse({ status: 'success', data: { value: 42 } });

    const response = await handler.send({
      method: 'Widget.getValue',
      params: { widgetId: 'w1' },
    });

    expect(response.status).toBe('success');
    expect(response.data.value).toBe(42);
  });

  it('should generate unique request IDs', async () => {
    mockConnection.setResponse({ status: 'success' });

    const req1 = handler.send({ method: 'test1', params: {} });
    const req2 = handler.send({ method: 'test2', params: {} });

    await Promise.all([req1, req2]);

    const sentRequests = mockConnection.getSentRequests();
    expect(sentRequests[0].id).not.toBe(sentRequests[1].id);
  });

  it('should timeout long-running requests', async () => {
    mockConnection.setDelay(5000); // 5 seconds delay

    await expect(
      handler.send({ method: 'slow', params: {} }, { timeout: 100 })
    ).rejects.toThrow(/timeout/i);
  });

  it('should retry failed requests', async () => {
    let attempts = 0;
    mockConnection.setResponseFunction(() => {
      attempts++;
      if (attempts < 3) throw new Error('Temporary failure');
      return { status: 'success' };
    });

    const response = await handler.send(
      { method: 'retry', params: {} },
      { retries: 3 }
    );

    expect(response.status).toBe('success');
    expect(attempts).toBe(3);
  });

  it('should handle concurrent requests', async () => {
    mockConnection.setResponse({ status: 'success' });

    const requests = [];
    for (let i = 0; i < 10; i++) {
      requests.push(handler.send({ method: `test${i}`, params: {} }));
    }

    const responses = await Promise.all(requests);
    expect(responses.length).toBe(10);
  });

  it('should validate request structure', async () => {
    await expect(
      handler.send({ method: '', params: {} } as any)
    ).rejects.toThrow(/invalid request/i);
  });

  it('should handle connection failures', async () => {
    mockConnection.setConnected(false);

    await expect(
      handler.send({ method: 'test', params: {} })
    ).rejects.toThrow(/not connected/i);
  });

  it('should support request cancellation', async () => {
    mockConnection.setDelay(1000);

    const promise = handler.send({ method: 'cancel', params: {} });
    const requestId = handler.getLastRequestId();

    handler.cancel(requestId);

    await expect(promise).rejects.toThrow(/cancelled/i);
  });

  it('should batch multiple requests', async () => {
    mockConnection.setResponse({ status: 'success' });

    const batch = [
      { method: 'test1', params: {} },
      { method: 'test2', params: {} },
      { method: 'test3', params: {} },
    ];

    const responses = await handler.sendBatch(batch);

    expect(responses.length).toBe(3);
    expect(mockConnection.getSentRequests().length).toBe(1); // Single batch request
  });

  it('should track request metrics', async () => {
    mockConnection.setResponse({ status: 'success' });

    await handler.send({ method: 'test1', params: {} });
    await handler.send({ method: 'test2', params: {} });

    const metrics = handler.getMetrics();
    expect(metrics.totalRequests).toBe(2);
    expect(metrics.averageLatency).toBeGreaterThan(0);
  });
});

describe('ObjectReference', () => {
  let objRef: ObjectReference;

  beforeEach(() => {
    objRef = new ObjectReference('widget-123', 'Widget');
  });

  it('should create object reference', () => {
    expect(objRef.getId()).toBe('widget-123');
    expect(objRef.getType()).toBe('Widget');
  });

  it('should invoke method on remote object', async () => {
    const result = await objRef.invoke('setValue', [42]);

    expect(result).toBeDefined();
  });

  it('should get property from remote object', async () => {
    const value = await objRef.getProperty('width');

    expect(value).toBeDefined();
  });

  it('should set property on remote object', async () => {
    await objRef.setProperty('width', 200);

    const value = await objRef.getProperty('width');
    expect(value).toBe(200);
  });

  it('should support method chaining', async () => {
    const result = await objRef
      .invoke('setX', [100])
      .invoke('setY', [200])
      .invoke('getPosition', []);

    expect(result).toBeDefined();
  });

  it('should handle remote exceptions', async () => {
    await expect(
      objRef.invoke('invalidMethod', [])
    ).rejects.toThrow(/method not found/i);
  });

  it('should track reference count', () => {
    objRef.addRef();
    objRef.addRef();

    expect(objRef.getRefCount()).toBe(2);

    objRef.release();
    expect(objRef.getRefCount()).toBe(1);
  });

  it('should dispose when reference count reaches zero', async () => {
    objRef.addRef();
    objRef.release();

    const isDisposed = objRef.isDisposed();
    expect(isDisposed).toBe(true);
  });

  it('should cache method results', async () => {
    objRef.enableCache();

    await objRef.invoke('getValue', []);
    await objRef.invoke('getValue', []); // Should use cache

    const stats = objRef.getCacheStats();
    expect(stats.hits).toBe(1);
  });

  it('should invalidate cache on property changes', async () => {
    objRef.enableCache();

    await objRef.invoke('getValue', []);
    await objRef.setProperty('value', 100);
    await objRef.invoke('getValue', []); // Cache invalidated

    const stats = objRef.getCacheStats();
    expect(stats.hits).toBe(0);
  });

  it('should serialize to reference string', () => {
    const refString = objRef.toReferenceString();

    expect(refString).toContain('widget-123');
    expect(refString).toContain('Widget');
  });

  it('should deserialize from reference string', () => {
    const refString = 'orb://Widget/widget-123';
    const newRef = ObjectReference.fromReferenceString(refString);

    expect(newRef.getId()).toBe('widget-123');
    expect(newRef.getType()).toBe('Widget');
  });
});

describe('MessageSerializer', () => {
  let serializer: MessageSerializer;

  beforeEach(() => {
    serializer = new MessageSerializer();
  });

  it('should serialize request message', () => {
    const request = {
      id: 'req-123',
      method: 'Widget.getValue',
      params: { widgetId: 'w1' },
    };

    const serialized = serializer.serializeRequest(request);

    expect(typeof serialized).toBe('string');
    expect(serialized.length).toBeGreaterThan(0);
  });

  it('should deserialize request message', () => {
    const request = {
      id: 'req-123',
      method: 'Widget.getValue',
      params: { widgetId: 'w1' },
    };

    const serialized = serializer.serializeRequest(request);
    const deserialized = serializer.deserializeRequest(serialized);

    expect(deserialized).toEqual(request);
  });

  it('should serialize response message', () => {
    const response = {
      id: 'req-123',
      status: 'success',
      data: { value: 42 },
    };

    const serialized = serializer.serializeResponse(response);

    expect(typeof serialized).toBe('string');
  });

  it('should handle binary data in messages', () => {
    const request = {
      id: 'req-123',
      method: 'upload',
      params: {
        data: new Uint8Array([1, 2, 3, 4, 5]),
      },
    };

    const serialized = serializer.serializeRequest(request);
    const deserialized = serializer.deserializeRequest(serialized);

    expect(deserialized.params.data).toEqual(request.params.data);
  });

  it('should compress large messages', () => {
    const largeData = {
      array: Array.from({ length: 1000 }, (_, i) => ({
        id: i,
        value: `item-${i}`,
      })),
    };

    const request = {
      id: 'req-123',
      method: 'bulkInsert',
      params: largeData,
    };

    const compressed = serializer.serializeRequest(request, { compress: true });
    const uncompressed = serializer.serializeRequest(request, { compress: false });

    expect(compressed.length).toBeLessThan(uncompressed.length);
  });

  it('should handle circular references', () => {
    const obj: any = { name: 'test' };
    obj.self = obj; // Circular reference

    const request = {
      id: 'req-123',
      method: 'test',
      params: obj,
    };

    expect(() => serializer.serializeRequest(request)).not.toThrow();
  });

  it('should validate message structure on deserialization', () => {
    const invalidMessage = 'not a valid json message';

    expect(() => serializer.deserializeRequest(invalidMessage)).toThrow(/invalid message/i);
  });

  it('should support different encoding formats', () => {
    serializer.setEncoding('json');
    const jsonSerialized = serializer.serializeRequest({
      id: 'req-123',
      method: 'test',
      params: {},
    });

    serializer.setEncoding('msgpack');
    const msgpackSerialized = serializer.serializeRequest({
      id: 'req-123',
      method: 'test',
      params: {},
    });

    expect(msgpackSerialized.length).toBeLessThan(jsonSerialized.length);
  });
});

describe('ResponseCache', () => {
  let cache: ResponseCache;

  beforeEach(() => {
    cache = new ResponseCache({ maxSize: 100, ttl: 5000 });
  });

  it('should cache response', () => {
    const key = 'Widget.getValue:w1';
    const response = { status: 'success', data: { value: 42 } };

    cache.set(key, response);

    const cached = cache.get(key);
    expect(cached).toEqual(response);
  });

  it('should return null for cache miss', () => {
    const result = cache.get('non-existent-key');

    expect(result).toBeNull();
  });

  it('should expire cached entries after TTL', async () => {
    const key = 'test-key';
    const response = { status: 'success', data: {} };

    cache.set(key, response);

    // Wait for TTL to expire
    await new Promise((resolve) => setTimeout(resolve, 5100));

    const cached = cache.get(key);
    expect(cached).toBeNull();
  });

  it('should enforce max cache size', () => {
    cache = new ResponseCache({ maxSize: 3, ttl: 60000 });

    cache.set('key1', { data: 1 });
    cache.set('key2', { data: 2 });
    cache.set('key3', { data: 3 });
    cache.set('key4', { data: 4 }); // Should evict oldest (key1)

    expect(cache.get('key1')).toBeNull();
    expect(cache.get('key4')).not.toBeNull();
  });

  it('should invalidate specific cache entry', () => {
    cache.set('key1', { data: 1 });
    cache.set('key2', { data: 2 });

    cache.invalidate('key1');

    expect(cache.get('key1')).toBeNull();
    expect(cache.get('key2')).not.toBeNull();
  });

  it('should invalidate cache by pattern', () => {
    cache.set('Widget.getValue:w1', { data: 1 });
    cache.set('Widget.getValue:w2', { data: 2 });
    cache.set('State.getValue:s1', { data: 3 });

    cache.invalidatePattern(/^Widget\./);

    expect(cache.get('Widget.getValue:w1')).toBeNull();
    expect(cache.get('Widget.getValue:w2')).toBeNull();
    expect(cache.get('State.getValue:s1')).not.toBeNull();
  });

  it('should clear entire cache', () => {
    cache.set('key1', { data: 1 });
    cache.set('key2', { data: 2 });

    cache.clear();

    expect(cache.size()).toBe(0);
  });

  it('should track cache statistics', () => {
    cache.set('key1', { data: 1 });

    cache.get('key1'); // Hit
    cache.get('key2'); // Miss
    cache.get('key1'); // Hit

    const stats = cache.getStats();
    expect(stats.hits).toBe(2);
    expect(stats.misses).toBe(1);
    expect(stats.hitRate).toBeCloseTo(0.67, 2);
  });

  it('should update entry on cache hit (LRU)', () => {
    cache = new ResponseCache({ maxSize: 2, ttl: 60000 });

    cache.set('key1', { data: 1 });
    cache.set('key2', { data: 2 });

    cache.get('key1'); // Access key1, making it more recent

    cache.set('key3', { data: 3 }); // Should evict key2, not key1

    expect(cache.get('key1')).not.toBeNull();
    expect(cache.get('key2')).toBeNull();
    expect(cache.get('key3')).not.toBeNull();
  });

  it('should support cache tags', () => {
    cache.set('key1', { data: 1 }, { tags: ['widget', 'w1'] });
    cache.set('key2', { data: 2 }, { tags: ['widget', 'w2'] });
    cache.set('key3', { data: 3 }, { tags: ['state'] });

    cache.invalidateTag('widget');

    expect(cache.get('key1')).toBeNull();
    expect(cache.get('key2')).toBeNull();
    expect(cache.get('key3')).not.toBeNull();
  });
});

/**
 * Test Coverage: 50 tests
 * - ConnectionPool: 10 tests (init, acquire, release, max connections, health check, drain, stats)
 * - RequestHandler: 10 tests (send, request IDs, timeout, retry, concurrent, validation, cancellation, batch, metrics)
 * - ObjectReference: 12 tests (create, invoke, properties, chaining, exceptions, ref count, cache, serialization)
 * - MessageSerializer: 8 tests (serialize/deserialize, binary, compression, circular refs, validation, encoding)
 * - ResponseCache: 10 tests (cache, miss, TTL, max size, invalidate, pattern, clear, stats, LRU, tags)
 */
