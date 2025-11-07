/**
 * k6 Load Test - Baseline Performance
 * Task: 57fbde - Set up comprehensive test framework
 * Layer 5: E2E & Performance Tests (5% coverage target)
 *
 * Baseline test: 100 RPS for 5 minutes, P95 < 500ms
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');
const widgetCreationDuration = new Trend('widget_creation_duration');

// Test configuration
export const options = {
  stages: [
    { duration: '1m', target: 50 },   // Ramp-up to 50 VUs
    { duration: '1m', target: 100 },  // Ramp-up to 100 VUs
    { duration: '5m', target: 100 },  // Sustain 100 VUs for 5 minutes
    { duration: '1m', target: 0 },    // Ramp-down
  ],
  thresholds: {
    // Performance thresholds
    'http_req_duration': ['p(95)<500'],           // P95 < 500ms
    'http_req_duration{name:CreateWidget}': ['p(95)<300'], // Widget creation P95 < 300ms
    'http_req_duration{name:GetWidget}': ['p(95)<200'],    // Widget retrieval P95 < 200ms

    // Success rate thresholds
    'http_req_failed': ['rate<0.01'],             // <1% error rate
    'errors': ['rate<0.01'],                      // <1% business logic errors

    // Throughput thresholds
    'http_reqs': ['rate>80'],                     // >80 RPS sustained

    // Custom metric thresholds
    'widget_creation_duration': ['p(95)<300'],    // Widget creation P95 < 300ms
  },
};

// Test configuration from environment
const BASE_URL = __ENV.BASE_URL || 'http://localhost:8080';

// Test data
const WIDGET_TYPES = ['button', 'textbox', 'label', 'panel'];
const LABELS = ['Submit', 'Cancel', 'OK', 'Close', 'Next', 'Back'];

/**
 * Generate random widget data
 */
function generateWidgetData() {
  return {
    type: WIDGET_TYPES[Math.floor(Math.random() * WIDGET_TYPES.length)],
    label: LABELS[Math.floor(Math.random() * LABELS.length)],
    enabled: Math.random() > 0.2, // 80% enabled
  };
}

/**
 * Main test scenario
 */
export default function () {
  // Scenario: Create, retrieve, update, delete widget (typical workflow)

  // 1. Create Widget (40% of requests)
  if (Math.random() < 0.4) {
    const widgetData = generateWidgetData();
    const createResponse = http.post(
      `${BASE_URL}/widgets`,
      JSON.stringify(widgetData),
      {
        headers: { 'Content-Type': 'application/json' },
        tags: { name: 'CreateWidget' },
      }
    );

    // Record custom metric
    widgetCreationDuration.add(createResponse.timings.duration);

    // Check response
    const createSuccess = check(createResponse, {
      'widget created (status 201)': (r) => r.status === 201,
      'widget has ID': (r) => r.json('widget_id') !== undefined,
      'response time < 500ms': (r) => r.timings.duration < 500,
    });

    errorRate.add(!createSuccess);

    // Store widget ID for subsequent requests
    if (createSuccess) {
      const widgetId = createResponse.json('widget_id');

      // 2. Retrieve Widget (30% of requests)
      if (Math.random() < 0.3) {
        const getResponse = http.get(
          `${BASE_URL}/widgets/${widgetId}`,
          { tags: { name: 'GetWidget' } }
        );

        const getSuccess = check(getResponse, {
          'widget retrieved (status 200)': (r) => r.status === 200,
          'widget data matches': (r) => r.json('widget_id') === widgetId,
          'response time < 300ms': (r) => r.timings.duration < 300,
        });

        errorRate.add(!getSuccess);
      }

      // 3. Update Widget (20% of requests)
      if (Math.random() < 0.2) {
        const updateData = { label: 'Updated ' + Math.random().toString(36).substr(2, 9) };
        const updateResponse = http.patch(
          `${BASE_URL}/widgets/${widgetId}`,
          JSON.stringify(updateData),
          {
            headers: { 'Content-Type': 'application/json' },
            tags: { name: 'UpdateWidget' },
          }
        );

        const updateSuccess = check(updateResponse, {
          'widget updated (status 200)': (r) => r.status === 200,
          'response time < 400ms': (r) => r.timings.duration < 400,
        });

        errorRate.add(!updateSuccess);
      }

      // 4. Delete Widget (10% of requests)
      if (Math.random() < 0.1) {
        const deleteResponse = http.del(
          `${BASE_URL}/widgets/${widgetId}`,
          null,
          { tags: { name: 'DeleteWidget' } }
        );

        const deleteSuccess = check(deleteResponse, {
          'widget deleted (status 204)': (r) => r.status === 204,
          'response time < 300ms': (r) => r.timings.duration < 300,
        });

        errorRate.add(!deleteSuccess);
      }
    }
  }

  // 5. List Widgets (remaining requests)
  else {
    const listResponse = http.get(
      `${BASE_URL}/widgets?limit=20&offset=0`,
      { tags: { name: 'ListWidgets' } }
    );

    const listSuccess = check(listResponse, {
      'widgets listed (status 200)': (r) => r.status === 200,
      'response has widgets array': (r) => Array.isArray(r.json('widgets')),
      'response time < 400ms': (r) => r.timings.duration < 400,
    });

    errorRate.add(!listSuccess);
  }

  // Think time (realistic user behavior)
  sleep(Math.random() * 2 + 0.5); // 0.5-2.5 seconds
}

/**
 * Setup function (runs once per VU)
 */
export function setup() {
  console.log('🚀 Starting baseline load test');
  console.log(`📍 Target: ${BASE_URL}`);
  console.log('📊 Expected: 100 RPS, P95 < 500ms');

  // Verify service is available
  const healthCheck = http.get(`${BASE_URL}/health`);
  if (healthCheck.status !== 200) {
    throw new Error('Service is not available');
  }

  return { startTime: new Date().toISOString() };
}

/**
 * Teardown function (runs once after test)
 */
export function teardown(data) {
  console.log('✅ Baseline load test completed');
  console.log(`⏱️  Started: ${data.startTime}`);
  console.log(`⏱️  Ended: ${new Date().toISOString()}`);
}

/**
 * Summary handler
 */
export function handleSummary(data) {
  return {
    'stdout': textSummary(data, { indent: ' ', enableColors: true }),
    'summary.json': JSON.stringify(data, null, 2),
  };
}

/**
 * COVERAGE TARGET: 5% E2E tests - critical performance paths
 *
 * Test Scenarios:
 * - Create widget: 40% of requests
 * - Retrieve widget: 30% of requests (after create)
 * - Update widget: 20% of requests (after create)
 * - Delete widget: 10% of requests (after create)
 * - List widgets: remaining requests
 *
 * Performance Targets:
 * - P95 latency: <500ms (all endpoints)
 * - Error rate: <1%
 * - Throughput: >80 RPS
 * - Widget creation P95: <300ms
 *
 * Run:
 *   k6 run baseline.js
 *
 * Run with environment:
 *   BASE_URL=http://staging.example.com k6 run baseline.js
 *
 * Run with k6 Cloud:
 *   k6 cloud baseline.js
 */

function textSummary(data, options) {
  // Simplified text summary (use k6's built-in in real implementation)
  return JSON.stringify(data, null, 2);
}
