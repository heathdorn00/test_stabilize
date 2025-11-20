-- Any Accessor Test Suite (Implementation)
-- RDB-004 Task 3: Accessor Tests
-- Registers all 89 accessor test procedures

with AUnit.Test_Suites; use AUnit.Test_Suites;
with AUnit.Test_Caller;
with Any_Accessor_Tests;

package body Any_Accessor_Test_Suite is

   package Caller is new AUnit.Test_Caller (Any_Accessor_Tests.Test_Case);

   function Suite return Access_Test_Suite is
      Result : constant Access_Test_Suite := new Test_Suite;
   begin
      -----------------------
      -- To_Any Tests (17) --
      -----------------------

      Result.Add_Test (Caller.Create
        ("Test_To_Any_Octet", Any_Accessor_Tests.Test_To_Any_Octet'Access));

      Result.Add_Test (Caller.Create
        ("Test_To_Any_Short", Any_Accessor_Tests.Test_To_Any_Short'Access));

      Result.Add_Test (Caller.Create
        ("Test_To_Any_Long", Any_Accessor_Tests.Test_To_Any_Long'Access));

      Result.Add_Test (Caller.Create
        ("Test_To_Any_Long_Long", Any_Accessor_Tests.Test_To_Any_Long_Long'Access));

      Result.Add_Test (Caller.Create
        ("Test_To_Any_Unsigned_Short", Any_Accessor_Tests.Test_To_Any_Unsigned_Short'Access));

      Result.Add_Test (Caller.Create
        ("Test_To_Any_Unsigned_Long", Any_Accessor_Tests.Test_To_Any_Unsigned_Long'Access));

      Result.Add_Test (Caller.Create
        ("Test_To_Any_Unsigned_Long_Long", Any_Accessor_Tests.Test_To_Any_Unsigned_Long_Long'Access));

      Result.Add_Test (Caller.Create
        ("Test_To_Any_Boolean", Any_Accessor_Tests.Test_To_Any_Boolean'Access));

      Result.Add_Test (Caller.Create
        ("Test_To_Any_Char", Any_Accessor_Tests.Test_To_Any_Char'Access));

      Result.Add_Test (Caller.Create
        ("Test_To_Any_Wchar", Any_Accessor_Tests.Test_To_Any_Wchar'Access));

      Result.Add_Test (Caller.Create
        ("Test_To_Any_Float", Any_Accessor_Tests.Test_To_Any_Float'Access));

      Result.Add_Test (Caller.Create
        ("Test_To_Any_Double", Any_Accessor_Tests.Test_To_Any_Double'Access));

      Result.Add_Test (Caller.Create
        ("Test_To_Any_Long_Double", Any_Accessor_Tests.Test_To_Any_Long_Double'Access));

      Result.Add_Test (Caller.Create
        ("Test_To_Any_String", Any_Accessor_Tests.Test_To_Any_String'Access));

      Result.Add_Test (Caller.Create
        ("Test_To_Any_Wide_String", Any_Accessor_Tests.Test_To_Any_Wide_String'Access));

      Result.Add_Test (Caller.Create
        ("Test_To_Any_Any", Any_Accessor_Tests.Test_To_Any_Any'Access));

      Result.Add_Test (Caller.Create
        ("Test_To_Any_TypeCode", Any_Accessor_Tests.Test_To_Any_TypeCode'Access));

      -------------------------
      -- From_Any Tests (17) --
      -------------------------

      Result.Add_Test (Caller.Create
        ("Test_From_Any_Octet", Any_Accessor_Tests.Test_From_Any_Octet'Access));

      Result.Add_Test (Caller.Create
        ("Test_From_Any_Short", Any_Accessor_Tests.Test_From_Any_Short'Access));

      Result.Add_Test (Caller.Create
        ("Test_From_Any_Long", Any_Accessor_Tests.Test_From_Any_Long'Access));

      Result.Add_Test (Caller.Create
        ("Test_From_Any_Long_Long", Any_Accessor_Tests.Test_From_Any_Long_Long'Access));

      Result.Add_Test (Caller.Create
        ("Test_From_Any_Unsigned_Short", Any_Accessor_Tests.Test_From_Any_Unsigned_Short'Access));

      Result.Add_Test (Caller.Create
        ("Test_From_Any_Unsigned_Long", Any_Accessor_Tests.Test_From_Any_Unsigned_Long'Access));

      Result.Add_Test (Caller.Create
        ("Test_From_Any_Unsigned_Long_Long", Any_Accessor_Tests.Test_From_Any_Unsigned_Long_Long'Access));

      Result.Add_Test (Caller.Create
        ("Test_From_Any_Boolean", Any_Accessor_Tests.Test_From_Any_Boolean'Access));

      Result.Add_Test (Caller.Create
        ("Test_From_Any_Char", Any_Accessor_Tests.Test_From_Any_Char'Access));

      Result.Add_Test (Caller.Create
        ("Test_From_Any_Wchar", Any_Accessor_Tests.Test_From_Any_Wchar'Access));

      Result.Add_Test (Caller.Create
        ("Test_From_Any_Float", Any_Accessor_Tests.Test_From_Any_Float'Access));

      Result.Add_Test (Caller.Create
        ("Test_From_Any_Double", Any_Accessor_Tests.Test_From_Any_Double'Access));

      Result.Add_Test (Caller.Create
        ("Test_From_Any_Long_Double", Any_Accessor_Tests.Test_From_Any_Long_Double'Access));

      Result.Add_Test (Caller.Create
        ("Test_From_Any_String", Any_Accessor_Tests.Test_From_Any_String'Access));

      Result.Add_Test (Caller.Create
        ("Test_From_Any_Wide_String", Any_Accessor_Tests.Test_From_Any_Wide_String'Access));

      Result.Add_Test (Caller.Create
        ("Test_From_Any_Any", Any_Accessor_Tests.Test_From_Any_Any'Access));

      Result.Add_Test (Caller.Create
        ("Test_From_Any_TypeCode", Any_Accessor_Tests.Test_From_Any_TypeCode'Access));

      -------------------------------
      -- Round-Trip Tests (17)     --
      -------------------------------

      Result.Add_Test (Caller.Create
        ("Test_Round_Trip_Octet", Any_Accessor_Tests.Test_Round_Trip_Octet'Access));

      Result.Add_Test (Caller.Create
        ("Test_Round_Trip_Short", Any_Accessor_Tests.Test_Round_Trip_Short'Access));

      Result.Add_Test (Caller.Create
        ("Test_Round_Trip_Long", Any_Accessor_Tests.Test_Round_Trip_Long'Access));

      Result.Add_Test (Caller.Create
        ("Test_Round_Trip_Long_Long", Any_Accessor_Tests.Test_Round_Trip_Long_Long'Access));

      Result.Add_Test (Caller.Create
        ("Test_Round_Trip_Unsigned_Short", Any_Accessor_Tests.Test_Round_Trip_Unsigned_Short'Access));

      Result.Add_Test (Caller.Create
        ("Test_Round_Trip_Unsigned_Long", Any_Accessor_Tests.Test_Round_Trip_Unsigned_Long'Access));

      Result.Add_Test (Caller.Create
        ("Test_Round_Trip_Unsigned_Long_Long", Any_Accessor_Tests.Test_Round_Trip_Unsigned_Long_Long'Access));

      Result.Add_Test (Caller.Create
        ("Test_Round_Trip_Boolean", Any_Accessor_Tests.Test_Round_Trip_Boolean'Access));

      Result.Add_Test (Caller.Create
        ("Test_Round_Trip_Char", Any_Accessor_Tests.Test_Round_Trip_Char'Access));

      Result.Add_Test (Caller.Create
        ("Test_Round_Trip_Wchar", Any_Accessor_Tests.Test_Round_Trip_Wchar'Access));

      Result.Add_Test (Caller.Create
        ("Test_Round_Trip_Float", Any_Accessor_Tests.Test_Round_Trip_Float'Access));

      Result.Add_Test (Caller.Create
        ("Test_Round_Trip_Double", Any_Accessor_Tests.Test_Round_Trip_Double'Access));

      Result.Add_Test (Caller.Create
        ("Test_Round_Trip_Long_Double", Any_Accessor_Tests.Test_Round_Trip_Long_Double'Access));

      Result.Add_Test (Caller.Create
        ("Test_Round_Trip_String", Any_Accessor_Tests.Test_Round_Trip_String'Access));

      Result.Add_Test (Caller.Create
        ("Test_Round_Trip_Wide_String", Any_Accessor_Tests.Test_Round_Trip_Wide_String'Access));

      Result.Add_Test (Caller.Create
        ("Test_Round_Trip_Any", Any_Accessor_Tests.Test_Round_Trip_Any'Access));

      Result.Add_Test (Caller.Create
        ("Test_Round_Trip_TypeCode", Any_Accessor_Tests.Test_Round_Trip_TypeCode'Access));

      -------------------------
      -- Edge Case Tests (8) --
      -------------------------

      Result.Add_Test (Caller.Create
        ("Test_Boundary_Max_Values", Any_Accessor_Tests.Test_Boundary_Max_Values'Access));

      Result.Add_Test (Caller.Create
        ("Test_Boundary_Min_Values", Any_Accessor_Tests.Test_Boundary_Min_Values'Access));

      Result.Add_Test (Caller.Create
        ("Test_Boundary_Zero_Values", Any_Accessor_Tests.Test_Boundary_Zero_Values'Access));

      Result.Add_Test (Caller.Create
        ("Test_Empty_String", Any_Accessor_Tests.Test_Empty_String'Access));

      Result.Add_Test (Caller.Create
        ("Test_Empty_Wide_String", Any_Accessor_Tests.Test_Empty_Wide_String'Access));

      Result.Add_Test (Caller.Create
        ("Test_Nested_Any", Any_Accessor_Tests.Test_Nested_Any'Access));

      Result.Add_Test (Caller.Create
        ("Test_Complex_TypeCode", Any_Accessor_Tests.Test_Complex_TypeCode'Access));

      Result.Add_Test (Caller.Create
        ("Test_Unicode_Characters", Any_Accessor_Tests.Test_Unicode_Characters'Access));

      ----------------------------
      -- Exception Tests (4)    --
      ----------------------------

      Result.Add_Test (Caller.Create
        ("Test_Type_Mismatch_Exception", Any_Accessor_Tests.Test_Type_Mismatch_Exception'Access));

      Result.Add_Test (Caller.Create
        ("Test_Invalid_TypeCode_Exception", Any_Accessor_Tests.Test_Invalid_TypeCode_Exception'Access));

      Result.Add_Test (Caller.Create
        ("Test_Null_Any_Exception", Any_Accessor_Tests.Test_Null_Any_Exception'Access));

      Result.Add_Test (Caller.Create
        ("Test_Storage_Error_Handling", Any_Accessor_Tests.Test_Storage_Error_Handling'Access));

      ---------------------------
      -- Wrap Tests (12)       --
      ---------------------------

      Result.Add_Test (Caller.Create
        ("Test_Wrap_Octet", Any_Accessor_Tests.Test_Wrap_Octet'Access));

      Result.Add_Test (Caller.Create
        ("Test_Wrap_Short", Any_Accessor_Tests.Test_Wrap_Short'Access));

      Result.Add_Test (Caller.Create
        ("Test_Wrap_Long", Any_Accessor_Tests.Test_Wrap_Long'Access));

      Result.Add_Test (Caller.Create
        ("Test_Wrap_Long_Long", Any_Accessor_Tests.Test_Wrap_Long_Long'Access));

      Result.Add_Test (Caller.Create
        ("Test_Wrap_Unsigned_Short", Any_Accessor_Tests.Test_Wrap_Unsigned_Short'Access));

      Result.Add_Test (Caller.Create
        ("Test_Wrap_Unsigned_Long", Any_Accessor_Tests.Test_Wrap_Unsigned_Long'Access));

      Result.Add_Test (Caller.Create
        ("Test_Wrap_Float", Any_Accessor_Tests.Test_Wrap_Float'Access));

      Result.Add_Test (Caller.Create
        ("Test_Wrap_Double", Any_Accessor_Tests.Test_Wrap_Double'Access));

      Result.Add_Test (Caller.Create
        ("Test_Wrap_Boolean", Any_Accessor_Tests.Test_Wrap_Boolean'Access));

      Result.Add_Test (Caller.Create
        ("Test_Wrap_Char", Any_Accessor_Tests.Test_Wrap_Char'Access));

      Result.Add_Test (Caller.Create
        ("Test_Wrap_Wchar", Any_Accessor_Tests.Test_Wrap_Wchar'Access));

      Result.Add_Test (Caller.Create
        ("Test_Wrap_String", Any_Accessor_Tests.Test_Wrap_String'Access));

      ------------------------------------
      -- Set_Any_Value Tests (8)        --
      ------------------------------------

      Result.Add_Test (Caller.Create
        ("Test_Set_Any_Value_Octet", Any_Accessor_Tests.Test_Set_Any_Value_Octet'Access));

      Result.Add_Test (Caller.Create
        ("Test_Set_Any_Value_Long", Any_Accessor_Tests.Test_Set_Any_Value_Long'Access));

      Result.Add_Test (Caller.Create
        ("Test_Set_Any_Value_Float", Any_Accessor_Tests.Test_Set_Any_Value_Float'Access));

      Result.Add_Test (Caller.Create
        ("Test_Set_Any_Value_Double", Any_Accessor_Tests.Test_Set_Any_Value_Double'Access));

      Result.Add_Test (Caller.Create
        ("Test_Set_Any_Value_Boolean", Any_Accessor_Tests.Test_Set_Any_Value_Boolean'Access));

      Result.Add_Test (Caller.Create
        ("Test_Set_Any_Value_Char", Any_Accessor_Tests.Test_Set_Any_Value_Char'Access));

      Result.Add_Test (Caller.Create
        ("Test_Set_Any_Value_String", Any_Accessor_Tests.Test_Set_Any_Value_String'Access));

      Result.Add_Test (Caller.Create
        ("Test_Set_Any_Value_Any", Any_Accessor_Tests.Test_Set_Any_Value_Any'Access));

      ------------------------------------
      -- Aggregate Tests (6)            --
      ------------------------------------

      Result.Add_Test (Caller.Create
        ("Test_Get_Aggregate_Count", Any_Accessor_Tests.Test_Get_Aggregate_Count'Access));

      Result.Add_Test (Caller.Create
        ("Test_Get_Aggregate_Element", Any_Accessor_Tests.Test_Get_Aggregate_Element'Access));

      Result.Add_Test (Caller.Create
        ("Test_Set_Aggregate_Element", Any_Accessor_Tests.Test_Set_Aggregate_Element'Access));

      Result.Add_Test (Caller.Create
        ("Test_Add_Aggregate_Element", Any_Accessor_Tests.Test_Add_Aggregate_Element'Access));

      Result.Add_Test (Caller.Create
        ("Test_Aggregate_Empty", Any_Accessor_Tests.Test_Aggregate_Empty'Access));

      Result.Add_Test (Caller.Create
        ("Test_Aggregate_Nested", Any_Accessor_Tests.Test_Aggregate_Nested'Access));

      return Result;
   end Suite;

end Any_Accessor_Test_Suite;
