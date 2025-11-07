"""
Mutmut Mutation Testing Configuration - Python (Integration Tests)
Task: 57fbde - Comprehensive Test Framework / RDB-002
Layer 4: Integration Tests (Python mutation testing)

This configuration defines mutation testing settings for Python integration tests.
"""

# ==============================================================================
# Mutmut Configuration
# ==============================================================================

def pre_mutation(context):
    """
    Hook called before each mutation.
    Can be used to skip certain mutations or modify context.
    """
    # Skip mutations in test files
    if context.filename.endswith('_test.py') or 'test_' in context.filename:
        context.skip = True

    # Skip mutations in conftest.py
    if context.filename.endswith('conftest.py'):
        context.skip = True

    # Skip mutations in __init__.py files
    if context.filename.endswith('__init__.py'):
        context.skip = True


def post_mutation(context):
    """
    Hook called after each mutation.
    Can be used for custom reporting or cleanup.
    """
    pass


# ==============================================================================
# Paths Configuration
# ==============================================================================

# Paths to mutate (relative to project root)
paths_to_mutate = [
    'integration/',
]

# Paths to exclude from mutation
paths_to_exclude = [
    'integration/*_test.py',
    'integration/test_*.py',
    'integration/conftest.py',
    'integration/__pycache__/',
    'integration/.pytest_cache/',
]

# ==============================================================================
# Test Runner Configuration
# ==============================================================================

# Test command to run after each mutation
# mutmut will automatically replace this with per-test commands
runner = 'pytest -x -v'

# Test directories
tests_dir = 'integration/'

# ==============================================================================
# Mutation Operators
# ==============================================================================

# mutmut applies these mutation operators by default:
#
# 1. Number mutations:
#    - 0 → 1, 1 → 0
#    - number → number + 1, number → number - 1
#
# 2. String mutations:
#    - "string" → "XXstringXX"
#    - "" → "XX"
#
# 3. Boolean mutations:
#    - True → False, False → True
#
# 4. Comparison operators:
#    - < → <=, <= → <
#    - > → >=, >= → >
#    - == → !=, != → ==
#
# 5. Arithmetic operators:
#    - + → -, - → +
#    - * → /, / → *
#    - // → /, % → /
#
# 6. Logical operators:
#    - and → or, or → and
#
# 7. Unary operators:
#    - not x → x
#    - -x → x
#
# 8. Decorator mutations:
#    - Remove decorators
#
# 9. Keyword argument mutations:
#    - kwarg=value → kwarg=None

# ==============================================================================
# Reporting Configuration
# ==============================================================================

# Output formats
# mutmut results are stored in .mutmut-cache
# Use: mutmut results to view summary
# Use: mutmut show <mutation_id> to view specific mutation

# ==============================================================================
# CI/CD Integration
# ==============================================================================

# Environment-specific settings
import os

CI_MODE = os.getenv('CI', 'false').lower() == 'true'

if CI_MODE:
    # In CI: Use stricter settings
    # Fail fast on first mutation that survives
    runner = 'pytest -x --tb=short'
else:
    # Local development: More verbose output
    runner = 'pytest -x -v --tb=short'

# ==============================================================================
# Performance Settings
# ==============================================================================

# Number of parallel workers (0 = auto)
# Set in command line: mutmut run --parallel <workers>
parallel_workers = 4 if CI_MODE else 2

# ==============================================================================
# Mutation Score Targets
# ==============================================================================

# Target mutation score: 70% for integration tests
# (Lower than unit tests due to integration test complexity)
#
# Mutation Score = (Killed Mutations / Total Mutations) * 100
#
# Good:     70-100% - High quality integration tests
# Fair:     50-70%  - Moderate quality, some gaps
# Improve:  0-50%   - Low quality, needs significant improvement

TARGET_MUTATION_SCORE = 70

# ==============================================================================
# Mutmut Cache Settings
# ==============================================================================

# Cache directory for mutation results
cache_dir = '.mutmut-cache'

# ==============================================================================
# Custom Mutation Filters
# ==============================================================================

def filter_mutation(context):
    """
    Custom filter to skip certain mutations.
    Return True to apply mutation, False to skip.
    """
    # Skip mutations in logging statements
    if 'logging' in context.current_source_line or 'logger' in context.current_source_line:
        return False

    # Skip mutations in print statements (for debugging)
    if 'print(' in context.current_source_line:
        return False

    # Skip mutations in assertions (we're testing the code, not the tests)
    if 'assert ' in context.current_source_line:
        return False

    # Skip mutations in fixture setup/teardown
    if '@pytest.fixture' in context.current_source_line:
        return False

    # Apply all other mutations
    return True

# ==============================================================================
# Usage Instructions
# ==============================================================================
#
# 1. Install mutmut:
#    pip install mutmut
#
# 2. Run mutation testing:
#    cd examples/tests
#    mutmut run
#
# 3. View results:
#    mutmut results
#
# 4. View specific mutation:
#    mutmut show <mutation_id>
#
# 5. View HTML report:
#    mutmut html
#    open html/index.html
#
# 6. Apply a specific mutation (for debugging):
#    mutmut apply <mutation_id>
#
# 7. Run specific tests for a mutation:
#    mutmut run --test-specific
#
# 8. Use cached results (incremental):
#    mutmut run --use-coverage
#
# 9. Parallel execution:
#    mutmut run --parallel 4
#
# 10. CI/CD integration:
#     CI=true mutmut run --parallel 4
#     mutmut results --exit-code
#
# ==============================================================================
# Interpreting Results
# ==============================================================================
#
# Mutation Status:
# - Killed:    Test caught the mutation (good!)
# - Survived:  Test did not catch the mutation (bad - test gap)
# - Timeout:   Test took too long (possible infinite loop)
# - Suspicious: Test behaved differently but didn't fail (check manually)
# - Skipped:   Mutation was skipped (filter or exclusion)
#
# Mutation Score:
#   (Killed / (Killed + Survived + Timeout)) * 100
#
# Survivors indicate gaps in test coverage or test quality issues.
#
# ==============================================================================
