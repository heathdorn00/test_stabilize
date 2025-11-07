/**
 * Stryker Mutation Testing Configuration
 * RDB-002 Week 1 - Incremental Mutation Testing (<2min target)
 *
 * This runs mutation testing on changed files only for fast feedback
 */

// @ts-check
/** @type {import('@stryker-mutator/api/core').PartialStrykerOptions} */
const config = {
  packageManager: "npm",
  reporters: ["html", "clear-text", "progress", "dashboard"],
  testRunner: "jest",

  // Coverage analysis for faster mutation testing
  coverageAnalysis: "perTest",

  // Mutators to use
  mutator: {
    plugins: ["@stryker-mutator/javascript-mutator"],
    excludedMutations: []
  },

  // File patterns
  mutate: [
    "src/**/*.ts",
    "!src/**/*.test.ts",
    "!src/**/__tests__/**"
  ],

  // Jest configuration
  jest: {
    projectType: "custom",
    configFile: "package.json",
    enableFindRelatedTests: true
  },

  // Thresholds for mutation score
  thresholds: {
    high: 80,
    low: 60,
    break: 50  // Fail build if mutation score < 50%
  },

  // Timeouts
  timeoutMS: 60000,
  timeoutFactor: 1.5,

  // Concurrency (adjust based on CPU cores)
  concurrency: 4,

  // Incremental mode - only mutate changed files
  incremental: true,
  incrementalFile: ".stryker-tmp/incremental.json",

  // Dashboard reporter (optional - for Stryker dashboard)
  dashboard: {
    reportType: "full"
  }
};

module.exports = config;
