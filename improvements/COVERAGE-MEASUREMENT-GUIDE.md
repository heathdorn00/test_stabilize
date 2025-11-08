# Coverage Measurement Guide for PolyORB

**Purpose**: Measure test coverage for memory management procedures
**Tools**: gcov, gnatcov, lcov
**Target**: Allocate_Content and Deallocate_Content in polyorb-any.adb
**Author**: @test_stabilize
**Date**: 2025-11-07

---

## Executive Summary

This guide provides complete instructions for measuring code coverage in the PolyORB Ada codebase, specifically targeting the **CRITICAL 0% coverage gap** in memory management procedures.

**Coverage Tools**:
1. **gcov** - GCC's code coverage tool (primary)
2. **gnatcov** - Ada-specific coverage tool (alternative)
3. **lcov** - HTML report generation (optional)

**Measurement Strategy**:
- Line coverage: Which lines executed
- Branch coverage: Which branches taken
- Function coverage: Which functions called
- Focus: `Allocate_Content` and `Deallocate_Content` procedures

---

## Tool Selection Matrix

| Tool | Pros | Cons | Recommendation |
|------|------|------|----------------|
| **gcov** | Built-in with GCC, widely used, good integration | Less Ada-specific | ✅ **Primary choice** |
| **gnatcov** | Ada-optimized, better Ada constructs | Requires separate install | ⚠️ **Alternative** |
| **lcov** | Beautiful HTML reports, CI/CD friendly | Requires gcov data | ✅ **Use for reports** |

**Decision**: Use **gcov** as primary tool, with **lcov** for HTML report generation.

---

## Part 1: Installation

### Option A: gcov (Recommended)

**Linux (Debian/Ubuntu)**:
```bash
# gcov comes with gcc
sudo apt-get update
sudo apt-get install gcc-13 build-essential

# Verify installation
gcov --version
# Expected: gcov (GCC) 13.x.x
```

**macOS**:
```bash
# Using Homebrew
brew install gcc@13

# Verify installation
/opt/homebrew/bin/gcov-13 --version
```

**Verification**:
```bash
which gcov
gcov --help | head -n 5
```

### Option B: gnatcov (Alternative)

**Installation**:
```bash
# Download from AdaCore GNAT Community
# https://www.adacore.com/community

# Or build from source
git clone https://github.com/AdaCore/gnatcoverage.git
cd gnatcoverage
make
sudo make install

# Verify
gnatcov --version
```

### Option C: lcov (HTML Reports)

**Linux**:
```bash
sudo apt-get install lcov

# Verify
lcov --version
# Expected: lcov: LCOV version 1.x
```

**macOS**:
```bash
brew install lcov

# Verify
lcov --version
```

---

## Part 2: GPRbuild Configuration

### Step 1: Update Project File

**File**: `testsuite/polyorb_tests.gpr`

```ada
with "aunit";
with "polyorb";

project PolyORB_Tests is

   for Source_Dirs use ("core/any", "core/orb");
   for Object_Dir use "obj";
   for Exec_Dir use "bin";
   for Main use ("test_runner.adb");

   -- Coverage-enabled compiler flags
   package Compiler is
      for Default_Switches ("Ada") use
         ("-gnatwa",              -- All warnings
          "-gnatwe",              -- Warnings as errors (optional)
          "-gnaty",               -- Style checks
          "-gnat2022",            -- Ada 2022 mode
          "-g",                   -- Debug info (required for coverage)
          "-O0",                  -- No optimization (for accurate coverage)
          "-fprofile-arcs",       -- Generate arc profiling info
          "-ftest-coverage");     -- Generate test coverage data
   end Compiler;

   -- Coverage-enabled linker flags
   package Linker is
      for Default_Switches ("Ada") use
         ("-fprofile-arcs",       -- Link arc profiling
          "-lgcov");              -- Link gcov library
   end Linker;

   -- Coverage-specific binder options
   package Binder is
      for Default_Switches ("Ada") use ("-E");  -- Store exception info
   end Binder;

end PolyORB_Tests;
```

### Step 2: Update Main PolyORB Project (Optional)

If testing against main PolyORB source:

**File**: `src/polyorb.gpr`

```ada
project PolyORB is

   type Build_Type is ("Debug", "Release", "Coverage");
   Build : Build_Type := external ("BUILD", "Debug");

   package Compiler is
      case Build is
         when "Coverage" =>
            for Default_Switches ("Ada") use
               ("-g", "-O0", "-fprofile-arcs", "-ftest-coverage");
         when others =>
            for Default_Switches ("Ada") use ("-g", "-O2");
      end case;
   end Compiler;

   package Linker is
      case Build is
         when "Coverage" =>
            for Default_Switches ("Ada") use ("-fprofile-arcs", "-lgcov");
         when others =>
            for Default_Switches ("Ada") use ();
      end case;
   end Linker;

end PolyORB;
```

---

## Part 3: Building with Coverage

### Clean Build

```bash
# Navigate to PolyORB repository
cd /path/to/PolyORB

# Clean previous builds
rm -rf testsuite/obj testsuite/bin
rm -f src/**/*.gcda src/**/*.gcno  # Remove old coverage data

# Verify clean state
ls -la testsuite/obj
# Should show: No such file or directory
```

### Build with Coverage

```bash
# Build test suite with coverage enabled
gprbuild -P testsuite/polyorb_tests.gpr -XBUILD=Coverage

# Verify coverage instrumentation files created
find . -name "*.gcno" | head -n 5
# Expected output:
# ./src/polyorb/polyorb-any.gcno
# ./testsuite/obj/test_memory_management.gcno
# ... more files

# Verify test runner built
ls -lh testsuite/bin/test_runner
# Expected: Executable file with recent timestamp
```

### Troubleshooting Build Issues

**Issue 1: "cannot find -lgcov"**
```bash
# Solution: Install libgcov
sudo apt-get install libgcc-13-dev  # Linux
brew install gcc@13                  # macOS

# Verify libgcov.a exists
find /usr -name "libgcov.a" 2>/dev/null
```

**Issue 2: "fprofile-arcs: command not found"**
```bash
# Solution: Update GCC
gcc --version  # Should be 7.0 or higher

# Install newer GCC if needed
sudo apt-get install gcc-13
```

**Issue 3: Warnings during build**
```bash
# Warnings like "instrumentation mismatch" are OK during development
# To suppress:
gprbuild -P testsuite/polyorb_tests.gpr -XBUILD=Coverage -ws
```

---

## Part 4: Running Tests and Generating Coverage Data

### Run Test Suite

```bash
# Execute tests (generates .gcda files)
cd testsuite
./bin/test_runner

# Expected output:
# Memory Management Tests (Phase 1: 10 tests)
# 1.1: Allocate Primitive TypeCode       : PASS
# ... (10 tests)
# 10 tests run: 10 passed, 0 failed
```

### Verify Coverage Data Created

```bash
# Check for .gcda files (runtime coverage data)
find . -name "*.gcda" | head -n 5
# Expected:
# ./obj/test_memory_management.gcda
# ../src/polyorb/polyorb-any.gcda
# ... more files

# Verify .gcda file size (should be non-zero)
ls -lh obj/*.gcda
```

---

## Part 5: Generating Coverage Reports

### Method 1: gcov Command-Line Report

```bash
# Navigate to source directory
cd ../src/polyorb

# Generate coverage report for polyorb-any.adb
gcov polyorb-any.adb --object-directory ../../testsuite/obj/

# Expected output:
# File 'polyorb-any.adb'
# Lines executed:18.32% of 4302
# Creating 'polyorb-any.adb.gcov'
```

### Method 2: Focused Coverage (Memory Management Only)

```bash
# Generate coverage and filter for target procedures
gcov polyorb-any.adb --object-directory ../../testsuite/obj/ | \
  grep -A 10 "Allocate_Content\|Deallocate_Content"

# Expected output (Phase 1):
# Allocate_Content: 15-20% coverage
# Lines executed: 8 of 45
# Branches executed: 3 of 12
#
# Deallocate_Content: 15-20% coverage
# Lines executed: 9 of 48
# Branches executed: 4 of 15
```

### Method 3: HTML Report with lcov

```bash
# Capture coverage data
lcov --capture \
     --directory ../src/polyorb \
     --directory testsuite/obj \
     --output-file coverage.info

# Filter out system files
lcov --remove coverage.info '/usr/*' '/opt/*' \
     --output-file coverage_filtered.info

# Generate HTML report
genhtml coverage_filtered.info \
        --output-directory coverage_html \
        --title "PolyORB Memory Management Coverage" \
        --legend \
        --show-details

# View report
open coverage_html/index.html  # macOS
xdg-open coverage_html/index.html  # Linux

# Or serve via HTTP
cd coverage_html
python3 -m http.server 8080
# Navigate to: http://localhost:8080
```

---

## Part 6: Analyzing Coverage Results

### Reading gcov Output

**Example Output**:
```
File 'polyorb-any.adb'
Lines executed:18.32% of 4302
Branches executed:12.45% of 1247
Taken at least once:8.21% of 1247
Calls executed:25.67% of 354
Creating 'polyorb-any.adb.gcov'
```

**Interpretation**:
- **Lines executed: 18.32%** - About 788 of 4,302 lines executed
- **Branches executed: 12.45%** - Only 155 of 1,247 branches taken
- **Calls executed: 25.67%** - 91 of 354 procedure calls executed

### Finding Uncovered Lines

**View .gcov file**:
```bash
# Open annotated source
less polyorb-any.adb.gcov

# Look for line prefixes:
#   #####:  123:   -- Line never executed
#      42:  124:   -- Line executed 42 times
#       -:  125:   -- Non-executable line (comment, declaration)
```

**Example annotated code**:
```ada
    #####:  567:   procedure Allocate_Content (Acc : out Content_Ptr; TC : TypeCode) is
        -:  568:   begin
       10:  569:      if TC = null then          -- ✓ Executed (10 times)
    #####:  570:         raise Constraint_Error;  -- ✗ Never executed
        -:  571:      end if;
       10:  572:      Acc := new Content;        -- ✓ Executed
    #####:  573:      -- More lines...
```

### Interpreting Branch Coverage

**Branch notation in .gcov**:
```ada
branch  0 taken 10   -- True branch taken 10 times
branch  1 taken 0    -- False branch never taken
```

**Example**:
```ada
       10:  569:      if TC = null then
branch  0 taken 0    -- TC = null never true
branch  1 taken 10   -- TC /= null taken 10 times
```

### Coverage Gaps to Investigate

**Priority 1 (Must Cover)**:
- Exception handling paths (`#####: raise`)
- Error conditions (`#####: when Constraint_Error`)
- NULL checks (`#####: if X = null`)
- Boundary conditions (`#####: if Count = 0`)

**Priority 2 (Should Cover)**:
- Alternative branches (if/elsif/else)
- Loop exit conditions
- Case statement alternatives

**Priority 3 (Nice to Cover)**:
- Cold paths (rarely executed in production)
- Debugging code (pragma Debug)
- Assertion checks (pragma Assert)

---

## Part 7: CI/CD Integration

### GitHub Actions Workflow

**File**: `.github/workflows/coverage.yml`

```yaml
name: Coverage Analysis

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  coverage:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v3

      - name: Install dependencies
        run: |
          sudo apt-get update
          sudo apt-get install -y gnat-13 gprbuild lcov

      - name: Build with coverage
        run: |
          cd testsuite
          gprbuild -P polyorb_tests.gpr -XBUILD=Coverage

      - name: Run tests
        run: |
          cd testsuite
          ./bin/test_runner

      - name: Generate coverage report
        run: |
          cd testsuite
          lcov --capture --directory . --directory ../src \
               --output-file coverage.info
          lcov --remove coverage.info '/usr/*' --output-file coverage_filtered.info
          genhtml coverage_filtered.info --output-directory coverage_html

      - name: Check coverage thresholds
        run: |
          cd testsuite
          COVERAGE=$(lcov --summary coverage_filtered.info 2>&1 | \
                     grep "lines" | awk '{print $2}' | sed 's/%//')
          echo "Coverage: $COVERAGE%"

          if (( $(echo "$COVERAGE < 15.0" | bc -l) )); then
            echo "❌ Coverage $COVERAGE% is below 15% minimum (Phase 1)"
            exit 1
          else
            echo "✅ Coverage $COVERAGE% meets Phase 1 minimum"
          fi

      - name: Upload coverage report
        uses: actions/upload-artifact@v3
        with:
          name: coverage-report
          path: testsuite/coverage_html

      - name: Upload coverage to Codecov (optional)
        uses: codecov/codecov-action@v3
        with:
          file: testsuite/coverage_filtered.info
          fail_ci_if_error: false
```

### Coverage Badge (Optional)

Add to README.md:
```markdown
![Coverage](https://img.shields.io/codecov/c/github/heathdorn00/PolyORB)
```

---

## Part 8: Baseline Measurement

### Measuring Current Coverage (Phase 1)

```bash
# Run complete measurement workflow
cd /path/to/PolyORB/testsuite

# 1. Clean previous data
rm -f obj/*.gcda ../src/polyorb/*.gcda

# 2. Run tests
./bin/test_runner

# 3. Generate focused coverage report
cd ../src/polyorb
gcov polyorb-any.adb --object-directory ../../testsuite/obj/

# 4. Extract memory management coverage
grep -A 5 "procedure Allocate_Content" polyorb-any.adb.gcov | head -n 20
grep -A 5 "procedure Deallocate_Content" polyorb-any.adb.gcov | head -n 20

# 5. Calculate coverage percentage
# Count executed lines (anything with a number prefix)
EXECUTED=$(grep "^[[:space:]]*[0-9]" polyorb-any.adb.gcov | wc -l)
TOTAL=$(grep -v "^[[:space:]]*-:" polyorb-any.adb.gcov | wc -l)
echo "Coverage: $EXECUTED / $TOTAL = $(bc <<< "scale=2; $EXECUTED * 100 / $TOTAL")%"
```

### Expected Phase 1 Results

**Allocate_Content Coverage**:
```
Procedure: Allocate_Content (lines 567-612, ~45 lines)
Lines executed: 8-9 of 45 (15-20%)
Branches executed: 3 of 12 (25%)
Paths covered:
  ✓ Normal allocation (TC_Long)
  ✓ Normal allocation (TC_String)
  ✓ Normal allocation (TC_Struct/TC_Sequence/TC_Array)
  ✗ Allocation with invalid TypeCode
  ✗ Allocation failure (OOM)
  ✗ Edge cases (zero-size, max-size)
```

**Deallocate_Content Coverage**:
```
Procedure: Deallocate_Content (lines 654-702, ~48 lines)
Lines executed: 9-10 of 48 (15-20%)
Branches executed: 4 of 15 (27%)
Paths covered:
  ✓ Normal deallocation (primitive types)
  ✓ Deallocation with string content
  ✓ Deallocation with aggregate content
  ✗ Double-free prevention
  ✗ NULL pointer safety
  ✗ Corrupted pointer handling
```

### Baseline Documentation

**File**: `testsuite/coverage_baseline.md`

```markdown
# Coverage Baseline - Memory Management

**Date**: 2025-11-07
**Phase**: 1 (10 tests)
**Author**: @test_stabilize

## Baseline Measurements

### Allocate_Content
- Lines: 15.6% (7/45)
- Branches: 25.0% (3/12)
- Test cases: 5

### Deallocate_Content
- Lines: 18.8% (9/48)
- Branches: 26.7% (4/15)
- Test cases: 5

## Target (End of Day 2)

### Allocate_Content
- Lines: 80%+ (36+/45)
- Branches: 75%+ (9+/12)
- Test cases: 25

### Deallocate_Content
- Lines: 80%+ (38+/48)
- Branches: 75%+ (11+/15)
- Test cases: 25
```

---

## Part 9: Troubleshooting

### Issue 1: No .gcda files generated

**Symptoms**:
```bash
find . -name "*.gcda"
# No results
```

**Causes & Solutions**:
1. **Tests not run**: Execute `./bin/test_runner`
2. **Build without coverage flags**: Rebuild with `-fprofile-arcs -ftest-coverage`
3. **Premature exit**: Tests crashed before writing coverage data
   - Check test output for errors
   - Add exception handlers

### Issue 2: "gcov: cannot open data file"

**Symptoms**:
```bash
gcov polyorb-any.adb
# gcov: polyorb-any.gcno: cannot open data file
```

**Solutions**:
```bash
# Specify object directory explicitly
gcov polyorb-any.adb --object-directory ../../testsuite/obj/

# Or run from object directory
cd testsuite/obj
gcov ../../src/polyorb/polyorb-any.adb
```

### Issue 3: Coverage shows 0% but tests pass

**Symptoms**:
- All tests pass
- Coverage report shows 0% or very low coverage

**Causes**:
1. **Wrong source file**: Measuring wrong version
   - Solution: Verify paths match build
2. **Inlined functions**: Compiler optimized away code
   - Solution: Build with `-O0` (no optimization)
3. **Multiple .gcda files**: Old data interfering
   - Solution: `rm -f **/*.gcda` before running tests

### Issue 4: Branch coverage shows "never executed"

**Symptoms**:
```
branch  0 taken 0
branch  1 taken 0
```

**Investigation**:
```ada
-- Example code:
if Condition then    -- Both branches show "taken 0"
   Do_Something;
end if;
```

**Possible causes**:
1. Condition never evaluated (dead code)
2. Code path not reached by tests
3. Compiler optimization eliminated branch

**Solution**: Add test case specifically for this condition

---

## Part 10: Quick Reference

### Essential Commands

```bash
# Build with coverage
gprbuild -P polyorb_tests.gpr -XBUILD=Coverage

# Run tests
./bin/test_runner

# Generate report
gcov polyorb-any.adb --object-directory ../../testsuite/obj/

# View coverage
less polyorb-any.adb.gcov

# Clean coverage data
rm -f **/*.gcda **/*.gcno
```

### Coverage Metrics Interpretation

| Metric | Good | Acceptable | Poor |
|--------|------|------------|------|
| **Line Coverage** | >80% | 60-80% | <60% |
| **Branch Coverage** | >75% | 50-75% | <50% |
| **Function Coverage** | >90% | 70-90% | <70% |

### Phase Targets

| Phase | Line Coverage | Branch Coverage | Test Count |
|-------|--------------|-----------------|------------|
| **Phase 1** (Day 1) | 15-20% | 25-30% | 10 tests |
| **Phase 2** (Day 2 AM) | 50-60% | 50-60% | 30 tests |
| **Phase 3** (Day 2 PM) | 80%+ | 75%+ | 50+ tests |

---

## Appendix A: gcov Output Format

### Line Prefix Meanings

```
       -:    0:Source:polyorb-any.adb
       -:    1:-- Package specification
       -:    2:
      10:   45:   if Condition then
   #####:   46:      raise Error;      -- Never executed
      10:   47:   end if;              -- Executed 10 times
```

**Prefixes**:
- `-:` - Non-executable line (comment, blank, declaration)
- `#####:` - Executable but never executed (0 times)
- `N:` - Executed N times

### Branch Information

```
branch  0 taken 7
branch  1 taken 3
call    0 returned 10
```

**Meanings**:
- `branch 0 taken 7` - True branch taken 7 times
- `branch 1 taken 3` - False branch taken 3 times
- `call 0 returned 10` - Function call returned successfully 10 times

---

## Appendix B: Alternative Tools

### Using gnatcov (Ada-specific)

```bash
# Instrument build
gnatcov instrument \
   --level=stmt+decision \
   --dump-trigger=atexit \
   -P polyorb_tests.gpr

# Build instrumented code
gprbuild -P polyorb_tests.gpr --src-subdirs=gnatcov-instr

# Run tests
./bin/test_runner

# Generate report
gnatcov coverage \
   --level=stmt+decision \
   --annotate=html \
   *.srctrace \
   -P polyorb_tests.gpr
```

### Using Codecov Service

```bash
# Install codecov uploader
curl -Os https://uploader.codecov.io/latest/linux/codecov
chmod +x codecov

# Upload coverage
./codecov -f coverage_filtered.info -t <CODECOV_TOKEN>
```

---

**Document Status**: ✅ Complete
**Tool**: gcov (primary), lcov (HTML), gnatcov (alternative)
**Integration**: Ready for CI/CD
**Author**: @test_stabilize
**Date**: 2025-11-07
