-- AUnit Test Runner
-- Task 306a6a: Ada Test Framework (AUnit) Setup
-- PolyORB Integration - Phase 2-4

with AUnit.Run;
with AUnit.Reporter.Text;
with AUnit.Test_Suites; use AUnit.Test_Suites;

with Calculator_Test_Suite;
with PolyORB_Any_Test_Suite;
with PolyORB_Security_Test_Suite;
with PolyORB_ORB_Test_Suite;
with Validation_Test_Suite;
with Any_Accessor_Test_Suite;

procedure Test_Runner is

   -- Create master suite combining all test suites
   function Master_Suite return Access_Test_Suite is
      Result : constant Access_Test_Suite := new Test_Suite;
   begin
      -- Add Calculator tests (10 tests)
      Result.Add_Test (Calculator_Test_Suite.Suite);

      -- Add PolyORB-Any tests (20 tests)
      Result.Add_Test (PolyORB_Any_Test_Suite.Suite);

      -- Add PolyORB Security tests (20 tests)
      Result.Add_Test (PolyORB_Security_Test_Suite.Suite);

      -- Add PolyORB ORB Core tests (10 tests)
      Result.Add_Test (PolyORB_ORB_Test_Suite.Suite);

      -- Add Validation tests (15 tests) - RDB-008
      Result.Add_Test (Validation_Test_Suite.Suite);

      -- Add Any Accessor tests (89 tests) - RDB-004 Task 3
      Result.Add_Test (Any_Accessor_Test_Suite.Suite);

      return Result;
   end Master_Suite;

   procedure Runner is new AUnit.Run.Test_Runner (Master_Suite);
   Reporter : AUnit.Reporter.Text.Text_Reporter;

begin
   Runner (Reporter);
end Test_Runner;
