-- Unit Test Example - PolyORB Object Reference
-- Task: 57fbde - Set up comprehensive test framework
-- Layer 1: Unit Tests (50% coverage target)
-- Framework: AUnit 24.0

with AUnit.Assertions; use AUnit.Assertions;
with AUnit.Test_Cases;

package body Test_Object_Ref is

   -- Mock implementation for demonstration
   -- In real code, this would import from PolyORB.References
   type Object_Ref is record
      IOR : String (1 .. 100);
      Valid : Boolean;
   end record;

   function Create_Object_Ref (IOR : String) return Object_Ref is
   begin
      return (IOR => IOR & (IOR'Length + 1 .. 100 => ' '), Valid => True);
   end Create_Object_Ref;

   function Is_Valid (Ref : Object_Ref) return Boolean is
   begin
      return Ref.Valid;
   end Is_Valid;

   procedure Invalidate (Ref : in out Object_Ref) is
   begin
      Ref.Valid := False;
   end Invalidate;

   --------------------------------------------------------------------------
   -- Test Case Type
   --------------------------------------------------------------------------

   type Object_Ref_Test is new AUnit.Test_Cases.Test_Case with null record;

   procedure Register_Tests (T : in out Object_Ref_Test);
   function Name (T : Object_Ref_Test) return AUnit.Message_String;

   --------------------------------------------------------------------------
   -- Individual Test Procedures
   --------------------------------------------------------------------------

   procedure Test_Create_Valid_Object_Ref (T : in out AUnit.Test_Cases.Test_Case'Class) is
      pragma Unreferenced (T);
      Ref : Object_Ref;
   begin
      -- Arrange & Act
      Ref := Create_Object_Ref ("IOR:010000001100000049444c3a...");

      -- Assert
      Assert (Is_Valid (Ref), "Object reference should be valid after creation");
   end Test_Create_Valid_Object_Ref;

   procedure Test_Create_Object_Ref_With_Empty_IOR (T : in out AUnit.Test_Cases.Test_Case'Class) is
      pragma Unreferenced (T);
      Ref : Object_Ref;
   begin
      -- Arrange & Act
      Ref := Create_Object_Ref ("");

      -- Assert
      Assert (Is_Valid (Ref), "Object reference with empty IOR should still be valid");
   end Test_Create_Object_Ref_With_Empty_IOR;

   procedure Test_Invalidate_Object_Ref (T : in out AUnit.Test_Cases.Test_Case'Class) is
      pragma Unreferenced (T);
      Ref : Object_Ref;
   begin
      -- Arrange
      Ref := Create_Object_Ref ("IOR:test");

      -- Act
      Invalidate (Ref);

      -- Assert
      Assert (not Is_Valid (Ref), "Object reference should be invalid after invalidation");
   end Test_Invalidate_Object_Ref;

   procedure Test_Newly_Created_Ref_Is_Valid (T : in out AUnit.Test_Cases.Test_Case'Class) is
      pragma Unreferenced (T);
      Ref : Object_Ref;
   begin
      -- Arrange & Act
      Ref := Create_Object_Ref ("IOR:simple");

      -- Assert
      Assert (Is_Valid (Ref), "Newly created reference must be valid");
   end Test_Newly_Created_Ref_Is_Valid;

   procedure Test_Multiple_Invalidations (T : in out AUnit.Test_Cases.Test_Case'Class) is
      pragma Unreferenced (T);
      Ref : Object_Ref;
   begin
      -- Arrange
      Ref := Create_Object_Ref ("IOR:test");

      -- Act - Multiple invalidations should be safe
      Invalidate (Ref);
      Invalidate (Ref);
      Invalidate (Ref);

      -- Assert
      Assert (not Is_Valid (Ref), "Object reference should remain invalid");
   end Test_Multiple_Invalidations;

   --------------------------------------------------------------------------
   -- Test Registration
   --------------------------------------------------------------------------

   procedure Register_Tests (T : in out Object_Ref_Test) is
      use AUnit.Test_Cases.Registration;
   begin
      Register_Routine (T, Test_Create_Valid_Object_Ref'Access, "Create valid object reference");
      Register_Routine (T, Test_Create_Object_Ref_With_Empty_IOR'Access, "Create object reference with empty IOR");
      Register_Routine (T, Test_Invalidate_Object_Ref'Access, "Invalidate object reference");
      Register_Routine (T, Test_Newly_Created_Ref_Is_Valid'Access, "Newly created reference is valid");
      Register_Routine (T, Test_Multiple_Invalidations'Access, "Multiple invalidations are safe");
   end Register_Tests;

   function Name (T : Object_Ref_Test) return AUnit.Message_String is
      pragma Unreferenced (T);
   begin
      return AUnit.Format ("PolyORB.References.Object_Ref Tests");
   end Name;

   --------------------------------------------------------------------------
   -- Test Suite
   --------------------------------------------------------------------------

   function Suite return AUnit.Test_Suites.Access_Test_Suite is
      Result : constant AUnit.Test_Suites.Access_Test_Suite :=
        new AUnit.Test_Suites.Test_Suite;
      Test : constant Object_Ref_Test_Access := new Object_Ref_Test;
   begin
      Result.Add_Test (Test);
      return Result;
   end Suite;

end Test_Object_Ref;

-- COVERAGE TARGET: 85% line coverage for PolyORB.References module
--
-- Test Categories:
-- - Creation: 2 tests (valid IOR, empty IOR)
-- - Validation: 1 test (check validity)
-- - Invalidation: 2 tests (single, multiple)
--
-- Total: 5 test cases
--
-- Build & Run:
--   gprbuild -P test_suite.gpr
--   ./test_runner
--
-- With Coverage:
--   gprbuild -P test_suite.gpr -cargs -fprofile-arcs -ftest-coverage
--   ./test_runner
--   gcov test_object_ref.adb
--   lcov --capture --directory . --output-file coverage.info
--   genhtml coverage.info --output-directory coverage_html
