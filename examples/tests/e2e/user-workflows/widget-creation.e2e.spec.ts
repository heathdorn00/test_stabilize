/**
 * E2E Test - Widget Creation User Workflow
 * Task: 57fbde - Comprehensive Test Framework / RDB-002
 * Layer 5: End-to-End Tests
 *
 * Tests complete user workflow for creating widgets through the UI.
 */

import { test, expect, Page } from '@playwright/test';

test.describe('Widget Creation Workflow', () => {
  let page: Page;

  test.beforeEach(async ({ page: testPage }) => {
    page = testPage;
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');
  });

  test('should create button widget through UI', async () => {
    // Open widget creation dialog
    await page.click('#create-widget-button');
    await page.waitForSelector('#widget-creation-dialog');

    // Select button type
    await page.click('#widget-type-button');

    // Fill widget properties
    await page.fill('#widget-label-input', 'Click Me');
    await page.fill('#widget-width-input', '100');
    await page.fill('#widget-height-input', '50');

    // Submit creation
    await page.click('#create-widget-submit');

    // Wait for widget to appear
    await page.waitForSelector('.widget-button[data-label="Click Me"]');

    // Verify widget rendered
    const widget = await page.$('.widget-button[data-label="Click Me"]');
    expect(widget).not.toBeNull();

    // Verify widget properties
    const boundingBox = await widget!.boundingBox();
    expect(boundingBox!.width).toBeCloseTo(100, 0);
    expect(boundingBox!.height).toBeCloseTo(50, 0);

    // Verify in backend (via API)
    const response = await page.request.get('http://localhost:8080/api/v1/widgets');
    const widgets = await response.json();
    expect(widgets.data.length).toBeGreaterThan(0);

    const createdWidget = widgets.data.find((w: any) => w.label === 'Click Me');
    expect(createdWidget).toBeDefined();
    expect(createdWidget.type).toBe('button');
  });

  test('should create label widget with custom styling', async () => {
    await page.click('#create-widget-button');
    await page.waitForSelector('#widget-creation-dialog');

    // Select label type
    await page.click('#widget-type-label');

    // Fill properties
    await page.fill('#widget-label-input', 'Status Label');
    await page.fill('#widget-width-input', '200');
    await page.fill('#widget-height-input', '30');

    // Open style options
    await page.click('#style-options-toggle');

    // Set custom colors
    await page.fill('#font-color-input', '#FF0000');
    await page.fill('#background-color-input', '#F0F0F0');

    // Submit
    await page.click('#create-widget-submit');

    // Wait for widget
    await page.waitForSelector('.widget-label[data-label="Status Label"]');

    // Verify styling applied
    const widget = await page.$('.widget-label[data-label="Status Label"]');
    const color = await widget!.evaluate(el =>
      window.getComputedStyle(el).color
    );
    expect(color).toBe('rgb(255, 0, 0)'); // #FF0000
  });

  test('should validate required fields', async () => {
    await page.click('#create-widget-button');
    await page.waitForSelector('#widget-creation-dialog');

    // Select button type
    await page.click('#widget-type-button');

    // Try to submit without label
    await page.click('#create-widget-submit');

    // Verify validation error
    await page.waitForSelector('.validation-error');
    const error = await page.textContent('.validation-error');
    expect(error).toContain('Label is required');

    // Widget should not be created
    const widgets = await page.$$('.widget-button');
    expect(widgets.length).toBe(0);
  });

  test('should validate dimension constraints', async () => {
    await page.click('#create-widget-button');
    await page.waitForSelector('#widget-creation-dialog');

    await page.click('#widget-type-button');
    await page.fill('#widget-label-input', 'Test');

    // Try invalid dimensions
    await page.fill('#widget-width-input', '-100');
    await page.fill('#widget-height-input', '50');
    await page.click('#create-widget-submit');

    // Verify validation error
    await page.waitForSelector('.validation-error');
    const error = await page.textContent('.validation-error');
    expect(error).toContain('Width must be positive');
  });

  test('should create container with nested widgets', async () => {
    // Create container
    await page.click('#create-widget-button');
    await page.waitForSelector('#widget-creation-dialog');
    await page.click('#widget-type-container');
    await page.fill('#widget-width-input', '400');
    await page.fill('#widget-height-input', '300');
    await page.click('#create-widget-submit');

    await page.waitForSelector('.widget-container');
    const container = await page.$('.widget-container');

    // Click container to select it
    await container!.click();

    // Create child button
    await page.click('#create-child-widget-button');
    await page.waitForSelector('#widget-creation-dialog');
    await page.click('#widget-type-button');
    await page.fill('#widget-label-input', 'Child Button');
    await page.fill('#widget-width-input', '100');
    await page.fill('#widget-height-input', '50');
    await page.click('#create-widget-submit');

    // Verify child widget rendered inside container
    const childWidget = await page.$('.widget-container .widget-button');
    expect(childWidget).not.toBeNull();
  });

  test('should cancel widget creation', async () => {
    await page.click('#create-widget-button');
    await page.waitForSelector('#widget-creation-dialog');

    await page.click('#widget-type-button');
    await page.fill('#widget-label-input', 'Test');
    await page.fill('#widget-width-input', '100');
    await page.fill('#widget-height-input', '50');

    // Cancel instead of submit
    await page.click('#cancel-button');

    // Dialog should close
    const dialog = await page.$('#widget-creation-dialog');
    expect(dialog).toBeNull();

    // No widget created
    const widgets = await page.$$('.widget');
    expect(widgets.length).toBe(0);
  });

  test('should create multiple widgets sequentially', async () => {
    const widgetConfigs = [
      { type: 'button', label: 'Button 1', width: '100', height: '50' },
      { type: 'label', label: 'Label 1', width: '200', height: '30' },
      { type: 'button', label: 'Button 2', width: '100', height: '50' },
    ];

    for (const config of widgetConfigs) {
      await page.click('#create-widget-button');
      await page.waitForSelector('#widget-creation-dialog');
      await page.click(`#widget-type-${config.type}`);
      await page.fill('#widget-label-input', config.label);
      await page.fill('#widget-width-input', config.width);
      await page.fill('#widget-height-input', config.height);
      await page.click('#create-widget-submit');
      await page.waitForSelector(`.widget-${config.type}[data-label="${config.label}"]`);
    }

    // Verify all widgets created
    const widgets = await page.$$('.widget');
    expect(widgets.length).toBe(3);
  });

  test('should show creation progress for complex widgets', async () => {
    await page.click('#create-widget-button');
    await page.waitForSelector('#widget-creation-dialog');

    // Create complex container with many properties
    await page.click('#widget-type-container');
    await page.fill('#widget-width-input', '800');
    await page.fill('#widget-height-input', '600');

    // Enable advanced options
    await page.click('#advanced-options-toggle');
    await page.check('#enable-shadows');
    await page.check('#enable-animations');

    await page.click('#create-widget-submit');

    // Progress indicator should appear
    await page.waitForSelector('.creation-progress');

    // Wait for completion
    await page.waitForSelector('.widget-container', { timeout: 10000 });

    // Progress indicator should disappear
    const progress = await page.$('.creation-progress');
    expect(progress).toBeNull();
  });

  test('should handle creation errors gracefully', async () => {
    // Simulate backend error by creating invalid widget type
    await page.click('#create-widget-button');
    await page.waitForSelector('#widget-creation-dialog');

    // Force an error condition
    await page.evaluate(() => {
      (window as any).simulateBackendError = true;
    });

    await page.click('#widget-type-button');
    await page.fill('#widget-label-input', 'Error Test');
    await page.fill('#widget-width-input', '100');
    await page.fill('#widget-height-input', '50');
    await page.click('#create-widget-submit');

    // Error message should appear
    await page.waitForSelector('.error-notification');
    const error = await page.textContent('.error-notification');
    expect(error).toContain('Failed to create widget');

    // Dialog should remain open for retry
    const dialog = await page.$('#widget-creation-dialog');
    expect(dialog).not.toBeNull();

    // Cleanup
    await page.evaluate(() => {
      (window as any).simulateBackendError = false;
    });
  });

  test('should preserve form state on validation errors', async () => {
    await page.click('#create-widget-button');
    await page.waitForSelector('#widget-creation-dialog');

    await page.click('#widget-type-button');
    await page.fill('#widget-label-input', 'Preserve Test');
    await page.fill('#widget-width-input', '100');
    // Intentionally omit height to trigger validation error

    await page.click('#create-widget-submit');

    // Wait for validation error
    await page.waitForSelector('.validation-error');

    // Verify form state preserved
    const label = await page.inputValue('#widget-label-input');
    const width = await page.inputValue('#widget-width-input');

    expect(label).toBe('Preserve Test');
    expect(width).toBe('100');
  });
});

/**
 * Test Coverage: 10 tests
 * - Basic widget creation (button, label)
 * - Validation (required fields, constraints)
 * - Container with nested widgets
 * - Cancellation
 * - Multiple sequential creations
 * - Progress indication
 * - Error handling
 * - Form state preservation
 */
