/**
 * E2E Test - Widget Interaction User Workflow
 * Task: 57fbde - Comprehensive Test Framework / RDB-002
 * Layer 5: End-to-End Tests
 *
 * Tests user interactions with widgets (click, drag, resize, etc.)
 */

import { test, expect, Page } from '@playwright/test';

test.describe('Widget Interaction Workflow', () => {
  let page: Page;

  test.beforeEach(async ({ page: testPage }) => {
    page = testPage;
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');

    // Create a test widget for interactions
    await createTestWidget(page, {
      type: 'button',
      label: 'Test Button',
      width: 100,
      height: 50,
      x: 200,
      y: 200,
    });
  });

  test('should handle button click event', async () => {
    // Click the button
    await page.click('.widget-button[data-label="Test Button"]');

    // Verify click event fired
    await page.waitForSelector('.event-log');
    const eventLog = await page.textContent('.event-log');
    expect(eventLog).toContain('button.clicked');

    // Verify event data
    const eventData = await page.evaluate(() => {
      return (window as any).lastEvent;
    });
    expect(eventData.type).toBe('click');
    expect(eventData.widgetId).toBeDefined();
  });

  test('should handle double-click event', async () => {
    await page.dblclick('.widget-button[data-label="Test Button"]');

    await page.waitForSelector('.event-log');
    const eventLog = await page.textContent('.event-log');
    expect(eventLog).toContain('button.double_clicked');
  });

  test('should handle hover events', async () => {
    const widget = await page.$('.widget-button[data-label="Test Button"]');

    // Hover over widget
    await widget!.hover();

    // Verify hover state
    await page.waitForTimeout(100);
    const isHovered = await widget!.evaluate(el =>
      el.classList.contains('hovered')
    );
    expect(isHovered).toBe(true);

    // Move away
    await page.mouse.move(0, 0);
    await page.waitForTimeout(100);

    // Verify hover state cleared
    const stillHovered = await widget!.evaluate(el =>
      el.classList.contains('hovered')
    );
    expect(stillHovered).toBe(false);
  });

  test('should drag widget to new position', async () => {
    const widget = await page.$('.widget-button[data-label="Test Button"]');
    const originalBox = await widget!.boundingBox();

    // Drag widget 100px right and 50px down
    await widget!.hover();
    await page.mouse.down();
    await page.mouse.move(
      originalBox!.x + originalBox!.width / 2 + 100,
      originalBox!.y + originalBox!.height / 2 + 50
    );
    await page.mouse.up();

    // Wait for position update
    await page.waitForTimeout(200);

    // Verify new position
    const newBox = await widget!.boundingBox();
    expect(newBox!.x).toBeCloseTo(originalBox!.x + 100, 0);
    expect(newBox!.y).toBeCloseTo(originalBox!.y + 50, 0);

    // Verify position persisted in backend
    const response = await page.request.get('http://localhost:8080/api/v1/widgets');
    const widgets = await response.json();
    const movedWidget = widgets.data[0];
    expect(movedWidget.x).toBeCloseTo(300, 0);
    expect(movedWidget.y).toBeCloseTo(250, 0);
  });

  test('should resize widget', async () => {
    const widget = await page.$('.widget-button[data-label="Test Button"]');
    const originalBox = await widget!.boundingBox();

    // Find resize handle
    await widget!.hover();
    const resizeHandle = await page.$('.widget-button .resize-handle-se');

    // Drag resize handle
    await resizeHandle!.hover();
    await page.mouse.down();
    await page.mouse.move(
      originalBox!.x + originalBox!.width + 50,
      originalBox!.y + originalBox!.height + 25
    );
    await page.mouse.up();

    // Wait for resize update
    await page.waitForTimeout(200);

    // Verify new size
    const newBox = await widget!.boundingBox();
    expect(newBox!.width).toBeCloseTo(150, 0);
    expect(newBox!.height).toBeCloseTo(75, 0);
  });

  test('should select widget on click', async () => {
    const widget = await page.$('.widget-button[data-label="Test Button"]');

    // Click to select
    await widget!.click();

    // Verify selection state
    const isSelected = await widget!.evaluate(el =>
      el.classList.contains('selected')
    );
    expect(isSelected).toBe(true);

    // Verify selection UI elements
    const selectionBorder = await page.$('.selection-border');
    expect(selectionBorder).not.toBeNull();
  });

  test('should deselect widget on background click', async () => {
    const widget = await page.$('.widget-button[data-label="Test Button"]');

    // Select widget
    await widget!.click();
    await page.waitForSelector('.selected');

    // Click background
    await page.click('body', { position: { x: 50, y: 50 } });

    // Verify deselected
    const isSelected = await widget!.evaluate(el =>
      el.classList.contains('selected')
    );
    expect(isSelected).toBe(false);
  });

  test('should enable/disable widget through context menu', async () => {
    const widget = await page.$('.widget-button[data-label="Test Button"]');

    // Right-click to open context menu
    await widget!.click({ button: 'right' });

    // Wait for context menu
    await page.waitForSelector('.context-menu');

    // Click disable option
    await page.click('.context-menu-item[data-action="disable"]');

    // Verify widget disabled
    const isDisabled = await widget!.evaluate(el =>
      el.classList.contains('disabled')
    );
    expect(isDisabled).toBe(true);

    // Verify disabled state persisted
    const response = await page.request.get('http://localhost:8080/api/v1/widgets');
    const widgets = await response.json();
    expect(widgets.data[0].enabled).toBe(false);
  });

  test('should delete widget through keyboard shortcut', async () => {
    const widget = await page.$('.widget-button[data-label="Test Button"]');

    // Select widget
    await widget!.click();

    // Press Delete key
    await page.keyboard.press('Delete');

    // Confirm deletion dialog
    await page.waitForSelector('.confirm-dialog');
    await page.click('.confirm-dialog .confirm-button');

    // Verify widget removed
    await page.waitForTimeout(200);
    const widgets = await page.$$('.widget');
    expect(widgets.length).toBe(0);
  });

  test('should copy and paste widget', async () => {
    const widget = await page.$('.widget-button[data-label="Test Button"]');

    // Select widget
    await widget!.click();

    // Copy (Ctrl+C / Cmd+C)
    await page.keyboard.press(process.platform === 'darwin' ? 'Meta+C' : 'Control+C');

    // Paste (Ctrl+V / Cmd+V)
    await page.keyboard.press(process.platform === 'darwin' ? 'Meta+V' : 'Control+V');

    // Wait for new widget
    await page.waitForTimeout(200);

    // Verify two widgets exist
    const widgets = await page.$$('.widget-button');
    expect(widgets.length).toBe(2);

    // Verify copied widget has different ID but same properties
    const response = await page.request.get('http://localhost:8080/api/v1/widgets');
    const allWidgets = await response.json();
    expect(allWidgets.data.length).toBe(2);
    expect(allWidgets.data[0].label).toBe(allWidgets.data[1].label);
    expect(allWidgets.data[0].id).not.toBe(allWidgets.data[1].id);
  });

  test('should undo widget move', async () => {
    const widget = await page.$('.widget-button[data-label="Test Button"]');
    const originalBox = await widget!.boundingBox();

    // Move widget
    await widget!.hover();
    await page.mouse.down();
    await page.mouse.move(
      originalBox!.x + 100,
      originalBox!.y + 100
    );
    await page.mouse.up();

    await page.waitForTimeout(200);

    // Undo (Ctrl+Z / Cmd+Z)
    await page.keyboard.press(process.platform === 'darwin' ? 'Meta+Z' : 'Control+Z');

    // Wait for undo
    await page.waitForTimeout(200);

    // Verify widget back at original position
    const newBox = await widget!.boundingBox();
    expect(newBox!.x).toBeCloseTo(originalBox!.x, 0);
    expect(newBox!.y).toBeCloseTo(originalBox!.y, 0);
  });

  test('should snap widget to grid', async () => {
    // Enable grid snapping
    await page.click('#view-menu');
    await page.click('#enable-grid-snap');

    const widget = await page.$('.widget-button[data-label="Test Button"]');

    // Move widget (should snap to nearest grid point)
    await widget!.hover();
    await page.mouse.down();
    await page.mouse.move(237, 263); // Not aligned to grid
    await page.mouse.up();

    await page.waitForTimeout(200);

    // Verify snapped to grid (assuming 10px grid)
    const newBox = await widget!.boundingBox();
    expect(newBox!.x % 10).toBe(0);
    expect(newBox!.y % 10).toBe(0);
  });
});

/**
 * Helper function to create test widget
 */
async function createTestWidget(page: Page, config: any) {
  await page.evaluate((cfg) => {
    (window as any).createWidget(cfg);
  }, config);
  await page.waitForSelector(`.widget-${config.type}`);
}

/**
 * Test Coverage: 12 tests
 * - Click/double-click events
 * - Hover states
 * - Drag and drop
 * - Resize
 * - Selection/deselection
 * - Context menu actions
 * - Keyboard shortcuts (delete, copy/paste, undo)
 * - Grid snapping
 */
