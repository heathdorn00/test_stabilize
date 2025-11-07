-- AUnit Test Runner
-- Task: 57fbde - Set up comprehensive test framework
-- Executes all registered test suites

with AUnit.Run;
with AUnit.Reporter.Text;
with Test_Object_Ref;

procedure Test_Runner is
   procedure Run is new AUnit.Run.Test_Runner (Test_Object_Ref.Suite);
   Reporter : AUnit.Reporter.Text.Text_Reporter;
begin
   Run (Reporter);
end Test_Runner;
