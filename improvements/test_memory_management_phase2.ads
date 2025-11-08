------------------------------------------------------------------------------
--                                                                          --
--                           POLYORB COMPONENTS                             --
--                                                                          --
--            T E S T _ M E M O R Y _ M A N A G E M E N T                 --
--                      P H A S E   2   T E S T S                          --
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

--  Memory Management Test Suite - Phase 2 Specification
--
--  Purpose: CRITICAL safety tests for allocation failures and deallocation
--
--  Design: MEMORY-MANAGEMENT-TEST-DESIGN.md
--  Author: @test_stabilize
--  Date: 2025-11-07 (Day 2)
--
--  Phase 2 Implementation: 20 tests (Categories 2, 7, 8, 9)
--  - Category 2: Allocation Failures (5 tests)
--  - Category 7: Deallocation Safety (5 tests) ⚠️ SECURITY-CRITICAL
--  - Category 8: Memory Leak Detection (5 tests)
--  - Category 9: Reference Counting (5 tests)
--
--  Coverage Target: 15-20% → 50-60% (Phase 2)

with AUnit;
with AUnit.Test_Cases;
with AUnit.Test_Suites;

package Test_Memory_Management_Phase2 is

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
   -- PHASE 2 TESTS (20 tests implemented)
   --------------------------------------------------------------------------

   --  Category 2: Allocation Failures (5 tests)
   procedure Test_Allocate_Invalid_TypeCode (T : in out Test_Cases.Test_Case'Class);
   procedure Test_Allocate_Corrupted_TypeCode (T : in out Test_Cases.Test_Case'Class);
   procedure Test_Allocate_Zero_Size (T : in out Test_Cases.Test_Case'Class);
   procedure Test_Allocate_Maximum_Size (T : in out Test_Cases.Test_Case'Class);
   procedure Test_Allocate_Out_Of_Memory (T : in out Test_Cases.Test_Case'Class);

   --  Category 7: Deallocation Safety (5 tests) ⚠️ SECURITY-CRITICAL
   procedure Test_Double_Free_Prevention (T : in out Test_Cases.Test_Case'Class);
   procedure Test_Deallocate_Null_Pointer (T : in out Test_Cases.Test_Case'Class);
   procedure Test_Deallocate_Never_Allocated (T : in out Test_Cases.Test_Case'Class);
   procedure Test_Multiple_Deallocation_Cycles (T : in out Test_Cases.Test_Case'Class);
   procedure Test_Deallocate_Modified_Content (T : in out Test_Cases.Test_Case'Class);

   --  Category 8: Memory Leak Detection (5 tests)
   procedure Test_No_Leaks_Primitive (T : in out Test_Cases.Test_Case'Class);
   procedure Test_No_Leaks_Complex (T : in out Test_Cases.Test_Case'Class);
   procedure Test_No_Leaks_Sequences (T : in out Test_Cases.Test_Case'Class);
   procedure Test_No_Leaks_Exception_Paths (T : in out Test_Cases.Test_Case'Class);
   procedure Test_Memory_Pressure (T : in out Test_Cases.Test_Case'Class);

   --  Category 9: Reference Counting (5 tests)
   procedure Test_Single_Reference_Lifecycle (T : in out Test_Cases.Test_Case'Class);
   procedure Test_Copy_Semantics (T : in out Test_Cases.Test_Case'Class);
   procedure Test_Assignment_Semantics (T : in out Test_Cases.Test_Case'Class);
   procedure Test_Scope_Exit_Handling (T : in out Test_Cases.Test_Case'Class);
   procedure Test_Exception_Exit_Handling (T : in out Test_Cases.Test_Case'Class);

end Test_Memory_Management_Phase2;
