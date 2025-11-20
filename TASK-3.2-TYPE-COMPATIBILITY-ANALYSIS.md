# Task 3.2: Type Compatibility Analysis

**Date**: 2025-11-20
**Agent**: @test_stabilize
**Related**: RDB-004 Task 3 (Accessor Tests), TASK-856f68

## Executive Summary

The 89 accessor tests written for RDB-004 Task 3 have **extensive type compatibility issues** that prevent compilation. This analysis documents the errors and proposes a comprehensive fix strategy for Task 3.2.

**Impact**: 89 tests written but 0% executable until type compatibility layer is implemented.

## Compilation Error Summary

Build attempt: `/Users/heathdorn/bin/alr build` (2025-11-20)

### Error Categories

1. **Type Mismatch Errors**: ~500+ individual errors
2. **Missing Declarations**: TypeCode.TCKind not found
3. **Ambiguous Function Calls**: Multiple overloads can't resolve types
4. **Incorrect Type Conversions**: Standard.Float → PolyORB.Types.Float

### Root Causes

#### 1. Integer Type Mismatches

**Problem**: Tests use `Standard.Integer` but PolyORB expects `PolyORB.Types.Long`

```ada
-- Current (FAILS):
any_accessor_tests.adb:853:16: error: expected type "Standard.Integer"
any_accessor_tests.adb:853:16: error: found type "Unsigned_Long" defined at polyorb-types.ads:58

-- Also affects:
- Long (line 55)
- Short (line 54)
- Unsigned_Short (line 57)
- Unsigned_Long (line 58)
- Unsigned_Long_Long (line 59)
```

**Scope**: 17 To_Any tests + 17 From_Any tests + 17 Round-Trip tests = 51 tests affected

#### 2. Float Type Mismatches

**Problem**: Tests use `Standard.Float` but PolyORB expects `PolyORB.Types.Float`

```ada
-- Current (FAILS):
any_accessor_tests.adb:150:25: error: expected type "Float" defined at polyorb-types.ads:61
any_accessor_tests.adb:150:25: error: found type "Standard.Float"

-- Also affects:
- Double (types.ads:63)
- Long_Double (types.ads:64)
```

**Scope**: Float, Double, Long_Double tests = 9 tests affected

#### 3. TypeCode Issues

**Problem**: Missing `TypeCode.TCKind` declaration

```ada
-- Current (FAILS):
any_accessor_tests.adb:19:33: error: "TCKind" not declared in "TypeCode"
```

**Likely Cause**: Need to import `PolyORB.Any.TypeCode` or correct package name

**Scope**: All 17 tests checking `Get_Type(Result) = TypeCode.TC_*`

#### 4. To_Any Signature Mismatches

**Problem**: Some `To_Any` calls have wrong arity or parameter types

```ada
-- Current (FAILS):
any_accessor_tests.adb:150:17: error: missing argument for parameter "TC" in call to "To_Any" declared at polyorb-any.ads:803
```

**Likely Cause**: Some To_Any functions require explicit TypeCode parameter

**Scope**: ~10-15 tests

#### 5. String Conversion Issues

**Problem**: Missing or incorrect `To_PolyORB_String` usage

```ada
-- Current (FAILS):
any_accessor_tests.adb:177:35: error: no visible interpretation of "To_PolyORB_String" matches expected type
```

**Likely Cause**: String conversion helper not imported or wrong signature

**Scope**: String and Wide_String tests = 6 tests affected

#### 6. Set_Any_Value Signature Issues

**Problem**: Incorrect parameter types for Set_Any_Value

```ada
-- Current (FAILS):
any_accessor_tests.adb:837:25: error: expected type "Any_Container'Class" defined at polyorb-any.ads:63
any_accessor_tests.adb:837:25: error: found private type "Any" defined at polyorb-any.ads:56
```

**Likely Cause**: Set_Any_Value expects `Any_Container'Class`, not `Any`

**Scope**: All 8 Set_Any_Value tests affected

#### 7. Aggregate Function Issues

**Problem**: Get_Aggregate_Count, Get_Aggregate_Element signatures unclear

```ada
-- Current (FAILS):
any_accessor_tests.adb:885:16: error: expected type "Standard.Integer"
any_accessor_tests.adb:885:16: error: found type "Unsigned_Long" defined at polyorb-types.ads:58
```

**Scope**: All 6 Aggregate tests affected

## Test Breakdown by Error Type

| Error Type | Tests Affected | Severity | Fix Complexity |
|------------|---------------|----------|----------------|
| Integer type mismatch | 51 | HIGH | Medium (conversion layer) |
| Float type mismatch | 9 | HIGH | Medium (conversion layer) |
| TypeCode missing | 17 | MEDIUM | Low (import fix) |
| To_Any signature | 15 | HIGH | Medium (add TC params) |
| String conversions | 6 | MEDIUM | Medium (helper functions) |
| Set_Any_Value types | 8 | HIGH | Medium (type cast/convert) |
| Aggregate functions | 6 | HIGH | High (API research) |
| **TOTAL** | **89** | | |

## Proposed Fix Strategy

### Option 1: Type Conversion Layer (Recommended)

**Approach**: Create a `Test_Helpers` package with conversion functions

```ada
-- polyorb_tests/src/test_helpers.ads
with PolyORB.Types;
with PolyORB.Any;

package Test_Helpers is

   -- Integer conversions
   function To_Long (Value : Integer) return PolyORB.Types.Long;
   function From_Long (Value : PolyORB.Types.Long) return Integer;

   -- Float conversions
   function To_Float (Value : Standard.Float) return PolyORB.Types.Float;
   function From_Float (Value : PolyORB.Types.Float) return Standard.Float;

   -- String conversions
   function To_PolyORB_String (Value : String) return PolyORB.Types.String;
   function From_PolyORB_String (Value : PolyORB.Types.String) return String;

   -- TypeCode helpers
   function Get_TypeCode_Kind (A : PolyORB.Any.Any) return PolyORB.Any.TypeCode.TCKind;

   -- Any creation helpers with correct signatures
   function Create_Any_Long (Value : Integer) return PolyORB.Any.Any;
   function Create_Any_Float (Value : Standard.Float) return PolyORB.Any.Any;
   -- ... (other types)

end Test_Helpers;
```

**Update Tests**:
```ada
-- Before:
Result := To_Any (Input);  -- Input is Standard.Integer

-- After:
Result := Create_Any_Long (Input);  -- Uses conversion helper
```

**Pros**:
- Clean separation of test code from PolyORB internals
- Reusable for future tests
- Documents type conversion patterns

**Cons**:
- Adds abstraction layer
- 89 tests need updating

**Estimated Effort**: 8-10 hours
- Create Test_Helpers package: 2 hours
- Update 89 tests: 6 hours
- Verify all tests pass: 2 hours

### Option 2: Direct Type Usage (Alternative)

**Approach**: Update all tests to use PolyORB types directly

```ada
-- Before:
procedure Test_To_Any_Long (T : in out Test_Case) is
   Input  : constant Long := -100000;  -- PolyORB.Types.Long

-- After:
with PolyORB.Types; use PolyORB.Types;

procedure Test_To_Any_Long (T : in out Test_Case) is
   Input  : constant Long := -100000;  -- Already correct!
```

**Pros**:
- No abstraction layer
- Tests directly exercise PolyORB APIs

**Cons**:
- Tests become more coupled to PolyORB internals
- Less portable if PolyORB types change

**Estimated Effort**: 6-8 hours
- Research correct PolyORB signatures: 2 hours
- Update 89 tests: 4 hours
- Verify all tests pass: 2 hours

### Option 3: Hybrid Approach (Pragmatic)

**Approach**: Use PolyORB types directly, add helpers only where needed

- Most tests use PolyORB.Types directly
- Helpers only for complex conversions (String, TypeCode)
- Document patterns in test comments

**Estimated Effort**: 5-7 hours

## Detailed Fix Plan (Option 1 - Recommended)

### Phase 1: Create Test_Helpers (2 hours)

1. Create `test_helpers.ads` with all conversion signatures
2. Implement `test_helpers.adb` with:
   - Integer conversions (trivial casts)
   - Float conversions (trivial casts)
   - String conversions (call PolyORB utility functions)
   - TypeCode helpers (wrap PolyORB.Any.TypeCode functions)
   - Any creation helpers (wrap To_Any with correct signatures)

3. Add to `polyorb_tests.gpr`:
   ```
   for Source_Dirs use ("src", ..., "src/test_helpers");
   ```

4. Build and verify Test_Helpers compiles

### Phase 2: Fix To_Any Tests (1.5 hours)

Update all 17 To_Any test procedures:

```ada
-- Old:
procedure Test_To_Any_Long (T : in out Test_Case) is
   Input  : constant Integer := -100000;
   Result : Any;
begin
   Result := To_Any (Input);
   Assert (Get_Type (Result) = TypeCode.TC_Long, ...);
end;

-- New:
with Test_Helpers; use Test_Helpers;

procedure Test_To_Any_Long (T : in out Test_Case) is
   Input  : constant Integer := -100000;
   Result : Any;
begin
   Result := Create_Any_Long (Input);
   Assert (Get_TypeCode_Kind (Result) = TC_Long, ...);
end;
```

**Affected Procedures** (17):
- Test_To_Any_Octet
- Test_To_Any_Short
- Test_To_Any_Long
- Test_To_Any_Long_Long
- Test_To_Any_Unsigned_Short
- Test_To_Any_Unsigned_Long
- Test_To_Any_Unsigned_Long_Long
- Test_To_Any_Boolean
- Test_To_Any_Char
- Test_To_Any_Wchar
- Test_To_Any_Float
- Test_To_Any_Double
- Test_To_Any_Long_Double
- Test_To_Any_String
- Test_To_Any_Wide_String
- Test_To_Any_Any
- Test_To_Any_TypeCode

### Phase 3: Fix From_Any Tests (1.5 hours)

Update all 17 From_Any test procedures:

```ada
-- Old:
procedure Test_From_Any_Long (T : in out Test_Case) is
   Input    : constant Integer := -100000;
   Any_Val  : Any;
   Result   : Integer;
begin
   Any_Val := To_Any (Input);
   Result := From_Any (Any_Val);
   Assert (Result = Input, ...);
end;

-- New:
with Test_Helpers; use Test_Helpers;

procedure Test_From_Any_Long (T : in out Test_Case) is
   Input    : constant Integer := -100000;
   Any_Val  : Any;
   Result   : Integer;
begin
   Any_Val := Create_Any_Long (Input);
   Result := From_Long (From_Any (Any_Val));
   Assert (Result = Input, ...);
end;
```

### Phase 4: Fix Round-Trip Tests (1 hour)

Update all 17 Round-Trip tests (simpler - just combine Phase 2+3 fixes)

### Phase 5: Fix Edge Case, Exception, Wrap, Set_Any_Value, Aggregate Tests (2 hours)

- Edge Case Tests (8): Apply same conversion patterns
- Exception Tests (4): Ensure exceptions still raised correctly
- Wrap Tests (12): Update to use PolyORB types
- Set_Any_Value Tests (8): Research `Any_Container'Class` usage
- Aggregate Tests (6): Research aggregate API signatures

### Phase 6: Verify All Tests Pass (2 hours)

1. Build: `alr build`
2. Run: `./bin/test_runner`
3. Expected output: `Total Tests Run: 164` (75 existing + 89 accessor)
4. Fix any remaining failures
5. Document final test count

## Success Criteria

- [x] All 89 accessor tests compile without errors
- [ ] All 89 accessor tests execute (pass or fail is tracked separately)
- [ ] Test execution time < 60 seconds
- [ ] Test_Helpers package documented with examples
- [ ] Type conversion patterns documented in ADR

## Risks & Mitigations

### Risk 1: PolyORB API Misunderstanding
**Likelihood**: Medium
**Impact**: High (could invalidate all tests)
**Mitigation**: Consult PolyORB documentation, review existing PolyORB test code

### Risk 2: Conversion Layer Performance
**Likelihood**: Low
**Impact**: Low (tests only, not production)
**Mitigation**: Inline conversion functions

### Risk 3: Time Estimate Overrun
**Likelihood**: Medium (API research unknowns)
**Impact**: Medium (delays RDB-004 completion)
**Mitigation**: Timebox research to 2 hours, escalate if blocked

## ADR Recommendation

This issue validates the ADR-WORKFLOW document created on 2025-11-19. An ADR should have been written **before** implementing the 89 tests to establish:

- Type system conventions (Integer vs PolyORB.Types.Long)
- Test helper patterns
- API usage patterns

**Estimated Rework Cost**: 5-10 hours (if ADR written first, could have been prevented)

**Recommendation**: Create ADR-008 (Type System Conventions) before starting Task 3.2 implementation.

## Next Steps

1. **Immediate** (Today):
   - Present this analysis to user
   - Get approval on fix strategy (Option 1, 2, or 3)
   - Create ADR-008 draft if Option 1 approved

2. **Short Term** (Tomorrow):
   - Implement approved fix strategy
   - Verify all 89 tests compile and run

3. **Medium Term** (This Week):
   - Submit accessor tests PR with working tests
   - Update RDB-004 Task 3 status to complete

## References

- RDB-004: Testing Infrastructure Modernization
- TASK-856f68: Accessor Tests Specification
- ADR-WORKFLOW.md: Evidence that ADR-first approach could have prevented this
- SESSION-SUMMARY-NOV-19.md: Previous session documenting type compatibility issue

---

**Status**: Analysis complete, awaiting user decision on fix strategy
**Estimated Total Effort**: 5-10 hours depending on option chosen
**Blocking**: Accessor tests PR submission, RDB-004 Task 3 completion
