/**
 * Unit Tests - Platform Adapter Service (TypeScript)
 * Task: 57fbde - Comprehensive Test Framework / RDB-002
 * Layer 1: Unit Tests
 *
 * Tests individual classes in Platform Adapter service in isolation.
 */

import { ResourceLoader } from '@/services/platform-adapter/resource-loader';
import { PlatformDetector } from '@/services/platform-adapter/platform-detector';
import { NativeInterface } from '@/services/platform-adapter/native-interface';
import { WindowManager } from '@/services/platform-adapter/window-manager';
import { FileSystemBridge } from '@/services/platform-adapter/filesystem-bridge';
import { MockNativeAPI } from '@/test-utils/mocks';

describe('ResourceLoader', () => {
  let loader: ResourceLoader;
  let mockCache: Map<string, any>;

  beforeEach(() => {
    mockCache = new Map();
    loader = new ResourceLoader({ cache: mockCache });
  });

  it('should load resource by URL', async () => {
    const resource = await loader.load('http://example.com/image.png');

    expect(resource).toBeDefined();
    expect(resource.url).toBe('http://example.com/image.png');
  });

  it('should cache loaded resources', async () => {
    await loader.load('http://example.com/data.json');
    await loader.load('http://example.com/data.json');

    expect(mockCache.size).toBe(1);
  });

  it('should bypass cache when requested', async () => {
    await loader.load('http://example.com/data.json', { bypassCache: true });

    expect(mockCache.size).toBe(0);
  });

  it('should load multiple resources in parallel', async () => {
    const urls = [
      'http://example.com/res1.png',
      'http://example.com/res2.png',
      'http://example.com/res3.png',
    ];

    const resources = await loader.loadAll(urls);

    expect(resources.length).toBe(3);
  });

  it('should handle load errors gracefully', async () => {
    await expect(
      loader.load('http://example.com/invalid')
    ).rejects.toThrow(/failed to load/i);
  });

  it('should support timeout for loading', async () => {
    await expect(
      loader.load('http://example.com/slow', { timeout: 100 })
    ).rejects.toThrow(/timeout/i);
  });

  it('should preload resources', async () => {
    const urls = [
      'http://example.com/res1.png',
      'http://example.com/res2.png',
    ];

    await loader.preload(urls);

    expect(mockCache.size).toBe(2);
  });

  it('should clear cache', () => {
    mockCache.set('key1', 'value1');
    mockCache.set('key2', 'value2');

    loader.clearCache();

    expect(mockCache.size).toBe(0);
  });

  it('should get cache statistics', async () => {
    await loader.load('http://example.com/res1.png');
    await loader.load('http://example.com/res1.png'); // Cache hit
    await loader.load('http://example.com/res2.png');

    const stats = loader.getCacheStats();
    expect(stats.hits).toBe(1);
    expect(stats.misses).toBe(2);
  });

  it('should support resource types', async () => {
    const image = await loader.loadImage('http://example.com/image.png');
    const json = await loader.loadJSON('http://example.com/data.json');

    expect(image.type).toBe('image');
    expect(json.type).toBe('json');
  });
});

describe('PlatformDetector', () => {
  let detector: PlatformDetector;

  beforeEach(() => {
    detector = new PlatformDetector();
  });

  it('should detect operating system', () => {
    const os = detector.getOperatingSystem();

    expect(os).toMatch(/windows|macos|linux/i);
  });

  it('should detect browser', () => {
    const browser = detector.getBrowser();

    expect(browser).toBeDefined();
    expect(browser.name).toMatch(/chrome|firefox|safari|edge/i);
  });

  it('should detect browser version', () => {
    const browser = detector.getBrowser();

    expect(browser.version).toBeDefined();
    expect(typeof browser.version).toBe('string');
  });

  it('should detect mobile device', () => {
    const isMobile = detector.isMobile();

    expect(typeof isMobile).toBe('boolean');
  });

  it('should detect tablet device', () => {
    const isTablet = detector.isTablet();

    expect(typeof isTablet).toBe('boolean');
  });

  it('should detect touch support', () => {
    const hasTouch = detector.hasTouchSupport();

    expect(typeof hasTouch).toBe('boolean');
  });

  it('should detect screen size', () => {
    const screen = detector.getScreenSize();

    expect(screen.width).toBeGreaterThan(0);
    expect(screen.height).toBeGreaterThan(0);
  });

  it('should detect pixel density', () => {
    const density = detector.getPixelDensity();

    expect(density).toBeGreaterThan(0);
  });

  it('should detect color depth', () => {
    const colorDepth = detector.getColorDepth();

    expect([8, 16, 24, 32]).toContain(colorDepth);
  });

  it('should detect supported features', () => {
    const features = detector.getSupportedFeatures();

    expect(features).toBeInstanceOf(Array);
    expect(features.length).toBeGreaterThan(0);
  });

  it('should check specific feature support', () => {
    const webgl = detector.supportsFeature('webgl');

    expect(typeof webgl).toBe('boolean');
  });

  it('should get platform capabilities', () => {
    const capabilities = detector.getCapabilities();

    expect(capabilities.maxTextureSize).toBeDefined();
    expect(capabilities.maxViewportDimensions).toBeDefined();
  });
});

describe('NativeInterface', () => {
  let nativeInterface: NativeInterface;
  let mockAPI: MockNativeAPI;

  beforeEach(() => {
    mockAPI = new MockNativeAPI();
    nativeInterface = new NativeInterface(mockAPI);
  });

  it('should call native method', async () => {
    const result = await nativeInterface.call('platform.getVersion');

    expect(result).toBeDefined();
    expect(mockAPI.getCallCount()).toBe(1);
  });

  it('should call native method with arguments', async () => {
    await nativeInterface.call('platform.showNotification', {
      title: 'Test',
      message: 'Hello',
    });

    expect(mockAPI.getLastCall()).toMatchObject({
      method: 'platform.showNotification',
      args: { title: 'Test', message: 'Hello' },
    });
  });

  it('should handle native errors', async () => {
    mockAPI.setNextError(new Error('Native error'));

    await expect(
      nativeInterface.call('invalid.method')
    ).rejects.toThrow(/native error/i);
  });

  it('should register callback', () => {
    const callback = jest.fn();

    nativeInterface.on('platform.event', callback);

    mockAPI.triggerEvent('platform.event', { data: 'test' });

    expect(callback).toHaveBeenCalledWith({ data: 'test' });
  });

  it('should unregister callback', () => {
    const callback = jest.fn();

    nativeInterface.on('platform.event', callback);
    nativeInterface.off('platform.event', callback);

    mockAPI.triggerEvent('platform.event', { data: 'test' });

    expect(callback).not.toHaveBeenCalled();
  });

  it('should check if method is available', () => {
    expect(nativeInterface.isAvailable('platform.getVersion')).toBe(true);
    expect(nativeInterface.isAvailable('invalid.method')).toBe(false);
  });

  it('should get native API version', () => {
    const version = nativeInterface.getAPIVersion();

    expect(version).toBeDefined();
    expect(typeof version).toBe('string');
  });

  it('should batch multiple calls', async () => {
    const results = await nativeInterface.batchCall([
      { method: 'platform.getVersion' },
      { method: 'platform.getOS' },
      { method: 'platform.getLocale' },
    ]);

    expect(results.length).toBe(3);
  });

  it('should handle mixed success/failure in batch', async () => {
    mockAPI.setMethodError('platform.invalid', new Error('Invalid'));

    const results = await nativeInterface.batchCall([
      { method: 'platform.getVersion' },
      { method: 'platform.invalid' },
      { method: 'platform.getOS' },
    ]);

    expect(results[0].success).toBe(true);
    expect(results[1].success).toBe(false);
    expect(results[2].success).toBe(true);
  });
});

describe('WindowManager', () => {
  let windowManager: WindowManager;

  beforeEach(() => {
    windowManager = new WindowManager();
  });

  it('should create window', () => {
    const window = windowManager.createWindow({
      width: 800,
      height: 600,
      title: 'Test Window',
    });

    expect(window.id).toBeDefined();
    expect(window.width).toBe(800);
    expect(window.height).toBe(600);
  });

  it('should get window by ID', () => {
    const created = windowManager.createWindow({ width: 800, height: 600 });
    const retrieved = windowManager.getWindow(created.id);

    expect(retrieved.id).toBe(created.id);
  });

  it('should resize window', () => {
    const window = windowManager.createWindow({ width: 800, height: 600 });

    windowManager.resizeWindow(window.id, 1024, 768);

    const updated = windowManager.getWindow(window.id);
    expect(updated.width).toBe(1024);
    expect(updated.height).toBe(768);
  });

  it('should move window', () => {
    const window = windowManager.createWindow({
      width: 800,
      height: 600,
      x: 0,
      y: 0,
    });

    windowManager.moveWindow(window.id, 100, 200);

    const updated = windowManager.getWindow(window.id);
    expect(updated.x).toBe(100);
    expect(updated.y).toBe(200);
  });

  it('should maximize window', () => {
    const window = windowManager.createWindow({ width: 800, height: 600 });

    windowManager.maximizeWindow(window.id);

    const updated = windowManager.getWindow(window.id);
    expect(updated.isMaximized).toBe(true);
  });

  it('should minimize window', () => {
    const window = windowManager.createWindow({ width: 800, height: 600 });

    windowManager.minimizeWindow(window.id);

    const updated = windowManager.getWindow(window.id);
    expect(updated.isMinimized).toBe(true);
  });

  it('should restore window', () => {
    const window = windowManager.createWindow({ width: 800, height: 600 });

    windowManager.minimizeWindow(window.id);
    windowManager.restoreWindow(window.id);

    const updated = windowManager.getWindow(window.id);
    expect(updated.isMinimized).toBe(false);
  });

  it('should close window', () => {
    const window = windowManager.createWindow({ width: 800, height: 600 });

    windowManager.closeWindow(window.id);

    expect(windowManager.getWindow(window.id)).toBeNull();
  });

  it('should list all windows', () => {
    windowManager.createWindow({ width: 800, height: 600 });
    windowManager.createWindow({ width: 1024, height: 768 });

    const windows = windowManager.getAllWindows();
    expect(windows.length).toBe(2);
  });

  it('should get active window', () => {
    const window1 = windowManager.createWindow({ width: 800, height: 600 });
    const window2 = windowManager.createWindow({ width: 1024, height: 768 });

    windowManager.activateWindow(window2.id);

    const active = windowManager.getActiveWindow();
    expect(active.id).toBe(window2.id);
  });

  it('should set window title', () => {
    const window = windowManager.createWindow({
      width: 800,
      height: 600,
      title: 'Original',
    });

    windowManager.setWindowTitle(window.id, 'Updated');

    const updated = windowManager.getWindow(window.id);
    expect(updated.title).toBe('Updated');
  });

  it('should toggle fullscreen', () => {
    const window = windowManager.createWindow({ width: 800, height: 600 });

    windowManager.toggleFullscreen(window.id);

    const updated = windowManager.getWindow(window.id);
    expect(updated.isFullscreen).toBe(true);
  });
});

describe('FileSystemBridge', () => {
  let fsBridge: FileSystemBridge;

  beforeEach(() => {
    fsBridge = new FileSystemBridge();
  });

  it('should read file', async () => {
    const content = await fsBridge.readFile('/test/file.txt');

    expect(content).toBeDefined();
    expect(typeof content).toBe('string');
  });

  it('should write file', async () => {
    await fsBridge.writeFile('/test/output.txt', 'Hello World');

    const content = await fsBridge.readFile('/test/output.txt');
    expect(content).toBe('Hello World');
  });

  it('should check if file exists', async () => {
    await fsBridge.writeFile('/test/exists.txt', 'content');

    const exists = await fsBridge.exists('/test/exists.txt');
    const notExists = await fsBridge.exists('/test/not-found.txt');

    expect(exists).toBe(true);
    expect(notExists).toBe(false);
  });

  it('should delete file', async () => {
    await fsBridge.writeFile('/test/delete-me.txt', 'content');
    await fsBridge.deleteFile('/test/delete-me.txt');

    const exists = await fsBridge.exists('/test/delete-me.txt');
    expect(exists).toBe(false);
  });

  it('should create directory', async () => {
    await fsBridge.createDirectory('/test/new-dir');

    const exists = await fsBridge.exists('/test/new-dir');
    expect(exists).toBe(true);
  });

  it('should list directory contents', async () => {
    await fsBridge.createDirectory('/test/dir');
    await fsBridge.writeFile('/test/dir/file1.txt', 'content');
    await fsBridge.writeFile('/test/dir/file2.txt', 'content');

    const contents = await fsBridge.listDirectory('/test/dir');

    expect(contents.length).toBe(2);
    expect(contents).toContain('file1.txt');
    expect(contents).toContain('file2.txt');
  });

  it('should get file stats', async () => {
    await fsBridge.writeFile('/test/stats.txt', 'Hello World');

    const stats = await fsBridge.getStats('/test/stats.txt');

    expect(stats.size).toBe(11);
    expect(stats.isFile).toBe(true);
    expect(stats.isDirectory).toBe(false);
  });

  it('should copy file', async () => {
    await fsBridge.writeFile('/test/source.txt', 'content');
    await fsBridge.copyFile('/test/source.txt', '/test/dest.txt');

    const content = await fsBridge.readFile('/test/dest.txt');
    expect(content).toBe('content');
  });

  it('should move file', async () => {
    await fsBridge.writeFile('/test/move-from.txt', 'content');
    await fsBridge.moveFile('/test/move-from.txt', '/test/move-to.txt');

    const existsOld = await fsBridge.exists('/test/move-from.txt');
    const existsNew = await fsBridge.exists('/test/move-to.txt');

    expect(existsOld).toBe(false);
    expect(existsNew).toBe(true);
  });

  it('should read binary file', async () => {
    const data = new Uint8Array([1, 2, 3, 4, 5]);
    await fsBridge.writeBinary('/test/binary.dat', data);

    const read = await fsBridge.readBinary('/test/binary.dat');

    expect(read).toEqual(data);
  });

  it('should watch file for changes', async () => {
    const callback = jest.fn();

    await fsBridge.watchFile('/test/watch.txt', callback);
    await fsBridge.writeFile('/test/watch.txt', 'new content');

    // Simulate file system event
    await new Promise(resolve => setTimeout(resolve, 100));

    expect(callback).toHaveBeenCalled();
  });

  it('should unwatch file', async () => {
    const callback = jest.fn();

    await fsBridge.watchFile('/test/watch.txt', callback);
    await fsBridge.unwatchFile('/test/watch.txt');
    await fsBridge.writeFile('/test/watch.txt', 'new content');

    await new Promise(resolve => setTimeout(resolve, 100));

    expect(callback).not.toHaveBeenCalled();
  });
});

/**
 * Test Coverage: 59 tests
 * - ResourceLoader: 10 tests (load, cache, parallel, errors, timeout, preload, stats)
 * - PlatformDetector: 12 tests (OS, browser, mobile, tablet, touch, screen, density, features)
 * - NativeInterface: 9 tests (call, args, errors, callbacks, availability, version, batch)
 * - WindowManager: 12 tests (create, resize, move, maximize, minimize, close, active, fullscreen)
 * - FileSystemBridge: 12 tests (read, write, exists, delete, directory, stats, copy, move, binary, watch)
 */
