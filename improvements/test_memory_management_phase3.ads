------------------------------------------------------------------------------
--                                                                          --
--                           POLYORB COMPONENTS                             --
--                                                                          --
--            T E S T _ M E M O R Y _ M A N A G E M E N T                 --
--                      P H A S E   3   T E S T S                          --
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

--  Memory Management Test Suite - Phase 3 Specification
--
--  Purpose: Type safety, performance, concurrency, and integration tests
--
--  Design: MEMORY-MANAGEMENT-TEST-DESIGN.md
--  Author: @test_stabilize
--  Date: 2025-11-07 (Day 2)
--
--  Phase 3 Implementation: 20 tests (Categories 3, 4, 5, 10)
--  - Category 3: Type Safety (5 tests)
--  - Category 4: Performance & Scalability (5 tests)
--  - Category 5: Concurrent Access (5 tests)
--  - Category 10: Integration & Edge Cases (5 tests)
--
--  Coverage Target: 50-60% → 80%+ (Phase 3 FINAL)

with AUnit;
with AUnit.Test_Cases;
with AUnit.Test_Suites;

package Test_Memory_Management_Phase3 is

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
   -- PHASE 3 TESTS (20 tests implemented - FINAL PHASE)
   --------------------------------------------------------------------------

   --  Category 3: Type Safety (5 tests)
   procedure Test_Type_Safety_Primitives (T : in out Test_Cases.Test_Case'Class);
   procedure Test_Type_Safety_Complex (T : in out Test_Cases.Test_Case'Class);
   procedure Test_Type_Safety_Nested (T : in out Test_Cases.Test_Case'Class);
   procedure Test_TypeCode_Equality (T : in out Test_Cases.Test_Case'Class);
   procedure Test_Mixed_Type_Operations (T : in out Test_Cases.Test_Case'Class);

   --  Category 4: Performance & Scalability (5 tests)
   procedure Test_Sequential_Allocations_Performance (T : in out Test_Cases.Test_Case'Class);
   procedure Test_Large_Structure_Performance (T : in out Test_Cases.Test_Case'Class);
   procedure Test_Allocation_Throughput (T : in out Test_Cases.Test_Case'Class);
   procedure Test_Allocation_Patterns (T : in out Test_Cases.Test_Case'Class);
   procedure Test_Scalability (T : in out Test_Cases.Test_Case'Class);

   --  Category 5: Concurrent Access (5 tests)
   procedure Test_Sequential_Access_Baseline (T : in out Test_Cases.Test_Case'Class);
   procedure Test_Concurrent_Allocations_Sim (T : in out Test_Cases.Test_Case'Class);
   procedure Test_Atomic_Operations (T : in out Test_Cases.Test_Case'Class);
   procedure Test_No_Deallocation_Races (T : in out Test_Cases.Test_Case'Class);
   procedure Test_Thread_Safety_Requirements (T : in out Test_Cases.Test_Case'Class);

   --  Category 10: Integration & Edge Cases (5 tests)
   procedure Test_Full_Lifecycle (T : in out Test_Cases.Test_Case'Class);
   procedure Test_Exception_Handling_Integration (T : in out Test_Cases.Test_Case'Class);
   procedure Test_Mixed_Allocation_Patterns (T : in out Test_Cases.Test_Case'Class);
   procedure Test_Stress_10000_Cycles (T : in out Test_Cases.Test_Case'Class);
   procedure Test_Comprehensive_Edge_Cases (T : in out Test_Cases.Test_Case'Class);

end Test_Memory_Management_Phase3;
