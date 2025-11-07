"""
Mutmut Configuration for Ada Mutation Testing (Adapted)

RDB-002 Testing Infrastructure Modernization
Week 1: Incremental mutation testing (changed files only)

Note: mutmut is originally for Python. This is an ADAPTED version for Ada.
Week 3 POC required to validate feasibility.

Usage:
  - PR Pipeline: python mutmut_ada.py --paths-to-mutate $(git diff --name-only main...HEAD | grep -E '\.adb$' | tr '\n' ',')
  - Nightly Full Scan: python mutmut_ada.py --paths-to-mutate src/

Target: ≥80% mutation score for new code, ≥75% for legacy

Fallback: If Ada POC fails in Week 3, skip Ada mutation testing until custom tooling available.
"""

# Mutation operators for Ada
MUTATION_OPERATORS = [
    # Arithmetic operators
    ("\\+", "-"),           # a + b → a - b
    ("-", "+"),             # a - b → a + b
    ("\\*", "/"),           # a * b → a / b
    ("/", "*"),             # a / b → a * b
    ("mod", "rem"),         # a mod b → a rem b

    # Relational operators
    ("<", "<="),            # a < b → a <= b
    ("<=", "<"),            # a <= b → a < b
    (">", ">="),            # a > b → a >= b
    (">=", ">"),            # a >= b → a > b
    ("=", "/="),            # a = b → a /= b
    ("/=", "="),            # a /= b → a = b

    # Logical operators
    ("and", "or"),          # a and b → a or b
    ("or", "and"),          # a or b → a and b
    ("and then", "or else"),  # a and then b → a or else b
    ("or else", "and then"),  # a or else b → a and then b
    ("not", ""),            # not x → x

    # Boolean constants
    ("True", "False"),      # True → False
    ("False", "True"),      # False → True

    # Numeric constants (boundary)
    ("0", "1"),             # 0 → 1
    ("1", "0"),             # 1 → 0
    ("-1", "1"),            # -1 → 1
]

# Paths to mutate (business logic only)
PATHS_TO_MUTATE = [
    "src/polyorb/orb_core/**/*.adb",
    "src/polyorb/giop_protocol/**/*.adb",
    "src/polyorb/security/**/*.adb",
    "src/polyorb/naming/**/*.adb",
    "src/polyorb/event_notification/**/*.adb",
    "src/polyorb/transaction/**/*.adb",
    "src/polyorb/poa_manager/**/*.adb",
    "src/polyorb/idl_compiler/**/*.adb",
]

# Exclude patterns (no business logic)
EXCLUDE_PATTERNS = [
    "**/test/**",
    "**/tests/**",
    "**/*_test.adb",
    "**/generated/**",
    "**/vendor/**",
    "**/third_party/**",
]

# AUnit test configuration
TEST_RUNNER = "aunit_runner"
TEST_COMMAND = "gprbuild -P tests.gpr && ./tests/test_runner"

# Thresholds - CI gates
THRESHOLDS = {
    "high": 90,    # Aspirational for critical paths
    "low": 80,     # Standard for new code
    "break": 75,   # Fail PR if below 75% (legacy minimum)
}

# Performance configuration
PARALLEL_WORKERS = 4                    # Parallel execution (adjust based on CI runner cores)
TIMEOUT_PER_MUTANT = 60                 # 60s timeout per mutant
CACHE_DIR = ".mutmut-tmp/cache"         # Incremental mode cache

# Reporting
REPORTERS = [
    "json",         # JSON for CI/CD parsing
    "html",         # HTML report for local development
    "sqlite",       # SQLite database for Grafana
]

# Output files
OUTPUT_JSON = "mutmut-report.json"
OUTPUT_HTML = "mutmut-report.html"
OUTPUT_SQLITE = ".mutmut-tmp/mutmut-results.db"

# Ignore specific procedures (no business logic)
IGNORE_PROCEDURES = [
    r".*\.Log\b",           # Logging procedures
    r".*\.Debug\b",         # Debug procedures
    r".*\.Trace\b",         # Trace procedures
    r".*\.Put_Line\b",      # Console output
    r".*\.Put\b",           # Console output
]

# Week 3 POC requirements:
# 1. Validate that Ada source can be parsed and mutated
# 2. Verify AUnit tests can be run per mutant
# 3. Ensure <2min for typical PR (10-20 Ada files)
# 4. If POC fails: Document fallback plan (skip Ada mutation testing)

# Fallback plan (if POC fails):
FALLBACK = {
    "skip_ada_mutation_testing": True,
    "reason": "No mature Ada mutation testing tool available",
    "workaround": "Manual code review for Ada, focus mutation testing on C++/TypeScript",
    "future_work": "Develop custom Ada mutation testing tool (post-Week 24)",
}

# CI/CD integration
CI_MODE = True                          # Enable CI-specific behavior
CI_FAIL_ON_THRESHOLD = True             # Fail build if below threshold
CI_UPLOAD_TO_DASHBOARD = True           # Upload results to Grafana

# Dashboard configuration
DASHBOARD_URL = "https://grafana.refactorteam.local"
DASHBOARD_PROJECT = "refactor-team/testing-infrastructure"
DASHBOARD_MODULE = "ada-services"

# Week 3 validation: Ensure <2min for typical PR (10-20 files)
# Monitor: Grafana dashboard tracks mutation testing duration
