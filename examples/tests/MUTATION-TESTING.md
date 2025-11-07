# Mutation Testing Guide

**Task**: 57fbde - Comprehensive Test Framework / RDB-002
**Purpose**: Validate test quality through mutation analysis

---

## Overview

**Mutation Testing** validates the quality of tests by introducing small code changes (mutations) and checking if tests catch them. Surviving mutations indicate gaps in test coverage or weak assertions.

**Why Mutation Testing?**
- Code coverage (lines/branches) measures **what code is executed**, not **what is tested**
- Mutation testing measures **test effectiveness** by validating tests catch bugs
- High coverage + low mutation score = weak tests

**Tools**:
- **Stryker** - JavaScript/TypeScript (contract tests)
- **Mull** - C++ (unit/component tests for wxWidgets services)
- **mutmut** - Python (integration tests)

---

## Quick Start

### JavaScript/TypeScript (Stryker)

```bash
# Install Stryker
npm install --save-dev \
  @stryker-mutator/core \
  @stryker-mutator/jest-runner \
  @stryker-mutator/typescript-checker

# Run mutation testing
npx stryker run

# View HTML report
open reports/mutation/stryker-report.html
```

### C++ (Mull)

```bash
# Install Mull (macOS)
brew install mull-project/mull/mull

# Build tests
cd ../../services/wxwidgets
make build-tests

# Run mutation testing
cd tests
mull-cxx-17 --config mull.yml

# View HTML report
open reports/mutation/cpp/mull-report.html
```

### Python (mutmut)

```bash
# Install mutmut
pip install mutmut

# Run mutation testing
mutmut run

# View results
mutmut results

# Generate HTML report
mutmut html
open html/index.html
```

---

## How Mutation Testing Works

### 1. Mutate Code

Original code:
```python
def calculate_total(price, quantity):
    return price * quantity
```

Mutation 1 (Arithmetic Operator):
```python
def calculate_total(price, quantity):
    return price + quantity  # * → +
```

Mutation 2 (Number Literal):
```python
def calculate_total(price, quantity):
    return price * (quantity + 1)  # quantity → quantity + 1
```

### 2. Run Tests

For each mutation:
- Run test suite
- Check if tests fail

### 3. Classify Mutations

- **Killed**: Test failed (mutation caught) ✅
- **Survived**: Test passed (mutation not caught) ❌
- **Timeout**: Test hung (possible infinite loop) ⚠️
- **Covered**: Mutation in covered code
- **No Coverage**: Mutation in uncovered code

### 4. Calculate Score

```
Mutation Score = (Killed / Total) * 100
```

**Target Scores**:
- Unit tests: ≥80%
- Component tests: ≥70%
- Contract tests: ≥70%
- Integration tests: ≥60%

---

## Stryker (JavaScript/TypeScript)

### Configuration

**File**: `stryker.conf.json`

**Key Settings**:
```json
{
  "mutate": [
    "contracts/consumers/**/*.ts",
    "!contracts/consumers/**/*.spec.ts"
  ],
  "testRunner": "jest",
  "coverageAnalysis": "perTest",
  "thresholds": {
    "high": 80,
    "low": 60,
    "break": 50
  },
  "maxConcurrentTestRunners": 4
}
```

### Running Stryker

```bash
# Full mutation testing
npx stryker run

# Incremental (only changed files)
npx stryker run --incremental

# Specific files
npx stryker run --mutate "src/widget_service.ts"

# With concurrency
npx stryker run --concurrency 8

# Dry run (no mutations, just setup validation)
npx stryker run --dryRunOnly
```

### Stryker Reports

**HTML Report**: `reports/mutation/stryker-report.html`
- Interactive dashboard
- Mutation details per file
- Surviving mutations highlighted

**JSON Report**: `reports/mutation/stryker-report.json`
- Machine-readable format
- CI/CD integration

**Clear Text Report**: Console output
```
Mutant survived:
  if (widget.type === 'button') {
- if (widget.type !== 'button') {

Tests ran: TestWidgetCreation
```

### Mutation Operators (Stryker)

| Operator | Example | Mutation |
|----------|---------|----------|
| Arithmetic | `a + b` | `a - b` |
| Equality | `a === b` | `a !== b` |
| Logical | `a && b` | `a \|\| b` |
| String Literal | `"text"` | `""` |
| Number Literal | `5` | `6` |
| Boolean Literal | `true` | `false` |
| Conditional | `a ? b : c` | `false ? b : c` |
| Array | `[1, 2]` | `[]` |

### Package.json Scripts

Add to `package.json`:
```json
{
  "scripts": {
    "mutation": "stryker run",
    "mutation:watch": "stryker run --watch",
    "mutation:incremental": "stryker run --incremental",
    "mutation:ci": "stryker run --reporters json,dashboard"
  },
  "devDependencies": {
    "@stryker-mutator/core": "^7.3.0",
    "@stryker-mutator/jest-runner": "^7.3.0",
    "@stryker-mutator/typescript-checker": "^7.3.0"
  }
}
```

---

## Mull (C++)

### Configuration

**File**: `mull.yml`

**Key Settings**:
```yaml
mutators:
  - cxx_add_to_sub
  - cxx_eq_to_ne
  - cxx_logical_and_to_or

code_paths:
  - ../../../services/wxwidgets/widget-core/src

test_binaries:
  - ../component/wxwidgets/build/widget_core_tests

test_framework: googletest

timeout:
  test_timeout: 5000
  mutation_timeout_factor: 3

parallelization:
  workers: 4

coverage:
  threshold: 80
```

### Running Mull

```bash
# Full mutation testing
mull-cxx-17 --config mull.yml

# List available mutators
mull-cxx-17 --list-mutators

# Dry run
mull-cxx-17 --config mull.yml --dry-run

# Specific mutators only
mull-cxx-17 --config mull.yml --mutators=cxx_add_to_sub,cxx_eq_to_ne

# List survivors
mull-cxx-17 --config mull.yml --list-survivors

# Incremental (only changed files)
mull-cxx-17 --config mull.yml --incremental

# Export to JSON
mull-cxx-17 --config mull.yml --reporters=json
```

### Mull Reports

**SQLite Database**: `.mull.db`
- Complete mutation results
- Queryable with SQL

**JSON Report**: `reports/mutation/cpp/mull-report.json`
```json
{
  "mutation_score": 75.5,
  "total_mutations": 423,
  "killed": 320,
  "survived": 103,
  "survivors": [
    {
      "file": "widget_core.cpp",
      "line": 42,
      "mutator": "cxx_add_to_sub",
      "original": "width + offset",
      "mutated": "width - offset"
    }
  ]
}
```

**HTML Report**: `reports/mutation/cpp/mull-report.html`

### Mutation Operators (Mull)

| Operator | Code | Original | Mutated |
|----------|------|----------|---------|
| cxx_add_to_sub | `a + b` | `+` | `-` |
| cxx_sub_to_add | `a - b` | `-` | `+` |
| cxx_mul_to_div | `a * b` | `*` | `/` |
| cxx_eq_to_ne | `a == b` | `==` | `!=` |
| cxx_ne_to_eq | `a != b` | `!=` | `==` |
| cxx_lt_to_le | `a < b` | `<` | `<=` |
| cxx_logical_and_to_or | `a && b` | `&&` | `\|\|` |
| negate_mutator | `-x` | `-x` | `x` |
| remove_void_call | `func()` | `func()` | `` |

### GoogleTest Integration

Mull automatically detects GoogleTest:
```cpp
TEST(WidgetCoreTest, CreateWidget) {
  Widget widget = createWidget("button");
  EXPECT_EQ(widget.type, "button");  // Mutation: == to !=
}
```

If mutation `== to !=` survives, test is weak.

---

## mutmut (Python)

### Configuration

**File**: `.mutmut-config.py`

**Key Settings**:
```python
paths_to_mutate = ['integration/']
paths_to_exclude = ['integration/test_*.py']
runner = 'pytest -x -v'
tests_dir = 'integration/'

def pre_mutation(context):
    # Skip test files
    if 'test_' in context.filename:
        context.skip = True
```

### Running mutmut

```bash
# Full mutation testing
mutmut run

# Parallel execution
mutmut run --parallel 4

# Use coverage data (faster)
mutmut run --use-coverage

# Specific paths
mutmut run --paths-to-mutate integration/test_widget_workflow.py

# Show results summary
mutmut results

# Show specific mutation
mutmut show 1

# Generate HTML report
mutmut html
open html/index.html

# Apply mutation (for debugging)
mutmut apply 1

# Reset applied mutation
mutmut reset

# CI mode
CI=true mutmut run --parallel 4
mutmut results --exit-code  # Exit 0 if threshold met
```

### mutmut Reports

**Console Output**:
```
Mutations: 234
Survived: 23
Killed: 211
Timeout: 0
Suspicious: 0

Mutation score: 90.2%
```

**HTML Report**: `html/index.html`
- File-by-file breakdown
- Surviving mutations highlighted
- Test execution details

**Mutation Details**:
```bash
$ mutmut show 42

Survived mutation:
File: integration/test_widget_workflow.py
Line: 156

Original:
    assert response.status_code == 201

Mutated:
    assert response.status_code != 201

Tests ran: test_create_widget_via_api_gateway
Status: Survived (test passed with mutation!)
```

### Mutation Operators (mutmut)

| Operator | Original | Mutated |
|----------|----------|---------|
| Number | `0` | `1` |
| Number | `1` | `0` |
| Number | `x` | `x + 1` |
| String | `"text"` | `"XXtextXX"` |
| Boolean | `True` | `False` |
| Comparison | `<` | `<=` |
| Comparison | `==` | `!=` |
| Arithmetic | `+` | `-` |
| Logical | `and` | `or` |
| Unary | `not x` | `x` |

---

## Baseline Mutation Scores

### Establishing Baselines

**1. Run Initial Mutation Testing**:
```bash
# Stryker (TypeScript)
npx stryker run > baseline-stryker.txt

# Mull (C++)
mull-cxx-17 --config mull.yml > baseline-mull.txt

# mutmut (Python)
mutmut run
mutmut results > baseline-mutmut.txt
```

**2. Record Baseline Scores**:

Create `MUTATION-BASELINE.md`:
```markdown
# Mutation Testing Baseline Scores
Date: 2024-01-15

## Stryker (TypeScript - Contract Tests)
- Total Mutations: 145
- Killed: 102
- Survived: 43
- **Mutation Score**: 70.3%

## Mull (C++ - Component Tests)
- Total Mutations: 423
- Killed: 320
- Survived: 103
- **Mutation Score**: 75.6%

## mutmut (Python - Integration Tests)
- Total Mutations: 234
- Killed: 163
- Survived: 71
- **Mutation Score**: 69.7%
```

**3. Set Improvement Targets**:
```markdown
## Targets (6 months)
- Stryker: 70% → 80%
- Mull: 75% → 85%
- mutmut: 70% → 75%
```

---

## Analyzing Survivors

### Finding Weak Tests

**Example Survivor** (Stryker):
```typescript
// Original
function createWidget(type: string) {
  if (type === 'button') {
    return new ButtonWidget();
  }
  return new GenericWidget();
}

// Mutation (Survived!)
function createWidget(type: string) {
  if (type !== 'button') {  // === changed to !==
    return new ButtonWidget();
  }
  return new GenericWidget();
}
```

**Weak Test**:
```typescript
it('should create button widget', () => {
  const widget = createWidget('button');
  expect(widget).toBeDefined();  // Too vague!
});
```

**Strong Test** (kills mutation):
```typescript
it('should create button widget', () => {
  const widget = createWidget('button');
  expect(widget).toBeInstanceOf(ButtonWidget);  // Specific assertion
  expect(widget.type).toBe('button');
});

it('should create generic widget for unknown type', () => {
  const widget = createWidget('slider');
  expect(widget).toBeInstanceOf(GenericWidget);  // Boundary case
});
```

### Common Survivor Patterns

**1. Weak Assertions**:
```python
# Bad
assert result is not None  # Mutation: True → False survives

# Good
assert result == expected_value
```

**2. Missing Boundary Tests**:
```cpp
// Mutation: < to <= survives
if (count < MAX_COUNT) {
  // No test for count == MAX_COUNT
}
```

**3. Untested Error Paths**:
```typescript
// Mutation: if → if not survives
if (error) {
  throw new Error("Failed");  // No test covers this path
}
```

**4. Dead Code**:
```python
# Mutation survives because code never runs
if DEBUG_MODE:  # Always False in tests
  log_debug(message)
```

---

## CI/CD Integration

### GitHub Actions

**`.github/workflows/mutation-testing.yml`**:
```yaml
name: Mutation Testing

on:
  pull_request:
    branches: [main]
  schedule:
    - cron: '0 2 * * 0'  # Weekly on Sunday

jobs:
  stryker:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm ci

      - name: Run Stryker
        run: npx stryker run --reporters json,dashboard
        env:
          STRYKER_DASHBOARD_API_KEY: ${{ secrets.STRYKER_DASHBOARD_API_KEY }}

      - name: Check threshold
        run: |
          SCORE=$(jq '.mutationScore' reports/mutation/stryker-report.json)
          if (( $(echo "$SCORE < 70" | bc -l) )); then
            echo "Mutation score $SCORE% below 70% threshold"
            exit 1
          fi

  mull:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Install Mull
        run: |
          wget https://github.com/mull-project/mull/releases/download/v0.18.3/mull-0.18.3-ubuntu-20.04.deb
          sudo dpkg -i mull-0.18.3-ubuntu-20.04.deb

      - name: Build tests
        run: |
          cd services/wxwidgets
          make build-tests

      - name: Run Mull
        run: |
          cd tests
          mull-cxx-17 --config mull.yml --reporters json

      - name: Check threshold
        run: |
          SCORE=$(jq '.mutation_score' tests/reports/mutation/cpp/mull-report.json)
          if (( $(echo "$SCORE < 75" | bc -l) )); then
            echo "Mutation score $SCORE% below 75% threshold"
            exit 1
          fi

  mutmut:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.11'

      - name: Install dependencies
        run: pip install -r requirements-test.txt mutmut

      - name: Run mutmut
        run: |
          cd tests
          CI=true mutmut run --parallel 4

      - name: Check results
        run: |
          cd tests
          mutmut results --exit-code
```

### Pre-commit Hook

**`.git/hooks/pre-commit`**:
```bash
#!/bin/bash
# Run mutation testing on changed files

# Get changed TypeScript files
CHANGED_TS=$(git diff --cached --name-only --diff-filter=ACM | grep '\.ts$' | grep -v '\.spec\.ts$')

if [ -n "$CHANGED_TS" ]; then
  echo "Running Stryker on changed files..."
  npx stryker run --mutate "$CHANGED_TS" --reporters clear-text

  if [ $? -ne 0 ]; then
    echo "Stryker found surviving mutations. Review before committing."
    exit 1
  fi
fi
```

---

## Best Practices

### 1. Start Small

Don't run full mutation testing initially:
```bash
# Start with one file
npx stryker run --mutate "src/widget_service.ts"

# Expand gradually
npx stryker run --mutate "src/*.ts"
```

### 2. Use Incremental Mode

Only mutate changed files:
```bash
# Stryker
npx stryker run --incremental

# Mull
mull-cxx-17 --config mull.yml --incremental

# mutmut
mutmut run --use-coverage
```

### 3. Fix Survivors Systematically

**Workflow**:
1. Run mutation testing
2. Identify top 10 survivors
3. Write tests to kill them
4. Re-run mutation testing
5. Repeat

```bash
# mutmut: Show worst files
mutmut results | grep "Survived" | sort -rn | head -10
```

### 4. Set Realistic Thresholds

Start with current score + 5%:
```json
// stryker.conf.json
{
  "thresholds": {
    "break": 65  // Current score
  }
}
```

Gradually increase:
```json
{
  "thresholds": {
    "break": 70  // After improvements
  }
}
```

### 5. Run Regularly

- **Full run**: Weekly (CI/CD scheduled job)
- **Incremental**: Per PR
- **Baseline**: Monthly (track progress)

### 6. Ignore Trivial Survivors

Some mutations are acceptable:
```typescript
// Getter mutation: x → x + 1
get width() { return this._width; }

// Logging mutation
logger.debug(`Created widget ${id}`);
```

Add to exclusions:
```json
// stryker.conf.json
{
  "mutator": {
    "excludedMutations": ["StringLiteral"]
  }
}
```

---

## Troubleshooting

### Stryker Timeouts

**Error**: `Timeout (60000ms) exceeded`

**Solution**:
```json
{
  "timeoutMS": 120000,
  "timeoutFactor": 2.0
}
```

### Mull Crashes

**Error**: `Segmentation fault`

**Solution**:
```bash
# Reduce parallelization
mull-cxx-17 --config mull.yml --workers 1

# Enable debug mode
mull-cxx-17 --config mull.yml --debug
```

### mutmut Slow Execution

**Error**: Running for hours

**Solution**:
```bash
# Use coverage to skip unmutated code
pytest --cov=integration --cov-report=xml
mutmut run --use-coverage

# Run in parallel
mutmut run --parallel 8
```

### False Positives

**Issue**: Mutation marked as "Survived" but test does catch it

**Solution**:
```bash
# Apply mutation manually
mutmut apply <id>

# Run tests
pytest -v

# If test fails, mutation should be "Killed"
# Report bug to mutmut project
```

---

## Target Scores by Layer

| Layer | Tool | Target Score | Rationale |
|-------|------|--------------|-----------|
| Unit Tests (C++) | Mull | 80-90% | High coverage, isolated logic |
| Component Tests (C++) | Mull | 70-80% | Complex interactions |
| Contract Tests (TS) | Stryker | 70-80% | API contracts well-defined |
| Integration Tests (Py) | mutmut | 60-70% | Multi-service, harder to isolate |
| E2E Tests | N/A | N/A | Too slow for mutation testing |

---

## References

- [Stryker Mutator](https://stryker-mutator.io/)
- [Mull Project](https://github.com/mull-project/mull)
- [mutmut](https://github.com/boxed/mutmut)
- [Mutation Testing: A Comprehensive Guide](https://pedrorijo.com/blog/intro-mutation/)
- [Testing the Tests with Mutation Testing](https://thevaluable.dev/mutation-testing-works/)

---

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
