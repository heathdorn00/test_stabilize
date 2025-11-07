-- Unit Test Specification - PolyORB Object Reference
-- Task: 57fbde - Set up comprehensive test framework
-- Layer 1: Unit Tests (50% coverage target)
-- Framework: AUnit 24.0

with AUnit;
with AUnit.Test_Suites;

package Test_Object_Ref is

   function Suite return AUnit.Test_Suites.Access_Test_Suite;

end Test_Object_Ref;
