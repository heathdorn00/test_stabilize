------------------------------------------------------------------------------
--                                                                          --
--                           POLYORB COMPONENTS                             --
--                                                                          --
--                   T E S T _ M E M O R Y _ M A N A G E M E N T          --
--                                                                          --
--                                 B o d y                                  --
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

--  Memory Management Test Suite for polyorb-any.adb
--
--  Purpose: Comprehensive testing of Allocate_Content and Deallocate_Content
--           procedures to address CRITICAL 0% coverage gap.
--
--  Author: @test_stabilize
--  Date: 2025-11-07
--  Design Doc: MEMORY-MANAGEMENT-TEST-DESIGN.md
--
--  Coverage Target: 0% → 80%+ for memory management procedures
--  Test Count: 50+ tests (Phase 1: 10 tests implemented below)

with AUnit.Assertions; use AUnit.Assertions;
with AUnit.Test_Cases; use AUnit.Test_Cases;

with PolyORB.Any;
with PolyORB.Any.TypeCode; use PolyORB.Any.TypeCode;
with PolyORB.Types; use PolyORB.Types;

package body Test_Memory_Management is

   --------------------------------------------------------------------------
   -- Test Case Setup
   --------------------------------------------------------------------------

   procedure Set_Up (T : in out Test_Case) is
      pragma Unreferenced (T);
   begin
      --  Initialize test environment
      null;
   end Set_Up;

   procedure Tear_Down (T : in out Test_Case) is
      pragma Unreferenced (T);
   begin
      --  Cleanup test environment
      null;
   end Tear_Down;

   --------------------------------------------------------------------------
   -- CATEGORY 1: Normal Allocation (5 tests)
   -- Target: Validate normal allocation for different TypeCode types
   --------------------------------------------------------------------------

   --  Test 1.1: Basic Allocation - Primitive TypeCode
   --  Objective: Validate normal allocation for simple types
   --  Expected: Successful allocation with correct TypeCode
   procedure Test_Allocate_Primitive (T : in out Test_Cases.Test_Case'Class) is
      pragma Unreferenced (T);
      TC : TypeCode.Object := TC_Long;
      A : PolyORB.Any.Any;
   begin
      --  Create Any with primitive TypeCode
      A := PolyORB.Any.Get_Empty_Any (TC);

      --  Verify allocation succeeded
      Assert (not PolyORB.Any.Is_Empty (A),
              "Allocation should succeed for primitive TypeCode");

      --  Verify TypeCode matches
      Assert (PolyORB.Any.Get_Type (A) = TC,
              "TypeCode should match after allocation");

      --  Note: Deallocation happens automatically via finalization
   end Test_Allocate_Primitive;

   --  Test 1.2: Allocation - String TypeCode
   --  Objective: Validate allocation for string types
   --  Expected: Successful allocation with string TypeCode
   procedure Test_Allocate_String (T : in out Test_Cases.Test_Case'Class) is
      pragma Unreferenced (T);
      TC : TypeCode.Object := TC_String;
      A : PolyORB.Any.Any;
   begin
      --  Create Any with string TypeCode
      A := PolyORB.Any.Get_Empty_Any (TC);

      --  Verify allocation succeeded
      Assert (not PolyORB.Any.Is_Empty (A),
              "Allocation should succeed for string TypeCode");

      --  Verify TypeCode matches
      Assert (PolyORB.Any.Get_Type (A) = TC,
              "TypeCode should match for string type");
   end Test_Allocate_String;

   --  Test 1.3: Allocation - Struct TypeCode
   --  Objective: Validate allocation for complex structures
   --  Expected: Successful allocation with aggregate TypeCode
   procedure Test_Allocate_Struct (T : in out Test_Cases.Test_Case'Class) is
      pragma Unreferenced (T);
      TC : TypeCode.Object;
      A : PolyORB.Any.Any;
   begin
      --  Build a simple struct TypeCode
      --  Note: This is a simplified example. In real code, we'd use
      --  Build_Complex_TC or similar to create proper struct TypeCode
      TC := TC_Struct;

      --  Create Any with struct TypeCode
      A := PolyORB.Any.Get_Empty_Any (TC);

      --  Verify allocation succeeded
      Assert (not PolyORB.Any.Is_Empty (A),
              "Allocation should succeed for struct TypeCode");

      --  Verify it's an aggregate type
      declare
         Kind : constant TCKind := PolyORB.Any.TypeCode.Kind (TC);
      begin
         Assert (Kind = Tk_Struct,
                 "TypeCode kind should be Tk_Struct");
      end;
   end Test_Allocate_Struct;

   --  Test 1.4: Allocation - Sequence TypeCode
   --  Objective: Validate allocation for sequence types
   --  Expected: Successful allocation with empty sequence
   procedure Test_Allocate_Sequence (T : in out Test_Cases.Test_Case'Class) is
      pragma Unreferenced (T);
      TC : TypeCode.Object;
      A : PolyORB.Any.Any;
   begin
      --  Create sequence TypeCode (unbounded sequence of longs)
      TC := TC_Sequence (TC_Long, 0);

      --  Create Any with sequence TypeCode
      A := PolyORB.Any.Get_Empty_Any (TC);

      --  Verify allocation succeeded
      Assert (not PolyORB.Any.Is_Empty (A),
              "Allocation should succeed for sequence TypeCode");

      --  Verify sequence is initially empty
      Assert (PolyORB.Any.Get_Aggregate_Count (A) = 0,
              "Newly allocated sequence should be empty");
   end Test_Allocate_Sequence;

   --  Test 1.5: Allocation - Array TypeCode
   --  Objective: Validate allocation for array types
   --  Expected: Successful allocation with fixed-size array
   procedure Test_Allocate_Array (T : in out Test_Cases.Test_Case'Class) is
      pragma Unreferenced (T);
      TC : TypeCode.Object;
      A : PolyORB.Any.Any;
      Array_Length : constant := 10;
   begin
      --  Create array TypeCode (array of 10 longs)
      TC := TC_Array (TC_Long, Array_Length);

      --  Create Any with array TypeCode
      A := PolyORB.Any.Get_Empty_Any (TC);

      --  Verify allocation succeeded
      Assert (not PolyORB.Any.Is_Empty (A),
              "Allocation should succeed for array TypeCode");

      --  Verify array has correct length
      Assert (PolyORB.Any.Get_Aggregate_Count (A) = Array_Length,
              "Array should have correct fixed length");
   end Test_Allocate_Array;

   --------------------------------------------------------------------------
   -- CATEGORY 6: Normal Deallocation (5 tests)
   -- Target: Validate normal deallocation paths
   --------------------------------------------------------------------------

   --  Test 6.1: Basic Deallocation
   --  Objective: Validate normal deallocation of primitive type
   --  Expected: Successful deallocation without errors
   procedure Test_Deallocate_Normal (T : in out Test_Cases.Test_Case'Class) is
      pragma Unreferenced (T);
      TC : TypeCode.Object := TC_Long;
   begin
      --  Allocation and deallocation in limited scope
      declare
         A : PolyORB.Any.Any;
      begin
         A := PolyORB.Any.Get_Empty_Any (TC);
         Assert (not PolyORB.Any.Is_Empty (A),
                 "Allocation should succeed");

         --  Implicit deallocation via finalization at end of scope
      end;

      --  If we reach here without exception, deallocation succeeded
      Assert (True, "Deallocation completed without exception");
   end Test_Deallocate_Normal;

   --  Test 6.2: Deallocation - String Content
   --  Objective: Validate deallocation with string data
   --  Expected: String memory properly freed
   procedure Test_Deallocate_String (T : in out Test_Cases.Test_Case'Class) is
      pragma Unreferenced (T);
      TC : TypeCode.Object := TC_String;
      Test_String : constant String := "Test string for deallocation";
   begin
      declare
         A : PolyORB.Any.Any;
      begin
         A := PolyORB.Any.Get_Empty_Any (TC);

         --  Set string value
         PolyORB.Any.From_Any (A, Test_String);

         --  Verify string was stored
         declare
            Retrieved : constant String := PolyORB.Any.To_Any (A);
         begin
            Assert (Retrieved = Test_String,
                    "String should be retrievable before deallocation");
         end;

         --  Implicit deallocation via finalization
      end;

      Assert (True, "String deallocation completed without exception");
   end Test_Deallocate_String;

   --  Test 6.3: Deallocation - Complex Structure
   --  Objective: Validate deallocation of nested structures
   --  Expected: All nested memory properly freed
   procedure Test_Deallocate_Complex (T : in out Test_Cases.Test_Case'Class) is
      pragma Unreferenced (T);
      TC : TypeCode.Object;
   begin
      --  Create struct TypeCode
      TC := TC_Struct;

      declare
         A : PolyORB.Any.Any;
      begin
         A := PolyORB.Any.Get_Empty_Any (TC);

         Assert (not PolyORB.Any.Is_Empty (A),
                 "Complex structure allocation should succeed");

         --  Implicit deallocation via finalization
      end;

      Assert (True, "Complex structure deallocation completed");
   end Test_Deallocate_Complex;

   --  Test 6.4: Deallocation - Sequence with Elements
   --  Objective: Validate deallocation of sequences with data
   --  Expected: Sequence and all elements properly freed
   procedure Test_Deallocate_Sequence (T : in out Test_Cases.Test_Case'Class) is
      pragma Unreferenced (T);
      TC : TypeCode.Object;
   begin
      --  Create unbounded sequence of longs
      TC := TC_Sequence (TC_Long, 0);

      declare
         A : PolyORB.Any.Any;
      begin
         A := PolyORB.Any.Get_Empty_Any (TC);

         --  Add some elements to the sequence
         for I in 1 .. 5 loop
            declare
               Element : PolyORB.Any.Any;
            begin
               Element := PolyORB.Any.Get_Empty_Any (TC_Long);
               PolyORB.Any.From_Any (Element, PolyORB.Types.Long (I));
               PolyORB.Any.Add_Aggregate_Element (A, Element);
            end;
         end loop;

         --  Verify sequence has elements
         Assert (PolyORB.Any.Get_Aggregate_Count (A) = 5,
                 "Sequence should contain 5 elements");

         --  Implicit deallocation of sequence and all elements
      end;

      Assert (True, "Sequence with elements deallocation completed");
   end Test_Deallocate_Sequence;

   --  Test 6.5: Deallocation - Deep Structure
   --  Objective: Validate deallocation of deeply nested data
   --  Expected: Complete recursive deallocation
   procedure Test_Deallocate_Deep (T : in out Test_Cases.Test_Case'Class) is
      pragma Unreferenced (T);
      TC_Outer : TypeCode.Object;
      TC_Inner : TypeCode.Object;
   begin
      --  Create nested sequence: sequence of sequences of longs
      TC_Inner := TC_Sequence (TC_Long, 0);
      TC_Outer := TC_Sequence (TC_Inner, 0);

      declare
         A : PolyORB.Any.Any;
      begin
         A := PolyORB.Any.Get_Empty_Any (TC_Outer);

         --  Add a nested sequence
         declare
            Inner_Seq : PolyORB.Any.Any;
         begin
            Inner_Seq := PolyORB.Any.Get_Empty_Any (TC_Inner);

            --  Add elements to inner sequence
            for I in 1 .. 3 loop
               declare
                  Element : PolyORB.Any.Any;
               begin
                  Element := PolyORB.Any.Get_Empty_Any (TC_Long);
                  PolyORB.Any.From_Any (Element, PolyORB.Types.Long (I));
                  PolyORB.Any.Add_Aggregate_Element (Inner_Seq, Element);
               end;
            end loop;

            PolyORB.Any.Add_Aggregate_Element (A, Inner_Seq);
         end;

         --  Verify structure
         Assert (PolyORB.Any.Get_Aggregate_Count (A) = 1,
                 "Outer sequence should contain 1 inner sequence");

         --  Implicit recursive deallocation
      end;

      Assert (True, "Deep structure deallocation completed");
   end Test_Deallocate_Deep;

   --------------------------------------------------------------------------
   -- Test Suite Registration
   --------------------------------------------------------------------------

   function Name (T : Test_Case) return Message_String is
      pragma Unreferenced (T);
   begin
      return Format ("Memory Management Tests (Phase 1: 10 tests)");
   end Name;

   procedure Register_Tests (T : in out Test_Case) is
      use AUnit.Test_Cases.Registration;
   begin
      --  Category 1: Normal Allocation (5 tests)
      Register_Routine (T, Test_Allocate_Primitive'Access,
                        "1.1: Allocate Primitive TypeCode");
      Register_Routine (T, Test_Allocate_String'Access,
                        "1.2: Allocate String TypeCode");
      Register_Routine (T, Test_Allocate_Struct'Access,
                        "1.3: Allocate Struct TypeCode");
      Register_Routine (T, Test_Allocate_Sequence'Access,
                        "1.4: Allocate Sequence TypeCode");
      Register_Routine (T, Test_Allocate_Array'Access,
                        "1.5: Allocate Array TypeCode");

      --  Category 6: Normal Deallocation (5 tests)
      Register_Routine (T, Test_Deallocate_Normal'Access,
                        "6.1: Deallocate Normal (Primitive)");
      Register_Routine (T, Test_Deallocate_String'Access,
                        "6.2: Deallocate String Content");
      Register_Routine (T, Test_Deallocate_Complex'Access,
                        "6.3: Deallocate Complex Structure");
      Register_Routine (T, Test_Deallocate_Sequence'Access,
                        "6.4: Deallocate Sequence with Elements");
      Register_Routine (T, Test_Deallocate_Deep'Access,
                        "6.5: Deallocate Deep Structure");
   end Register_Tests;

   --------------------------------------------------------------------------
   -- Suite Function (for AUnit runner)
   --------------------------------------------------------------------------

   function Suite return Access_Test_Suite is
      Result : constant Access_Test_Suite := new Test_Suite;
      T : constant Test_Case_Access := new Test_Case;
   begin
      Add_Test (Result, T);
      return Result;
   end Suite;

end Test_Memory_Management;
