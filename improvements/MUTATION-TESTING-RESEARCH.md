# Ada Mutation Testing Research
## Day 3: Mutation Testing Baseline

**Date**: 2025-11-07
**Author**: @test_stabilize
**Context**: RDB-004 Task 6 Pre-Work (Day 3 of 4)

---

## Executive Summary

**Finding**: Limited mature mutation testing tools exist for Ada (GNAT) as of 2025.

**Approach**: Hybrid strategy combining:
1. **Manual mutation testing** (targeted critical paths)
2. **Custom mutation scripts** (automated mutation injection)
3. **Test quality metrics** (proxy indicators)

**Goal**: Establish 90%+ mutation score baseline for polyorb-any memory management.

---

## 1. Mutation Testing Fundamentals

### What is Mutation Testing?

Mutation testing evaluates **test suite quality** by:
1. **Injecting faults** (mutants) into source code
2. **Running test suite** against each mutant
3. **Measuring detection rate** (mutation score)

**Mutation Score** = (Killed Mutants / Total Mutants) × 100%

- **Killed**: Test fails, mutant detected ✅
- **Survived**: Test passes, mutant undetected ❌
- **Equivalent**: Mutant semantically identical (ignore)

### Why Mutation Testing Matters

**Code coverage is necessary but insufficient:**
- 80% line coverage ≠ 80% fault detection
- Tests may execute code without validating behavior
- Mutation testing reveals **weak assertions**

**Example:**
```ada
-- Original
if X > 0 then
   Result := Positive_Case;
else
   Result := Negative_Case;
end if;

-- Mutant 1: Boundary mutation (X > 0) → (X >= 0)
-- Mutant 2: Operator mutation (X > 0) → (X < 0)
-- Mutant 3: Constant mutation (0) → (1)

-- If tests pass with these mutants, coverage is hollow!
```

### Industry Standards

- **Target**: 80%+ mutation score (NASA, safety-critical)
- **Google**: 90%+ for core libraries
- **Ada Safety**: 95%+ for DO-178C Level A

---

## 2. Ada Mutation Testing Tool Landscape

### 2.1 Research Findings (2025)

**Web search conducted**: "Ada mutation testing tools 2025"

**Results**:
- ❌ No mainstream Ada-specific mutation testing tools found
- ⚠️ Rapita RapiTest (Ada testing tool) - no mutation testing feature
- ❌ Stryker: No Ada support (JavaScript/TypeScript/C#/.NET only)
- ❌ PITest: Java-only
- ❌ Mull: C/C++ only (LLVM-based)

### 2.2 Potential Approaches

#### Option A: Manual Mutation Testing ⭐ RECOMMENDED (SHORT-TERM)

**Method**: Hand-craft mutants for critical paths

**Pros**:
- ✅ No tooling dependencies
- ✅ Focused on high-risk code
- ✅ Immediate implementation
- ✅ Educational for team

**Cons**:
- ❌ Labor-intensive
- ❌ Not scalable
- ❌ Human error prone

**Scope**: 10-20 critical mutations for polyorb-any

#### Option B: Custom Mutation Scripts ⭐ RECOMMENDED (MEDIUM-TERM)

**Method**: Python/Bash scripts to inject mutations automatically

**Approach**:
1. Parse Ada source with regex
2. Apply mutation operators
3. Compile each mutant
4. Run test suite
5. Report results

**Pros**:
- ✅ Automatable
- ✅ Repeatable
- ✅ Customizable for Ada idioms

**Cons**:
- ⚠️ Development effort (2-3 days)
- ⚠️ Requires robust parsing
- ⚠️ Maintenance overhead

**Scope**: 100+ mutations across polyorb-any

#### Option C: LLVM-Based Tool Adaptation

**Method**: Adapt Mull (C++ mutation tool) for GNAT LLVM backend

**Pros**:
- ✅ Leverages existing tool
- ✅ AST-aware mutations

**Cons**:
- ❌ Requires GNAT LLVM (experimental)
- ❌ Complex integration
- ❌ Timeline: 1-2 weeks minimum

**Verdict**: ❌ Not feasible for 4-day pre-work

#### Option D: GNATcoverage + Manual Analysis

**Method**: Use GNATcoverage branch coverage as mutation proxy

**Approach**:
- Measure branch coverage (target: 90%+)
- Manually identify uncovered branches
- Treat uncovered branches as "surviving mutants"

**Pros**:
- ✅ Tooling exists (GNATcoverage)
- ✅ Good proxy metric
- ✅ Fast implementation

**Cons**:
- ⚠️ Not true mutation testing
- ⚠️ Misses weak assertions

**Scope**: Full polyorb-any codebase

---

## 3. Mutation Operators for Ada

### 3.1 Arithmetic Operators

| Original | Mutant | Example |
|----------|--------|---------|
| `+` | `-` | `A + B` → `A - B` |
| `-` | `+` | `A - B` → `A + B` |
| `*` | `/` | `A * 2` → `A / 2` |
| `/` | `*` | `A / 2` → `A * 2` |

### 3.2 Relational Operators

| Original | Mutant | Example |
|----------|--------|---------|
| `>` | `>=` | `X > 0` → `X >= 0` |
| `>=` | `>` | `X >= 0` → `X > 0` |
| `<` | `<=` | `X < Max` → `X <= Max` |
| `=` | `/=` | `A = B` → `A /= B` |

### 3.3 Logical Operators

| Original | Mutant | Example |
|----------|--------|---------|
| `and` | `or` | `A and B` → `A or B` |
| `or` | `and` | `A or B` → `A and B` |
| `not` | (delete) | `not X` → `X` |

### 3.4 Ada-Specific Mutations

| Category | Original | Mutant | Example |
|----------|----------|--------|---------|
| Attribute | `'First` | `'Last` | `Arr'First` → `Arr'Last` |
| Attribute | `'Length` | `'Length - 1` | `Str'Length` → `Str'Length - 1` |
| Access | `new` | `null` | `Ptr := new T` → `Ptr := null` |
| Exception | `raise E` | (delete) | Remove exception raise |
| Controlled | `Adjust` | (skip) | Skip Adjust call |
| Controlled | `Finalize` | (skip) | Skip Finalize call |

### 3.5 PolyORB-Any Specific Mutations

**Memory Management**:
```ada
-- Original
procedure Deallocate is
   new Ada.Unchecked_Deallocation (Any_Container, Any_Container_Ptr);

-- Mutant 1: Skip deallocation
procedure Deallocate (Ptr : in out Any_Container_Ptr) is
begin
   null;  -- MUTATION: Memory leak
end Deallocate;

-- Mutant 2: Double-free
Deallocate (Ptr);
Deallocate (Ptr);  -- MUTATION: Second deallocation
```

**Reference Counting**:
```ada
-- Original
Ref_Count := Ref_Count + 1;

-- Mutant 1: Off-by-one
Ref_Count := Ref_Count + 2;

-- Mutant 2: No-op
null;  -- MUTATION: Skip increment
```

**Type Checking**:
```ada
-- Original
if Get_Type (A) /= TC then
   raise Constraint_Error;
end if;

-- Mutant 1: Inverted condition
if Get_Type (A) = TC then
   raise Constraint_Error;
end if;

-- Mutant 2: Removed check
null;  -- MUTATION: Skip type check
```

---

## 4. Recommended Approach for Day 3

### Phase 1: Manual Mutation Testing (2 hours)

**Target**: 10 critical mutations in polyorb-any memory management

**Mutations to Test**:
1. ✅ Skip `Deallocate` call → Detect memory leak
2. ✅ Double `Deallocate` → Detect double-free
3. ✅ Skip reference count increment → Detect premature deallocation
4. ✅ Skip reference count decrement → Detect memory leak
5. ✅ Remove NULL check → Detect crash
6. ✅ Invert type check → Detect type safety violation
7. ✅ Change allocation size → Detect buffer overflow
8. ✅ Skip exception raise → Detect error masking
9. ✅ Boundary mutation (> to >=) → Detect off-by-one
10. ✅ Remove finalization → Detect resource leak

**Process**:
1. Create `polyorb-any-mutant-N.adb` for each mutation
2. Compile mutant: `gprbuild -Ptest_polyorb.gpr`
3. Run test suite: `./test_runner`
4. Record: KILLED or SURVIVED
5. Analyze surviving mutants

**Expected Outcome**: 9/10 killed (90% mutation score)

### Phase 2: Custom Mutation Script (4 hours)

**Script**: `generate_mutants.py`

**Features**:
```python
#!/usr/bin/env python3
"""
Ada Mutation Testing Script
Generates mutants for polyorb-any.adb
"""

import re
import os
import subprocess

MUTATION_OPERATORS = {
    'arithmetic': [
        (r'\s+\+\s+', ' - '),  # + → -
        (r'\s+-\s+', ' + '),   # - → +
    ],
    'relational': [
        (r'\s+>\s+', ' >= '),  # > → >=
        (r'\s+>=\s+', ' > '),  # >= → >
        (r'\s+<\s+', ' <= '),  # < → <=
        (r'\s+=\s+', ' /= '),  # = → /=
    ],
    'logical': [
        (r'\band\b', 'or'),    # and → or
        (r'\bor\b', 'and'),    # or → and
    ],
    'ada_specific': [
        (r"'First\b", "'Last"),         # 'First → 'Last
        (r"'Last\b", "'First"),         # 'Last → 'First
        (r'\bnew\s+', 'null  -- '),     # new → null
    ],
}

def generate_mutants(source_file):
    """Generate all mutants for source file"""
    with open(source_file, 'r') as f:
        original = f.read()

    mutants = []
    mutant_id = 1

    for category, operators in MUTATION_OPERATORS.items():
        for pattern, replacement in operators:
            mutant = re.sub(pattern, replacement, original, count=1)
            if mutant != original:
                mutants.append((mutant_id, category, mutant))
                mutant_id += 1

    return mutants

def compile_and_test(mutant_file):
    """Compile mutant and run test suite"""
    # Compile
    result = subprocess.run(
        ['gprbuild', '-Ptest_polyorb.gpr'],
        capture_output=True,
        text=True
    )
    if result.returncode != 0:
        return 'COMPILE_ERROR'

    # Test
    result = subprocess.run(
        ['./test_runner'],
        capture_output=True,
        text=True,
        timeout=60
    )

    return 'SURVIVED' if result.returncode == 0 else 'KILLED'

def main():
    source = 'polyorb-any.adb'
    mutants = generate_mutants(source)

    results = []
    for mutant_id, category, mutant_code in mutants:
        # Write mutant
        with open('polyorb-any.adb', 'w') as f:
            f.write(mutant_code)

        # Test mutant
        status = compile_and_test('polyorb-any.adb')
        results.append((mutant_id, category, status))

        print(f"Mutant {mutant_id} ({category}): {status}")

    # Report
    killed = sum(1 for _, _, s in results if s == 'KILLED')
    total = len(results)
    score = (killed / total) * 100 if total > 0 else 0

    print(f"\n=== MUTATION SCORE: {score:.1f}% ({killed}/{total}) ===")

if __name__ == '__main__':
    main()
```

**Usage**:
```bash
cd /path/to/polyorb
python3 generate_mutants.py > mutation_report.txt
```

**Expected Output**:
```
Mutant 1 (arithmetic): KILLED
Mutant 2 (arithmetic): KILLED
Mutant 3 (relational): SURVIVED  ⚠️
Mutant 4 (relational): KILLED
...
Mutant 47 (ada_specific): KILLED

=== MUTATION SCORE: 91.5% (43/47) ===
```

### Phase 3: Analysis & Reporting (1 hour)

**Report Structure**:
```markdown
# Mutation Testing Report

## Summary
- Total Mutants: 47
- Killed: 43 (91.5%)
- Survived: 4 (8.5%)
- Compile Errors: 0

## Surviving Mutants

### Mutant 3: Boundary Mutation
**File**: polyorb-any.adb:342
**Mutation**: `>` → `>=`
**Status**: SURVIVED ⚠️

**Root Cause**: Missing boundary test case
**Fix**: Add test for X = 0 edge case

### Mutant 12: NULL Check Removal
...
```

---

## 5. Timeline

### Day 3 Schedule (8 hours)

| Time | Task | Duration |
|------|------|----------|
| 0-2h | Manual mutation testing (10 mutants) | 2h |
| 2-6h | Custom mutation script development | 4h |
| 6-7h | Run automated mutation testing | 1h |
| 7-8h | Analysis & reporting | 1h |

**Total**: 8 hours
**Deliverables**:
- 10 manual mutation tests
- `generate_mutants.py` script
- Mutation testing report
- Baseline mutation score (target: 90%+)

---

## 6. Success Criteria

### Minimum Viable Mutation Testing

✅ **10 critical mutations tested manually**
✅ **Mutation script generates 40+ mutants**
✅ **Mutation score ≥ 90% achieved**
✅ **Surviving mutants documented**
✅ **Test improvements identified**

### Stretch Goals

⭐ **100+ mutants generated**
⭐ **Mutation score ≥ 95%**
⭐ **CI/CD integration plan**
⭐ **Reusable mutation framework**

---

## 7. Risk Mitigation

### Risk 1: No Suitable Tooling

**Mitigation**: Manual + custom script hybrid approach (documented above)

### Risk 2: Low Mutation Score (<90%)

**Mitigation**:
- Identify surviving mutants
- Add targeted test cases
- Iterate until 90%+ achieved

### Risk 3: Script Complexity

**Mitigation**:
- Start with simple regex-based mutations
- Focus on high-value operators
- Expand incrementally

### Risk 4: Compilation Failures

**Mitigation**:
- Skip mutants that don't compile
- Report as "COMPILE_ERROR"
- Focus on syntactically valid mutations

---

## 8. Long-Term Recommendations

### For PolyORB Project

1. **Invest in mutation testing infrastructure**
   - Dedicate 1 sprint to build robust mutation framework
   - Target: 1000+ mutants across entire codebase

2. **CI/CD Integration**
   - Add mutation testing to Gate 3 (weekly run)
   - Enforce mutation score thresholds (80%+)

3. **Team Training**
   - Workshop on mutation testing principles
   - Code review checklist: "Is this testable with mutations?"

### For Ada Community

1. **Advocate for Ada mutation tools**
   - Open-source project opportunity
   - AdaCore partnership potential

2. **Publish findings**
   - Blog post: "Mutation Testing Ada with Custom Scripts"
   - Conference talk: Ada-Europe 2026

---

## 9. References

### Academic Papers

- Jia & Harman (2011): "An Analysis and Survey of the Development of Mutation Testing"
- Offutt & Untch (2001): "Mutation 2000: Uniting the Orthogonal"
- Papadakis et al. (2019): "Mutation Testing Advances: An Analysis and Survey"

### Industry Standards

- DO-178C: Software Considerations in Airborne Systems
- ISO 26262: Road vehicles — Functional safety
- NASA Software Safety Guidebook (NASA-GB-8719.13)

### Tools Researched

- Stryker: https://stryker-mutator.io/
- PITest: https://pitest.org/
- Mull: https://github.com/mull-project/mull
- GNATcoverage: https://www.adacore.com/gnatpro/toolsuite/gnatcoverage

---

## Appendix A: Critical Mutations for polyorb-any

### Memory Management (Priority: CRITICAL)

```ada
-- Location: polyorb-any.adb:1247
-- Mutation 1: Skip Deallocate
procedure Finalize (Object : in out Any) is
begin
   if Object.Container /= null then
      -- Deallocate (Object.Container);  -- MUTANT: Comment out
      null;  -- MUTATION: Memory leak
   end if;
end Finalize;

-- Location: polyorb-any.adb:1253
-- Mutation 2: Double Deallocate
procedure Finalize (Object : in out Any) is
begin
   if Object.Container /= null then
      Deallocate (Object.Container);
      Deallocate (Object.Container);  -- MUTANT: Double-free
   end if;
end Finalize;

-- Location: polyorb-any.adb:892
-- Mutation 3: Skip Ref Count Increment
procedure Adjust (Object : in out Any) is
begin
   if Object.Container /= null then
      -- Object.Container.Ref_Count := Object.Container.Ref_Count + 1;
      null;  -- MUTANT: Premature deallocation
   end if;
end Adjust;

-- Location: polyorb-any.adb:1255
-- Mutation 4: Skip Ref Count Decrement
procedure Finalize (Object : in out Any) is
begin
   if Object.Container /= null then
      -- Object.Container.Ref_Count := Object.Container.Ref_Count - 1;
      Object.Container.Ref_Count := Object.Container.Ref_Count;  -- MUTANT
      if Object.Container.Ref_Count = 0 then
         Deallocate (Object.Container);
      end if;
   end if;
end Finalize;
```

### Type Safety (Priority: HIGH)

```ada
-- Location: polyorb-any.adb:567
-- Mutation 5: Remove NULL Check
function Get_Empty_Any (TC : TypeCode.Object) return Any is
begin
   -- if TC = null then
   --    raise Constraint_Error;
   -- end if;
   return (Ada.Finalization.Controlled with
           Container => new Any_Container'(TC, ...));
end Get_Empty_Any;

-- Location: polyorb-any.adb:789
-- Mutation 6: Invert Type Check
procedure From_Any (A : Any; Val : out Integer) is
begin
   if Get_Type (A) = TC_Long then  -- MUTANT: Was /=
      raise Constraint_Error;
   end if;
   Val := To_Any (A);
end From_Any;
```

### Boundary Conditions (Priority: MEDIUM)

```ada
-- Location: polyorb-any.adb:1023
-- Mutation 7: Boundary > to >=
function Is_Valid_Index (Seq : Sequence; Idx : Natural) return Boolean is
begin
   return Idx >= 0 and Idx < Seq.Length;  -- MUTANT: Was >
end Is_Valid_Index;

-- Location: polyorb-any.adb:1156
-- Mutation 8: Off-by-one in allocation
function Allocate_Sequence (TC : TypeCode.Object; Len : Natural) return Sequence is
   Buffer : Buffer_Access := new Buffer_Type (1 .. Len - 1);  -- MUTANT: Was Len
begin
   return (TC, Len, Buffer);
end Allocate_Sequence;
```

### Exception Handling (Priority: HIGH)

```ada
-- Location: polyorb-any.adb:1567
-- Mutation 9: Remove Exception Raise
procedure Validate_TypeCode (TC : TypeCode.Object) is
begin
   if TC = null then
      -- raise Constraint_Error with "Invalid TypeCode";  -- MUTANT: Removed
      null;  -- MUTATION: Error masking
   end if;
end Validate_TypeCode;

-- Location: polyorb-any.adb:1789
-- Mutation 10: Wrong Exception Type
procedure Check_Bounds (Idx : Integer; Max : Integer) is
begin
   if Idx < 0 or Idx >= Max then
      raise Program_Error;  -- MUTANT: Was Constraint_Error
   end if;
end Check_Bounds;
```

---

## Appendix B: Expected Test Results

### Mutation 1: Skip Deallocate
**Expected**: KILLED by `Test_No_Leaks_Primitive`
**Reason**: Memory leak detection in Phase 2

### Mutation 2: Double Deallocate
**Expected**: KILLED by `Test_Double_Free_Prevention`
**Reason**: SECURITY-CRITICAL test in Phase 2

### Mutation 3: Skip Ref Count Increment
**Expected**: KILLED by `Test_Copy_Semantics`
**Reason**: Reference counting test in Phase 2

### Mutation 4: Skip Ref Count Decrement
**Expected**: KILLED by `Test_Single_Reference_Lifecycle`
**Reason**: Reference counting test in Phase 2

### Mutation 5: Remove NULL Check
**Expected**: KILLED by `Test_Allocate_Invalid_TypeCode`
**Reason**: Allocation failure test in Phase 2

### Mutation 6: Invert Type Check
**Expected**: KILLED by `Test_Type_Safety_Primitives`
**Reason**: Type safety test in Phase 3

### Mutation 7: Boundary > to >=
**Expected**: KILLED by `Test_Comprehensive_Edge_Cases`
**Reason**: Edge case test in Phase 3

### Mutation 8: Off-by-one Allocation
**Expected**: KILLED by `Test_Large_Structure_Performance`
**Reason**: Performance test detects buffer issues in Phase 3

### Mutation 9: Remove Exception Raise
**Expected**: KILLED by `Test_Exception_Handling_Integration`
**Reason**: Exception handling test in Phase 3

### Mutation 10: Wrong Exception Type
**Expected**: KILLED by `Test_Allocate_Invalid_TypeCode`
**Reason**: Validates specific exception type in Phase 2

**Expected Mutation Score**: 10/10 = 100% ✅

---

## Conclusion

**Day 3 Strategy**: Hybrid approach combining manual mutations (immediate value) with custom automation (scalability).

**Success Metric**: 90%+ mutation score demonstrates high-quality test suite beyond simple code coverage.

**Next**: Day 4 - Performance baseline automation and CI/CD integration.
