------------------------------------------------------------------------------
-- Unit Tests - ORB Core Service (Specification)
-- Task: 57fbde - Comprehensive Test Framework / RDB-002
-- Layer 1: Unit Tests (Ada - AUnit)
------------------------------------------------------------------------------

with AUnit;
with AUnit.Test_Cases;

package ORB_Core_Tests is

   type Test_Case is new AUnit.Test_Cases.Test_Case with null record;

   procedure Register_Tests (T : in out Test_Case);
   -- Register all test routines

   function Name (T : Test_Case) return AUnit.Message_String;
   -- Test case name

   procedure Set_Up (T : in out Test_Case);
   -- Setup before each test

   procedure Tear_Down (T : in out Test_Case);
   -- Cleanup after each test

private

   -- =========================================================================
   -- Test Procedures
   -- =========================================================================

   -- Memory Management Tests
   procedure Test_Allocate_Buffer (T : in out Test_Case);
   procedure Test_Deallocate_Buffer (T : in out Test_Case);
   procedure Test_Deallocate_Null_Buffer (T : in out Test_Case);
   procedure Test_Critical_Memory_Zeroization (T : in out Test_Case);
   procedure Test_Memory_Leak_Detection (T : in out Test_Case);

   -- Connection Pool Tests
   procedure Test_Create_Connection_Pool (T : in out Test_Case);
   procedure Test_Acquire_Connection (T : in out Test_Case);
   procedure Test_Release_Connection (T : in out Test_Case);
   procedure Test_Connection_Pool_Saturation (T : in out Test_Case);
   procedure Test_Connection_Pool_Timeout (T : in out Test_Case);

   -- Object Reference Tests
   procedure Test_Create_Object_Reference (T : in out Test_Case);
   procedure Test_Destroy_Object_Reference (T : in out Test_Case);
   procedure Test_Validate_Object_Reference (T : in out Test_Case);
   procedure Test_Object_Reference_Serialization (T : in out Test_Case);

   -- Request Handler Tests
   procedure Test_Handle_Simple_Request (T : in out Test_Case);
   procedure Test_Handle_Invalid_Request (T : in out Test_Case);
   procedure Test_Request_Timeout (T : in out Test_Case);
   procedure Test_Concurrent_Requests (T : in out Test_Case);

   -- Error Handling Tests
   procedure Test_Handle_Out_Of_Memory (T : in out Test_Case);
   procedure Test_Handle_Connection_Failure (T : in out Test_Case);
   procedure Test_Handle_Invalid_IOR (T : in out Test_Case);

end ORB_Core_Tests;
