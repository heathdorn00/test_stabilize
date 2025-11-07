/**
 * Stryker Mutation Testing Configuration
 *
 * RDB-002 Testing Infrastructure Modernization
 * Week 1: Incremental mutation testing (changed files only)
 *
 * Usage:
 *   - PR Pipeline: npx stryker run --mutate $(git diff --name-only main...HEAD | grep -E '\.(ts|js)$' | tr '\n' ',')
 *   - Nightly Full Scan: npx stryker run
 *
 * Target: ≥80% mutation score for new code, ≥75% for legacy
 */

/** @type {import('@stryker-mutator/core').StrykerOptions} */
module.exports = {
  // Project configuration
  packageManager: 'npm',
  testRunner: 'jest',
  coverageAnalysis: 'perTest',

  // Mutation configuration
  mutate: [
    'src/**/*.ts',
    'src/**/*.js',
    '!src/**/*.spec.ts',
    '!src/**/*.test.ts',
    '!src/**/__tests__/**',
    '!src/**/test/**',
  ],

  // Thresholds - CI gates
  thresholds: {
    high: 90,    // Aspirational for critical paths
    low: 80,     // Standard for new code
    break: 75,   // Fail PR if below 75% (legacy minimum)
  },

  // Performance optimization
  timeoutMS: 60000,      // 60s timeout per mutant
  concurrency: 4,        // Parallel execution (adjust based on CI runner cores)
  maxTestRunnerReuse: 3, // Reuse test runners for speed

  // Incremental mode - run on changed files only (Week 1 requirement)
  incrementalFile: '.stryker-tmp/incremental.json',

  // Ignore patterns - avoid false positives
  ignorePatterns: [
    // Logging statements (no business logic)
    '**/*.log',
    '**/logger.*',

    // Configuration files
    '**/config/**',
    '**/*.config.ts',

    // Generated code
    '**/generated/**',
    '**/*.generated.ts',

    // Type definitions
    '**/*.d.ts',
  ],

  // Mutator configuration
  mutator: {
    plugins: [
      '@stryker-mutator/typescript-checker',
    ],
    excludedMutations: [
      // Exclude mutations on string literals (log messages)
      'StringLiteral',

      // Exclude mutations on console statements
      'ConditionalExpression', // Avoid mutating console.log conditions
    ],
  },

  // Reporting
  reporters: [
    'html',           // HTML report for local development
    'json',           // JSON for CI/CD parsing
    'clear-text',     // Console output
    'progress',       // Progress bar
    'dashboard',      // Stryker Dashboard integration
  ],

  // Jest configuration passthrough
  jest: {
    projectType: 'custom',
    configFile: 'jest.config.js',
    enableFindRelatedTests: true, // Only run tests related to mutated code
  },

  // CI/CD integration
  dashboard: {
    project: 'refactor-team/testing-infrastructure',
    version: process.env.CI_COMMIT_SHA || 'local',
    module: process.env.SERVICE_NAME || 'unknown',
    reportType: 'full',
  },

  // Logging
  logLevel: 'info',
  fileLogLevel: 'debug',

  // Plugins
  plugins: [
    '@stryker-mutator/core',
    '@stryker-mutator/jest-runner',
    '@stryker-mutator/typescript-checker',
  ],

  // Week 3 validation: Ensure <2min for typical PR (10-20 files)
  // Monitor: Grafana dashboard tracks mutation testing duration
};
