-- Validation Unit Tests (Implementation)
-- RDB-008 Task 3: Write Validation Unit Tests
-- 15 unit tests covering all validators with edge cases
-- Based on security test cases from @security_verification

with AUnit.Assertions; use AUnit.Assertions;
with PolyORB.Utils.Validation; use PolyORB.Utils.Validation;

package body Validation_Tests is

   -- Setup: Initialize test fixture
   procedure Set_Up (T : in out Test_Case) is
      pragma Unreferenced (T);
   begin
      null; -- No setup needed for validation tests
   end Set_Up;

   -- Teardown: Clean up test fixture
   procedure Tear_Down (T : in out Test_Case) is
      pragma Unreferenced (T);
   begin
      null; -- No cleanup needed
   end Tear_Down;

   ---------------------------------------------------------------------------
   -- Is_Valid_String_Length Tests
   ---------------------------------------------------------------------------

   -- Test 1: Valid string lengths
   procedure Test_String_Length_Valid (T : in out Test_Case) is
      pragma Unreferenced (T);
   begin
      Assert (Is_Valid_String_Length ("hello", 10) = True,
              "hello (5) should be valid for max 10");
      Assert (Is_Valid_String_Length ("test", 100) = True,
              "test (4) should be valid for max 100");
   end Test_String_Length_Valid;

   -- Test 2: Boundary conditions
   procedure Test_String_Length_Boundary (T : in out Test_Case) is
      pragma Unreferenced (T);
   begin
      Assert (Is_Valid_String_Length ("hello", 5) = True,
              "Exact boundary: hello (5) should be valid for max 5");
      Assert (Is_Valid_String_Length ("hello", 4) = False,
              "Over limit: hello (5) should be invalid for max 4");
   end Test_String_Length_Boundary;

   -- Test 3: Edge cases (empty strings, zero max)
   procedure Test_String_Length_Edge_Cases (T : in Out Test_Case) is
      pragma Unreferenced (T);
   begin
      Assert (Is_Valid_String_Length ("", 0) = True,
              "Empty string with zero max should be valid");
      Assert (Is_Valid_String_Length ("", 10) = True,
              "Empty string should always be valid");
      Assert (Is_Valid_String_Length ("a", 0) = False,
              "Any char with zero max should be invalid");
   end Test_String_Length_Edge_Cases;

   ---------------------------------------------------------------------------
   -- Is_In_Range Tests
   ---------------------------------------------------------------------------

   -- Test 4: Valid range values
   procedure Test_Range_Valid (T : in out Test_Case) is
      pragma Unreferenced (T);
   begin
      Assert (Is_In_Range (5, 1, 10) = True,
              "5 should be in range 1..10");
      Assert (Is_In_Range (0, 1, 10) = False,
              "0 should not be in range 1..10");
      Assert (Is_In_Range (11, 1, 10) = False,
              "11 should not be in range 1..10");
   end Test_Range_Valid;

   -- Test 5: Boundary values
   procedure Test_Range_Boundaries (T : in Out Test_Case) is
      pragma Unreferenced (T);
   begin
      Assert (Is_In_Range (1, 1, 10) = True,
              "Min boundary: 1 should be in range 1..10");
      Assert (Is_In_Range (10, 1, 10) = True,
              "Max boundary: 10 should be in range 1..10");
   end Test_Range_Boundaries;

   -- Test 6: Integer overflow attack cases
   procedure Test_Range_Overflow_Cases (T : in Out Test_Case) is
      pragma Unreferenced (T);
   begin
      Assert (Is_In_Range (Integer'First, Integer'First, 0) = True,
              "Integer'First should be in range Integer'First..0");
      Assert (Is_In_Range (Integer'Last, 0, Integer'Last) = True,
              "Integer'Last should be in range 0..Integer'Last");
   end Test_Range_Overflow_Cases;

   -- Test 7: Invalid range (Min > Max)
   procedure Test_Range_Invalid_Range (T : in Out Test_Case) is
      pragma Unreferenced (T);
   begin
      Assert (Is_In_Range (5, 10, 1) = False,
              "Inverted range (10..1) should always return False");
      Assert (Is_In_Range (0, Integer'Last, Integer'First) = False,
              "Extremely inverted range should return False");
   end Test_Range_Invalid_Range;

   ---------------------------------------------------------------------------
   -- Validate_Buffer_Bounds Tests
   ---------------------------------------------------------------------------

   -- Test 8: Valid buffer operations
   procedure Test_Buffer_Valid (T : in Out Test_Case) is
      pragma Unreferenced (T);
   begin
      Assert (Validate_Buffer_Bounds (0, 10, 10) = True,
              "Exact fit: offset 0, length 10, size 10");
      Assert (Validate_Buffer_Bounds (0, 10, 20) = True,
              "Room to spare: offset 0, length 10, size 20");
      Assert (Validate_Buffer_Bounds (5, 5, 10) = True,
              "Offset + Length = Size should be valid");
   end Test_Buffer_Valid;

   -- Test 9: Off-by-one boundary tests
   procedure Test_Buffer_Boundaries (T : in Out Test_Case) is
      pragma Unreferenced (T);
   begin
      Assert (Validate_Buffer_Bounds (9, 1, 10) = True,
              "Last valid byte: offset 9, length 1, size 10");
      Assert (Validate_Buffer_Bounds (10, 0, 10) = True,
              "Zero length at end should be valid");
      Assert (Validate_Buffer_Bounds (10, 1, 10) = False,
              "One past end should be invalid");
      Assert (Validate_Buffer_Bounds (5, 6, 10) = False,
              "Overflow by 1: offset 5, length 6, size 10");
   end Test_Buffer_Boundaries;

   -- Test 10: Zero cases
   procedure Test_Buffer_Zero_Cases (T : in Out Test_Case) is
      pragma Unreferenced (T);
   begin
      Assert (Validate_Buffer_Bounds (0, 0, 0) = True,
              "Empty buffer with zero offset and length");
      Assert (Validate_Buffer_Bounds (0, 0, 10) = True,
              "Zero length read from valid buffer");
      Assert (Validate_Buffer_Bounds (0, 1, 0) = False,
              "Cannot read from empty buffer");
   end Test_Buffer_Zero_Cases;

   -- Test 11: Overflow-safe arithmetic verification
   procedure Test_Buffer_Overflow_Safe (T : in Out Test_Case) is
      pragma Unreferenced (T);
   begin
      -- These tests verify the overflow-safe implementation
      -- Using subtraction (Buffer_Size - Offset >= Length)
      -- instead of addition (Offset + Length <= Buffer_Size)
      Assert (Validate_Buffer_Bounds (Natural'Last, 1, Natural'Last) = False,
              "Large offset should be handled safely");
      Assert (Validate_Buffer_Bounds (0, Natural'Last, Natural'Last) = True,
              "Max length with zero offset should work");
   end Test_Buffer_Overflow_Safe;

   ---------------------------------------------------------------------------
   -- Is_Valid_Sequence_Count Tests
   ---------------------------------------------------------------------------

   -- Test 12: Valid sequence counts
   procedure Test_Sequence_Valid (T : in Out Test_Case) is
      pragma Unreferenced (T);
   begin
      Assert (Is_Valid_Sequence_Count (100, 1000) = True,
              "100 elements within 1000 max");
      Assert (Is_Valid_Sequence_Count (1000, 1000) = True,
              "Exact limit: 1000 elements with 1000 max");
      Assert (Is_Valid_Sequence_Count (1001, 1000) = False,
              "Over limit: 1001 elements with 1000 max");
   end Test_Sequence_Valid;

   -- Test 13: Edge cases
   procedure Test_Sequence_Edge_Cases (T : in Out Test_Case) is
      pragma Unreferenced (T);
   begin
      Assert (Is_Valid_Sequence_Count (0, 0) = True,
              "Zero elements with zero max");
      Assert (Is_Valid_Sequence_Count (0, 100) = True,
              "Empty sequence should always be valid");
      Assert (Is_Valid_Sequence_Count (1, 0) = False,
              "Any element with zero max should be invalid");
   end Test_Sequence_Edge_Cases;

   ---------------------------------------------------------------------------
   -- Ensure_Valid_Length Tests
   ---------------------------------------------------------------------------

   -- Test 14: No exception for valid input
   procedure Test_Ensure_Valid_No_Exception (T : in Out Test_Case) is
      pragma Unreferenced (T);
      Exception_Raised : Boolean := False;
   begin
      begin
         Ensure_Valid_Length ("test", 10);
         Ensure_Valid_Length ("", 0);
      exception
         when Validation_Error =>
            Exception_Raised := True;
      end;
      Assert (not Exception_Raised,
              "Valid inputs should not raise exceptions");
   end Test_Ensure_Valid_No_Exception;

   -- Test 15: Exception raised for invalid input
   procedure Test_Ensure_Valid_Raises_Exception (T : in Out Test_Case) is
      pragma Unreferenced (T);
      Exception_Raised : Boolean := False;
   begin
      begin
         Ensure_Valid_Length ("hello", 3);
      exception
         when Validation_Error =>
            Exception_Raised := True;
      end;
      Assert (Exception_Raised,
              "Invalid input should raise Validation_Error");
   end Test_Ensure_Valid_Raises_Exception;

end Validation_Tests;
