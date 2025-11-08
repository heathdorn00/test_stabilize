------------------------------------------------------------------------------
--                                                                          --
--                           POLYORB COMPONENTS                             --
--                                                                          --
--                   T E S T _ M E M O R Y _ M A N A G E M E N T          --
--                                                                          --
--                                 S p e c                                  --
--                                                                          --
--         Copyright (C) 2025 Free Software Foundation, Inc.                --
--                                                                          --
-- This is free software;  you can redistribute it  and/or modify it       --
-- under terms of the  GNU General Public License as published  by the     --
-- Free Software  Foundation;  either version 3,  or (at your option) any  --
-- later version.  This software is distributed in the hope  that it will  --
-- be useful, but WITHOUT ANY WARRANTY;  without even the implied warranty --
-- of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU     --
-- General Public License for  more details.                               --
--                                                                          --
-- You should have received a copy of the GNU General Public License and   --
-- a copy of the GCC Runtime Library Exception along with this program;    --
-- see the files COPYING3 and COPYING.RUNTIME respectively.  If not, see   --
-- <http://www.gnu.org/licenses/>.                                         --
--                                                                          --
--                  PolyORB is maintained by AdaCore                        --
--                     (email: sales@adacore.com)                           --
--                                                                          --
------------------------------------------------------------------------------

--  Memory Management Test Suite Specification
--
--  Purpose: Test coverage for Allocate_Content and Deallocate_Content
--           procedures in polyorb-any.adb (addressing 0% coverage gap)
--
--  Design: MEMORY-MANAGEMENT-TEST-DESIGN.md
--  Author: @test_stabilize
--  Date: 2025-11-07
--
--  Phase 1 Implementation: 10 tests (Categories 1 & 6)
--  - Category 1: Normal Allocation (5 tests)
--  - Category 6: Normal Deallocation (5 tests)
--
--  Planned Phases:
--  - Phase 2: Allocation Failures & Deallocation Safety (10 tests)
--  - Phase 3: Type Safety & Performance (20 tests)
--  - Phase 4: Concurrency & Integration (10 tests)
--
--  Total: 50+ comprehensive tests targeting 80%+ coverage

with AUnit;
with AUnit.Test_Cases;
with AUnit.Test_Suites;

package Test_Memory_Management is

   type Test_Case is new AUnit.Test_Cases.Test_Case with null record;

   --  Test case setup and teardown
   procedure Set_Up (T : in out Test_Case);
   procedure Tear_Down (T : in out Test_Case);

   --  Test case registration
   function Name (T : Test_Case) return AUnit.Message_String;
   procedure Register_Tests (T : in out Test_Case);

   --  Suite accessor
   function Suite return AUnit.Test_Suites.Access_Test_Suite;

   --------------------------------------------------------------------------
   -- PHASE 1 TESTS (10 tests implemented)
   --------------------------------------------------------------------------

   --  Category 1: Normal Allocation (5 tests)
   procedure Test_Allocate_Primitive (T : in out Test_Cases.Test_Case'Class);
   procedure Test_Allocate_String (T : in out Test_Cases.Test_Case'Class);
   procedure Test_Allocate_Struct (T : in out Test_Cases.Test_Case'Class);
   procedure Test_Allocate_Sequence (T : in out Test_Cases.Test_Case'Class);
   procedure Test_Allocate_Array (T : in out Test_Cases.Test_Case'Class);

   --  Category 6: Normal Deallocation (5 tests)
   procedure Test_Deallocate_Normal (T : in out Test_Cases.Test_Case'Class);
   procedure Test_Deallocate_String (T : in out Test_Cases.Test_Case'Class);
   procedure Test_Deallocate_Complex (T : in out Test_Cases.Test_Case'Class);
   procedure Test_Deallocate_Sequence (T : in out Test_Cases.Test_Case'Class);
   procedure Test_Deallocate_Deep (T : in out Test_Cases.Test_Case'Class);

   --------------------------------------------------------------------------
   -- PHASE 2 TESTS (Planned - Not yet implemented)
   --------------------------------------------------------------------------
   --  Category 2: Allocation Failures (5 tests)
   --  - Test_Allocate_Invalid_TypeCode
   --  - Test_Allocate_Corrupted_TypeCode
   --  - Test_Allocate_Out_Of_Memory
   --  - Test_Allocate_Zero_Size
   --  - Test_Allocate_Maximum_Size
   --
   --  Category 7: Deallocation Safety (5 tests)
   --  - Test_Double_Free_Prevention
   --  - Test_Deallocate_Null_Pointer
   --  - Test_Deallocate_Never_Allocated
   --  - Test_Deallocate_Already_Freed
   --  - Test_Deallocate_Corrupted_Pointer

   --------------------------------------------------------------------------
   -- PHASE 3 TESTS (Planned - Not yet implemented)
   --------------------------------------------------------------------------
   --  Category 3: Type Safety (5 tests)
   --  Category 4: Performance & Scalability (5 tests)
   --  Category 8: Memory Leak Detection (5 tests)
   --  Category 9: Reference Counting (5 tests)

   --------------------------------------------------------------------------
   -- PHASE 4 TESTS (Planned - Not yet implemented)
   --------------------------------------------------------------------------
   --  Category 5: Concurrent Access (5 tests)
   --  Category 10: Integration & Edge Cases (5 tests)

end Test_Memory_Management;
