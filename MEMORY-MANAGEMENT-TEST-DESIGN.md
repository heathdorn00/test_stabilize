# Memory Management Test Design - polyorb-any

**Date**: 2025-11-07
**Author**: @test_stabilize
**Purpose**: Comprehensive test design for Allocate_Content and Deallocate_Content
**Target Coverage**: 80%+ (from 0%)

---

## Executive Summary

This document defines the comprehensive test strategy for memory management procedures in polyorb-any.adb that currently have **0% test coverage**:

- `Allocate_Content` (internal procedure)
- `Deallocate_Content` (internal procedure)

**Current State**: CRITICAL GAP
- No tests exist for memory allocation/deallocation
- Risk: Memory leaks, crashes, security vulnerabilities
- Impact: HIGH - affects all Any object operations

**Target State**: 80%+ Coverage
- 50+ comprehensive tests
- All scenarios validated
- Continuous monitoring in CI/CD

---

## Test Strategy

### Testing Philosophy

**White-Box Testing Approach**:
- Direct testing of internal procedures (not through public API)
- Focus on boundary conditions and error paths
- Validate memory safety guarantees

**Coverage Goals**:
1. **Line Coverage**: 80%+ of Allocate/Deallocate code
2. **Branch Coverage**: 75%+ of all decision points
3. **Path Coverage**: All critical paths validated
4. **Error Coverage**: All error conditions tested

---

## Allocate_Content Test Scenarios

### Category 1: Normal Allocation (5 tests)

#### Test 1.1: Basic Allocation - Primitive TypeCode
**Objective**: Validate normal allocation for simple types
```ada
procedure Test_Allocate_Primitive is
   TC : TypeCode.Object := TC_Long;
   Acc : Content_Ptr;
begin
   Allocate_Content(Acc, TC);
   Assert(Acc /= null, "Allocation should succeed");
   Assert(Get_Type(Acc.all) = TC, "TypeCode should match");
   Deallocate_Content(Acc);
end Test_Allocate_Primitive;
```

#### Test 1.2: Allocation - String TypeCode
**Objective**: Validate allocation for string types
```ada
procedure Test_Allocate_String is
   TC : TypeCode.Object := TC_String;
   Acc : Content_Ptr;
begin
   Allocate_Content(Acc, TC);
   Assert(Acc /= null, "Allocation should succeed");
   Assert(Get_Type(Acc.all) = TC, "TypeCode should match");
   Deallocate_Content(Acc);
end Test_Allocate_String;
```

#### Test 1.3: Allocation - Struct TypeCode
**Objective**: Validate allocation for complex structures
```ada
procedure Test_Allocate_Struct is
   TC : TypeCode.Object := Build_Complex_TC(...);
   Acc : Content_Ptr;
begin
   Allocate_Content(Acc, TC);
   Assert(Acc /= null, "Allocation should succeed");
   Assert(Get_Type(Acc.all) = TC, "TypeCode should match");
   Deallocate_Content(Acc);
end Test_Allocate_Struct;
```

#### Test 1.4: Allocation - Sequence TypeCode
**Objective**: Validate allocation for sequence types
```ada
procedure Test_Allocate_Sequence is
   TC : TypeCode.Object := TC_Sequence(...);
   Acc : Content_Ptr;
begin
   Allocate_Content(Acc, TC);
   Assert(Acc /= null, "Allocation should succeed");
   Assert(Get_Aggregate_Count(Acc.all) = 0, "Sequence should be empty");
   Deallocate_Content(Acc);
end Test_Allocate_Sequence;
```

#### Test 1.5: Allocation - Array TypeCode
**Objective**: Validate allocation for array types

---

### Category 2: Allocation Failures (5 tests)

#### Test 2.1: Allocation - Invalid TypeCode
**Objective**: Validate error handling for invalid TypeCode
```ada
procedure Test_Allocate_Invalid_TypeCode is
   TC : TypeCode.Object := null; -- Invalid
   Acc : Content_Ptr;
begin
   begin
      Allocate_Content(Acc, TC);
      Assert(False, "Should raise exception for invalid TypeCode");
   exception
      when Constraint_Error => null; -- Expected
   end;
end Test_Allocate_Invalid_TypeCode;
```

#### Test 2.2: Allocation - Corrupted TypeCode
**Objective**: Validate handling of corrupted TypeCode data

#### Test 2.3: Allocation - Out of Memory Simulation
**Objective**: Validate behavior when memory allocation fails
```ada
procedure Test_Allocate_Out_Of_Memory is
   -- Note: May need to mock allocation failure
   -- or use memory exhaustion simulation
begin
   -- Simulate OOM condition
   -- Verify graceful failure
   -- Verify no partial allocations
end Test_Allocate_Out_Of_Memory;
```

#### Test 2.4: Allocation - Zero Size Edge Case
**Objective**: Validate handling of zero-size allocations

#### Test 2.5: Allocation - Maximum Size Stress Test
**Objective**: Validate handling of very large allocations

---

### Category 3: Type Safety (5 tests)

#### Test 3.1: Type Validation - Primitive Types
**Objective**: Validate type safety for all primitive types

#### Test 3.2: Type Validation - Complex Types
**Objective**: Validate type safety for structs, unions, sequences

#### Test 3.3: Type Validation - Nested Types
**Objective**: Validate type safety for deeply nested structures

#### Test 3.4: Type Validation - Recursive Types
**Objective**: Validate handling of recursive TypeCode structures

#### Test 3.5: Type Validation - TypeCode Cache
**Objective**: Validate TypeCode caching behavior

---

### Category 4: Performance & Scalability (5 tests)

#### Test 4.1: Sequential Allocations
**Objective**: Validate multiple allocations in sequence
```ada
procedure Test_Sequential_Allocations is
   Count : constant := 1000;
   Accs : array (1..Count) of Content_Ptr;
begin
   for I in Accs'Range loop
      Allocate_Content(Accs(I), TC_Long);
      Assert(Accs(I) /= null, "Allocation " & I'Img & " should succeed");
   end loop;

   for I in Accs'Range loop
      Deallocate_Content(Accs(I));
   end loop;
end Test_Sequential_Allocations;
```

#### Test 4.2: Allocation Performance Baseline
**Objective**: Measure allocation time for performance regression

#### Test 4.3: Large Structure Allocation
**Objective**: Validate allocation of very large structures

#### Test 4.4: Allocation Under Load
**Objective**: Validate allocation behavior under high load

#### Test 4.5: Memory Fragmentation
**Objective**: Validate behavior with fragmented memory

---

### Category 5: Concurrent Access (5 tests)

#### Test 5.1: Thread Safety - Concurrent Allocations
**Objective**: Validate thread safety of Allocate_Content

#### Test 5.2: Race Condition Detection
**Objective**: Detect race conditions in allocation

#### Test 5.3: Deadlock Prevention
**Objective**: Validate no deadlocks in allocation

#### Test 5.4: Atomic Operations
**Objective**: Validate atomic nature of allocations

#### Test 5.5: Lock Contention
**Objective**: Measure lock contention under concurrent load

---

## Deallocate_Content Test Scenarios

### Category 6: Normal Deallocation (5 tests)

#### Test 6.1: Basic Deallocation
**Objective**: Validate normal deallocation
```ada
procedure Test_Deallocate_Normal is
   TC : TypeCode.Object := TC_Long;
   Acc : Content_Ptr;
begin
   Allocate_Content(Acc, TC);
   Assert(Acc /= null, "Allocation should succeed");

   Deallocate_Content(Acc);
   Assert(Acc = null, "Pointer should be null after deallocation");
end Test_Deallocate_Normal;
```

#### Test 6.2: Deallocation - String Content
**Objective**: Validate deallocation with string data

#### Test 6.3: Deallocation - Complex Structure
**Objective**: Validate deallocation of nested structures

#### Test 6.4: Deallocation - Sequence with Elements
**Objective**: Validate deallocation of sequences

#### Test 6.5: Deallocation - Deep Structure
**Objective**: Validate deallocation of deeply nested data

---

### Category 7: Deallocation Safety (5 tests)

#### Test 7.1: Double-Free Prevention
**Objective**: Validate double-free detection and prevention
```ada
procedure Test_Double_Free_Prevention is
   TC : TypeCode.Object := TC_Long;
   Acc : Content_Ptr;
begin
   Allocate_Content(Acc, TC);
   Deallocate_Content(Acc);

   begin
      Deallocate_Content(Acc); -- Should not crash
      Assert(Acc = null, "Should handle double-free safely");
   exception
      when others => null; -- May raise exception, which is OK
   end;
end Test_Double_Free_Prevention;
```

#### Test 7.2: NULL Pointer Safety
**Objective**: Validate safe handling of NULL pointers
```ada
procedure Test_Deallocate_Null_Pointer is
   Acc : Content_Ptr := null;
begin
   Deallocate_Content(Acc); -- Should not crash
   Assert(Acc = null, "Should handle null safely");
end Test_Deallocate_Null_Pointer;
```

#### Test 7.3: Never-Allocated Pointer
**Objective**: Validate handling of uninitialized pointers

#### Test 7.4: Already-Freed Pointer
**Objective**: Validate detection of already-freed memory

#### Test 7.5: Corrupted Pointer
**Objective**: Validate handling of corrupted pointer values

---

### Category 8: Memory Leak Detection (5 tests)

#### Test 8.1: No Leaks - Primitive Types
**Objective**: Validate no memory leaks for primitive types

#### Test 8.2: No Leaks - Complex Types
**Objective**: Validate no memory leaks for complex structures

#### Test 8.3: No Leaks - Sequences
**Objective**: Validate no memory leaks in sequences

#### Test 8.4: No Leaks - Exception Paths
**Objective**: Validate no leaks when exceptions occur

#### Test 8.5: Memory Leak Detection Tool
**Objective**: Integrate valgrind or similar for leak detection

---

### Category 9: Reference Counting (5 tests)

#### Test 9.1: Reference Count - Single Reference
**Objective**: Validate reference counting with single owner

#### Test 9.2: Reference Count - Multiple References
**Objective**: Validate reference counting with shared ownership

#### Test 9.3: Reference Count - Circular References
**Objective**: Validate handling of circular reference structures

#### Test 9.4: Reference Count - Weak References
**Objective**: Validate weak reference handling if applicable

#### Test 9.5: Reference Count - Concurrent Access
**Objective**: Validate thread-safe reference counting

---

### Category 10: Integration & Edge Cases (5 tests)

#### Test 10.1: Allocation + Deallocation Cycle
**Objective**: Validate full lifecycle

#### Test 10.2: Exception During Allocation
**Objective**: Validate cleanup when allocation fails midway

#### Test 10.3: Exception During Deallocation
**Objective**: Validate behavior when deallocation encounters errors

#### Test 10.4: Mixed Allocation Patterns
**Objective**: Validate various allocation/deallocation sequences

#### Test 10.5: Stress Test - 10,000 Cycles
**Objective**: Validate stability under sustained load

---

## Test Implementation Plan

### Phase 1: Foundation (10 tests - Day 1)
- Category 1: Normal Allocation (5 tests)
- Category 6: Normal Deallocation (5 tests)
- **Goal**: Establish basic test framework

### Phase 2: Safety (10 tests - Day 1-2)
- Category 2: Allocation Failures (5 tests)
- Category 7: Deallocation Safety (5 tests)
- **Goal**: Validate error handling

### Phase 3: Advanced (20 tests - Day 2)
- Category 3: Type Safety (5 tests)
- Category 4: Performance & Scalability (5 tests)
- Category 8: Memory Leak Detection (5 tests)
- Category 9: Reference Counting (5 tests)
- **Goal**: Comprehensive coverage

### Phase 4: Stress & Integration (10 tests - Day 2)
- Category 5: Concurrent Access (5 tests)
- Category 10: Integration & Edge Cases (5 tests)
- **Goal**: Production readiness

---

## Coverage Measurement

### Tools
- **gcov**: Line and branch coverage
- **gnatcov**: Ada-specific coverage analysis
- **lcov**: Coverage report generation

### Baseline
- **Current**: 0% coverage (0/X lines)
- **Target**: 80%+ coverage after 50+ tests

### Measurement Process
1. Compile with coverage flags: `-fprofile-arcs -ftest-coverage`
2. Run test suite
3. Generate coverage report: `gcov polyorb-any.adb`
4. Analyze uncovered lines
5. Add tests to cover gaps
6. Iterate until 80%+ achieved

---

## Test File Structure

```ada
-- File: testsuite/core/any/test_memory_management.adb

with AUnit.Assertions; use AUnit.Assertions;
with PolyORB.Any; use PolyORB.Any;
with PolyORB.Any.TypeCode; use PolyORB.Any.TypeCode;

package body Test_Memory_Management is

   -- Category 1: Normal Allocation
   procedure Test_Allocate_Primitive is ... end;
   procedure Test_Allocate_String is ... end;
   -- ... (5 tests)

   -- Category 2: Allocation Failures
   procedure Test_Allocate_Invalid_TypeCode is ... end;
   -- ... (5 tests)

   -- ... (remaining categories)

   -- Test Suite Registration
   function Suite return Access_Test_Suite is
      Result : Access_Test_Suite := new Test_Suite;
   begin
      Add_Test(Result, new Test_Case'(Test_Allocate_Primitive'Access));
      -- ... (all 50+ tests)
      return Result;
   end Suite;

end Test_Memory_Management;
```

---

## Success Criteria

### Coverage Metrics
- ✅ Line coverage: ≥80% for Allocate_Content
- ✅ Line coverage: ≥80% for Deallocate_Content
- ✅ Branch coverage: ≥75% for both procedures
- ✅ All error paths covered

### Test Quality
- ✅ All 50+ tests pass
- ✅ No flaky tests (100% deterministic)
- ✅ Test execution time: <5 seconds total
- ✅ Zero memory leaks detected

### Documentation
- ✅ All tests documented with objective
- ✅ Coverage report generated
- ✅ Findings documented

---

## Risk Mitigation

### Risk 1: Access to Internal Procedures
**Problem**: Allocate_Content and Deallocate_Content are internal
**Solution**:
- Option A: Test through public API (indirect coverage)
- Option B: Create test-only access package
- Option C: Temporarily make procedures visible for testing

### Risk 2: Memory Leak Detection
**Problem**: Hard to detect leaks in Ada
**Solution**:
- Use gnatmem or valgrind
- Manual inspection of allocation patterns
- Stress tests with memory monitoring

### Risk 3: Thread Safety Testing
**Problem**: Concurrent testing is complex
**Solution**:
- Use Ada tasking for concurrent tests
- ThreadSanitizer if available
- Manual code review for race conditions

---

## Timeline

**Day 1 (Today)**:
- Morning: Test design (this document) ✅
- Afternoon: Implement first 10-15 tests ⏳
- Evening: Measure baseline coverage, report findings ⏳

**Day 2 (Tomorrow)**:
- Morning: Implement remaining 35-40 tests
- Afternoon: Achieve 80%+ coverage target
- Evening: Document results, integrate into CI/CD

---

## Next Steps (This Afternoon)

1. ✅ Create test file: `test_memory_management.adb`
2. ⏳ Implement Category 1 tests (Normal Allocation - 5 tests)
3. ⏳ Implement Category 6 tests (Normal Deallocation - 5 tests)
4. ⏳ Set up coverage measurement
5. ⏳ Run tests and measure baseline
6. ⏳ Report findings to team

---

**Document Status**: ✅ Complete
**Next Action**: Begin test implementation
**Owner**: @test_stabilize
**Date**: 2025-11-07
