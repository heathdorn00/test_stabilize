# Mutation Testing Usage Guide
## PolyORB Memory Management - Day 3

**Date**: 2025-11-07
**Author**: @test_stabilize
**Context**: RDB-004 Task 6 Pre-Work - Mutation Testing Implementation

---

## Quick Start

### 1. Generate Mutants (Dry Run)

```bash
cd /path/to/polyorb-refactor/improvements
python3 generate_mutants.py polyorb-any.adb -o mutants -n 20
```

**Output**:
```
================================================================================
Ada Mutation Testing for PolyORB
================================================================================

[1/4] Generating mutants from polyorb-any.adb...
      Generated 20 mutants

[2/4] Saving mutants to mutants...
      Saved 20 mutant files

[3/4] Mutant Distribution:
      memory              :   5 mutants
      ref_count           :   4 mutants
      exception           :   3 mutants
      relational          :   3 mutants
      logical             :   2 mutants
      ada_attribute       :   2 mutants
      constant            :   1 mutants

[4/4] Skipping testing (no build directory provided)
```

### 2. Run Full Mutation Testing

```bash
# Assuming build directory is ../polyorb/build
python3 generate_mutants.py polyorb-any.adb \
  -o mutants \
  -b ../polyorb/build \
  -n 50
```

**Output**:
```
[4/4] Testing mutants against test suite...
      Mutant   1 [memory      ] ✓ KILLED          - Line 1247: Deallocate → (removed) [MEMORY LEAK]
      Mutant   2 [memory      ] ✓ KILLED          - Line 1253: new T → null [NULL POINTER]
      Mutant   3 [ref_count   ] ✓ KILLED          - Line 892: +1 → +2 [REF COUNT ERROR]
      Mutant   4 [ref_count   ] ✓ KILLED          - Line 1255: -1 → -2 [REF COUNT ERROR]
      Mutant   5 [exception   ] ✗ SURVIVED        - Line 567: raise → (removed) [ERROR MASKING]
      ...

================================================================================
MUTATION TESTING SUMMARY
================================================================================
Total Mutants:       50
Killed:               45 ( 90.0%)
Survived:              3 (  6.0%) ⚠️
Compile Errors:        2
Timeouts:              0

================================================================================
MUTATION SCORE:      93.8% (45/48)
================================================================================

⚠️  SURVIVING MUTANTS (Test Quality Gaps):
   Mutant   5: Line 567: raise → (removed) [ERROR MASKING]
              Category: exception, Priority: HIGH
   Mutant  17: Line 789: > → >= [BOUNDARY]
              Category: relational, Priority: HIGH
   Mutant  23: Line 1023: and → or [LOGIC ERROR]
              Category: logical, Priority: HIGH
```

---

## Manual Mutation Testing (10 Critical Mutants)

### Why Manual Mutations?

**Pros**:
- ✅ Surgical precision on critical paths
- ✅ No tooling dependencies
- ✅ Educational for team
- ✅ Immediate validation of test quality

**Process**: Create mutants manually, run tests, verify detection.

---

## Critical Mutant #1: Skip Deallocate (MEMORY LEAK)

### Location
`polyorb-any.adb:1247` (Finalize procedure)

### Original Code
```ada
procedure Finalize (Object : in out Any) is
begin
   if Object.Container /= null then
      if Object.Container.Ref_Count > 0 then
         Object.Container.Ref_Count := Object.Container.Ref_Count - 1;
      end if;

      if Object.Container.Ref_Count = 0 then
         Deallocate (Object.Container);  -- ← TARGET LINE
      end if;
   end if;
end Finalize;
```

### Mutant Code
```ada
procedure Finalize (Object : in out Any) is
begin
   if Object.Container /= null then
      if Object.Container.Ref_Count > 0 then
         Object.Container.Ref_Count := Object.Container.Ref_Count - 1;
      end if;

      if Object.Container.Ref_Count = 0 then
         -- Deallocate (Object.Container);  -- MUTANT: Skip deallocation (MEMORY LEAK)
         null;
      end if;
   end if;
end Finalize;
```

### Expected Test Outcome
**KILLED** by `Test_No_Leaks_Primitive` (Phase 2, Category 8)

**Reason**: Test allocates 1,000 Any objects in a loop and checks for memory leaks via OS metrics.

**Verification**:
```bash
# 1. Apply mutant
cp polyorb-any.adb polyorb-any.adb.backup
# Edit line 1247 manually
nano polyorb-any.adb

# 2. Compile
gprbuild -Ptest_polyorb.gpr

# 3. Run test
./test_runner

# Expected output:
# Test_No_Leaks_Primitive: FAIL - Memory usage increased by 1.2MB
```

---

## Critical Mutant #2: Double Deallocate (DOUBLE-FREE)

### Location
`polyorb-any.adb:1255` (Finalize procedure)

### Original Code
```ada
if Object.Container.Ref_Count = 0 then
   Deallocate (Object.Container);
end if;
```

### Mutant Code
```ada
if Object.Container.Ref_Count = 0 then
   Deallocate (Object.Container);
   Deallocate (Object.Container);  -- MUTANT: Double-free (SECURITY CRITICAL)
end if;
```

### Expected Test Outcome
**KILLED** by `Test_Double_Free_Prevention` (Phase 2, Category 7)

**Reason**: Test validates that second deallocation is safe (no-op or exception).

**Verification**:
```bash
# Apply mutant and run test
./test_runner

# Expected outcome:
# - Crash with segmentation fault, OR
# - Exception raised (Storage_Error), OR
# - Test detects invalid state

# If test PASSES, we have a CRITICAL test gap!
```

---

## Critical Mutant #3: Skip Ref Count Increment (PREMATURE DEALLOCATION)

### Location
`polyorb-any.adb:892` (Adjust procedure)

### Original Code
```ada
procedure Adjust (Object : in out Any) is
begin
   if Object.Container /= null then
      Object.Container.Ref_Count := Object.Container.Ref_Count + 1;  -- ← TARGET
   end if;
end Adjust;
```

### Mutant Code
```ada
procedure Adjust (Object : in out Any) is
begin
   if Object.Container /= null then
      -- Object.Container.Ref_Count := Object.Container.Ref_Count + 1;  -- MUTANT
      null;  -- MUTANT: Skip ref count increment (PREMATURE DEALLOCATION)
   end if;
end Adjust;
```

### Expected Test Outcome
**KILLED** by `Test_Copy_Semantics` (Phase 2, Category 9)

**Reason**: Test creates copies and validates each has independent lifecycle.

**Test Code**:
```ada
procedure Test_Copy_Semantics is
   A1, A2 : PolyORB.Any.Any;
begin
   A1 := PolyORB.Any.Get_Empty_Any (TC_Long);
   A2 := A1;  -- Triggers Adjust → Ref_Count should be 2

   -- If ref count not incremented, Finalize(A1) will deallocate
   -- Then accessing A2 causes crash
   declare
      V : PolyORB.Types.Long;
   begin
      V := PolyORB.Any.To_Any (A2);  -- Should succeed
      Assert (V = 0, "Default value");
   end;
end Test_Copy_Semantics;
```

---

## Critical Mutant #4: Skip Ref Count Decrement (MEMORY LEAK)

### Location
`polyorb-any.adb:1250` (Finalize procedure)

### Original Code
```ada
if Object.Container.Ref_Count > 0 then
   Object.Container.Ref_Count := Object.Container.Ref_Count - 1;  -- ← TARGET
end if;
```

### Mutant Code
```ada
if Object.Container.Ref_Count > 0 then
   -- Object.Container.Ref_Count := Object.Container.Ref_Count - 1;  -- MUTANT
   null;  -- MUTANT: Skip decrement (MEMORY LEAK)
end if;
```

### Expected Test Outcome
**KILLED** by `Test_Single_Reference_Lifecycle` (Phase 2, Category 9)

**Reason**: Test validates that single-reference Any objects are deallocated at scope exit.

---

## Critical Mutant #5: Remove NULL Check (CRASH)

### Location
`polyorb-any.adb:567` (Get_Empty_Any function)

### Original Code
```ada
function Get_Empty_Any (TC : TypeCode.Object) return Any is
begin
   if TC = null then  -- ← TARGET
      raise Constraint_Error with "Invalid TypeCode";
   end if;

   return (Ada.Finalization.Controlled with
           Container => new Any_Container'(TC, 0, null));
end Get_Empty_Any;
```

### Mutant Code
```ada
function Get_Empty_Any (TC : TypeCode.Object) return Any is
begin
   -- if TC = null then  -- MUTANT: Removed NULL check
   --    raise Constraint_Error with "Invalid TypeCode";
   -- end if;

   return (Ada.Finalization.Controlled with
           Container => new Any_Container'(TC, 0, null));  -- CRASH if TC = null
end Get_Empty_Any;
```

### Expected Test Outcome
**KILLED** by `Test_Allocate_Invalid_TypeCode` (Phase 2, Category 2)

**Reason**: Test explicitly passes null TypeCode and expects Constraint_Error.

---

## Critical Mutant #6: Invert Type Check (TYPE SAFETY VIOLATION)

### Location
`polyorb-any.adb:789` (From_Any procedure)

### Original Code
```ada
procedure From_Any (A : Any; Val : out PolyORB.Types.Long) is
begin
   if Get_Type (A) /= TC_Long then  -- ← TARGET
      raise Constraint_Error with "Type mismatch";
   end if;

   Val := To_Any (A);
end From_Any;
```

### Mutant Code
```ada
procedure From_Any (A : Any; Val : out PolyORB.Types.Long) is
begin
   if Get_Type (A) = TC_Long then  -- MUTANT: Inverted (= instead of /=)
      raise Constraint_Error with "Type mismatch";
   end if;

   Val := To_Any (A);  -- Will crash or return garbage
end From_Any;
```

### Expected Test Outcome
**KILLED** by `Test_Type_Safety_Primitives` (Phase 3, Category 3)

**Reason**: Test validates type checking for all primitive types.

---

## Critical Mutant #7: Boundary Mutation (> to >=)

### Location
`polyorb-any.adb:1023` (Is_Valid_Index function)

### Original Code
```ada
function Is_Valid_Index (Seq : Sequence; Idx : Natural) return Boolean is
begin
   return Idx > 0 and Idx <= Seq.Length;  -- ← TARGET
end Is_Valid_Index;
```

### Mutant Code
```ada
function Is_Valid_Index (Seq : Sequence; Idx : Natural) return Boolean is
begin
   return Idx >= 0 and Idx <= Seq.Length;  -- MUTANT: >= instead of >
end Is_Valid_Index;
```

### Expected Test Outcome
**KILLED** by `Test_Comprehensive_Edge_Cases` (Phase 3, Category 10)

**Reason**: Test includes boundary cases for index validation (Idx = 0).

**Test Code**:
```ada
procedure Test_Comprehensive_Edge_Cases is
   Seq : Sequence := Create_Sequence (TC_Long, 10);
begin
   -- Boundary test: index 0 should be invalid (1-indexed in Ada)
   Assert (not Is_Valid_Index (Seq, 0), "Index 0 should be invalid");
   Assert (Is_Valid_Index (Seq, 1), "Index 1 should be valid");
   Assert (Is_Valid_Index (Seq, 10), "Index 10 should be valid");
   Assert (not Is_Valid_Index (Seq, 11), "Index 11 should be invalid");
end Test_Comprehensive_Edge_Cases;
```

---

## Critical Mutant #8: Off-by-One Allocation

### Location
`polyorb-any.adb:1156` (Allocate_Sequence function)

### Original Code
```ada
function Allocate_Sequence (TC : TypeCode.Object; Len : Natural) return Sequence is
   Buffer : Buffer_Access := new Buffer_Type (1 .. Len);  -- ← TARGET
begin
   return (TC, Len, Buffer);
end Allocate_Sequence;
```

### Mutant Code
```ada
function Allocate_Sequence (TC : TypeCode.Object; Len : Natural) return Sequence is
   Buffer : Buffer_Access := new Buffer_Type (1 .. Len - 1);  -- MUTANT: Off-by-one
begin
   return (TC, Len, Buffer);  -- Length mismatch!
end Allocate_Sequence;
```

### Expected Test Outcome
**KILLED** by `Test_Large_Structure_Performance` (Phase 3, Category 4)

**Reason**: Test allocates large sequences and validates all indices are accessible.

---

## Critical Mutant #9: Remove Exception Raise (ERROR MASKING)

### Location
`polyorb-any.adb:1567` (Validate_TypeCode procedure)

### Original Code
```ada
procedure Validate_TypeCode (TC : TypeCode.Object) is
begin
   if TC = null then
      raise Constraint_Error with "Invalid TypeCode";  -- ← TARGET
   end if;

   if not Is_Valid_TypeCode (TC) then
      raise Constraint_Error with "Corrupted TypeCode";
   end if;
end Validate_TypeCode;
```

### Mutant Code
```ada
procedure Validate_TypeCode (TC : TypeCode.Object) is
begin
   if TC = null then
      -- raise Constraint_Error with "Invalid TypeCode";  -- MUTANT: Removed
      null;  -- MUTANT: Silent failure (ERROR MASKING)
   end if;

   if not Is_Valid_TypeCode (TC) then
      raise Constraint_Error with "Corrupted TypeCode";
   end if;
end Validate_TypeCode;
```

### Expected Test Outcome
**KILLED** by `Test_Exception_Handling_Integration` (Phase 3, Category 10)

**Reason**: Test validates all exception paths are properly triggered.

---

## Critical Mutant #10: Wrong Exception Type

### Location
`polyorb-any.adb:1789` (Check_Bounds procedure)

### Original Code
```ada
procedure Check_Bounds (Idx : Integer; Max : Integer) is
begin
   if Idx < 0 or Idx >= Max then
      raise Constraint_Error with "Index out of bounds";  -- ← TARGET
   end if;
end Check_Bounds;
```

### Mutant Code
```ada
procedure Check_Bounds (Idx : Integer; Max : Integer) is
begin
   if Idx < 0 or Idx >= Max then
      raise Program_Error with "Index out of bounds";  -- MUTANT: Wrong exception
   end if;
end Check_Bounds;
```

### Expected Test Outcome
**KILLED** by `Test_Allocate_Invalid_TypeCode` (Phase 2, Category 2)

**Reason**: Test validates specific exception types are raised (not just any exception).

**Test Code**:
```ada
begin
   A := Get_Empty_Any (null);
   Assert (False, "Should raise Constraint_Error");
exception
   when Constraint_Error =>  -- Must be this specific type
      null;  -- Expected
   when others =>
      Assert (False, "Wrong exception type raised");
end;
```

---

## Mutation Score Calculation

### Formula
```
Mutation Score = (Killed Mutants / Total Valid Mutants) × 100%

Total Valid Mutants = Total Mutants - Compile Errors - Equivalent Mutants
```

### Example
```
Total Mutants:        50
Killed:               45
Survived:              3
Compile Errors:        2
Equivalent:            0

Total Valid:          48
Mutation Score:       45/48 = 93.75%
```

### Targets

| Level | Score | Interpretation |
|-------|-------|----------------|
| ⭐⭐⭐⭐⭐ | 95-100% | Excellent test quality |
| ⭐⭐⭐⭐ | 90-94% | Very good test quality |
| ⭐⭐⭐ | 80-89% | Good test quality |
| ⭐⭐ | 70-79% | Adequate test quality |
| ⭐ | <70% | Weak test quality |

**PolyORB Target**: 90%+ (⭐⭐⭐⭐)

---

## Analyzing Surviving Mutants

### Mutant Survival = Test Quality Gap

**Process**:
1. Identify surviving mutant
2. Determine why test didn't detect it
3. Add/improve test case
4. Re-run mutation testing
5. Verify mutant is now killed

### Example: Surviving Mutant Analysis

**Mutant 17**: Line 789: `>` → `>=` (SURVIVED)

**Root Cause Analysis**:
```ada
-- Original code
if Index > 0 and Index <= Length then
   ...

-- Mutant
if Index >= 0 and Index <= Length then  -- Accepts Index = 0
   ...

-- Why did it survive?
-- Our test only checked Index = 1, 5, 10
-- We never tested Index = 0 (boundary case)!
```

**Fix**: Add boundary test
```ada
procedure Test_Boundary_Cases is
begin
   Assert (not Is_Valid (Seq, 0), "Index 0 should be invalid");  -- NEW TEST
   Assert (Is_Valid (Seq, 1), "Index 1 should be valid");
end Test_Boundary_Cases;
```

**Re-test**:
```bash
python3 generate_mutants.py polyorb-any.adb -b ../build -n 50

# Mutant 17 now KILLED ✓
```

---

## CI/CD Integration (Future)

### Gate 3.5: Mutation Testing (Weekly)

```yaml
# .github/workflows/polyorb-ci.yml

gate-3.5-mutation-testing:
  runs-on: ubuntu-latest
  needs: gate-3-integration
  # Run weekly (too expensive for every commit)
  if: github.event_name == 'schedule'

  steps:
    - name: Checkout
      uses: actions/checkout@v4

    - name: Install Dependencies
      run: |
        sudo apt-get install -y gnat-12 gprbuild python3

    - name: Generate Mutants
      run: |
        cd test_stabilize/improvements
        python3 generate_mutants.py polyorb-any.adb -o mutants -n 100

    - name: Run Mutation Testing
      run: |
        python3 generate_mutants.py polyorb-any.adb \
          -b ../../polyorb/build \
          -n 100 | tee mutation_report.txt

    - name: Check Mutation Score
      run: |
        SCORE=$(grep "MUTATION SCORE" mutation_report.txt | awk '{print $3}' | sed 's/%//')
        if (( $(echo "$SCORE < 90.0" | bc -l) )); then
          echo "❌ Mutation score $SCORE% below 90% threshold"
          exit 1
        fi
        echo "✅ Mutation score $SCORE% meets 90% threshold"

    - name: Upload Report
      uses: actions/upload-artifact@v4
      with:
        name: mutation-report
        path: test_stabilize/improvements/mutants/
```

**Frequency**: Weekly (not every commit - too expensive)
**Threshold**: 90% mutation score
**Action**: Block merge if score drops below threshold

---

## Performance Optimization

### Parallel Mutation Testing

```python
# In generate_mutants.py (future enhancement)

from concurrent.futures import ProcessPoolExecutor

def test_mutants_parallel(self, mutants, build_dir, workers=4):
    """Test mutants in parallel"""
    with ProcessPoolExecutor(max_workers=workers) as executor:
        futures = [
            executor.submit(self.test_mutant, mutant, build_dir)
            for mutant in mutants
        ]

        for future, mutant in zip(futures, mutants):
            mutant['status'] = future.result()

# Usage
tester.test_mutants_parallel(mutants, build_dir, workers=8)
```

**Speedup**: 4-8x faster (8 cores)
**Example**: 100 mutants × 30sec = 50min → 6-12min

---

## Best Practices

### 1. Prioritize Critical Mutants

**Order**:
1. CRITICAL: Memory management, ref counting (security)
2. HIGH: Exception handling, type safety (correctness)
3. MEDIUM: Boundaries, attributes (robustness)
4. LOW: Arithmetic, constants (nice-to-have)

### 2. Focus on Hot Paths

**80/20 Rule**: 20% of code executes 80% of the time

Prioritize mutation testing for:
- `Finalize` / `Adjust` (called on every Any operation)
- `Get_Empty_Any` (called for every allocation)
- `From_Any` / `To_Any` (called for every data access)

### 3. Iterate on Surviving Mutants

**Process**:
```
Generate mutants → Run tests → Analyze survivors → Add tests → Repeat
```

**Goal**: 90%+ mutation score with minimal test bloat

### 4. Document Equivalent Mutants

**Equivalent Mutant**: Semantically identical to original (cannot be killed)

**Example**:
```ada
-- Original
X := Y + 0;

-- Mutant (equivalent)
X := Y + 1 - 1;  -- Mathematically equivalent
```

**Action**: Document as equivalent, exclude from score calculation

---

## Troubleshooting

### Issue 1: Script Can't Find Source File

**Error**: `FileNotFoundError: polyorb-any.adb`

**Fix**:
```bash
# Provide absolute path
python3 generate_mutants.py /full/path/to/polyorb-any.adb

# Or run from correct directory
cd /path/to/polyorb/src
python3 ../test_stabilize/improvements/generate_mutants.py polyorb-any.adb
```

### Issue 2: Compilation Failures

**Error**: `COMPILE_ERROR` for many mutants

**Cause**: Syntax errors in mutations (regex too aggressive)

**Fix**: Review mutant files in `mutants/` directory, refine regex patterns

### Issue 3: Low Mutation Score (<70%)

**Cause**: Weak test assertions

**Examples of Weak Tests**:
```ada
-- ❌ Weak: Only checks no exception
procedure Test_Weak is
   A : Any;
begin
   A := Get_Empty_Any (TC_Long);
   -- No assertions! Just checks it doesn't crash
end Test_Weak;

-- ✅ Strong: Validates behavior
procedure Test_Strong is
   A : Any;
begin
   A := Get_Empty_Any (TC_Long);
   Assert (not Is_Empty (A), "Should not be empty");
   Assert (Get_Type (A) = TC_Long, "Type should match");
   Assert (Get_Ref_Count (A) = 1, "Ref count should be 1");
end Test_Strong;
```

---

## Summary

### Day 3 Deliverables ✅

1. **Mutation Testing Research** (MUTATION-TESTING-RESEARCH.md)
   - Tool landscape analysis
   - Mutation operators catalog
   - Ada-specific mutations
   - Implementation strategy

2. **Mutation Script** (generate_mutants.py)
   - 8 mutation operator classes
   - Automated mutant generation
   - Compilation & testing
   - Detailed reporting

3. **Usage Guide** (this document)
   - 10 critical manual mutations
   - Step-by-step verification
   - CI/CD integration plan
   - Troubleshooting guide

### Expected Outcomes

- **50-100 mutants** generated automatically
- **90%+ mutation score** achieved
- **Test quality validated** beyond code coverage
- **Weak tests identified** and improved

### Next: Day 4

**Performance Baseline Automation**
- Hot path timing measurements
- CI/CD performance gates
- Regression detection

---

## References

- MUTATION-TESTING-RESEARCH.md (Day 3 research)
- DAY2-EOD-SUMMARY.md (Test implementation)
- MEMORY-MANAGEMENT-TEST-DESIGN.md (Test design)
