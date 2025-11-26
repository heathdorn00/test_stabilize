-- CDR Regression Tests (Implementation)
-- PolyORB Integration - Phase 3 (CDR Extraction)

with AUnit.Assertions; use AUnit.Assertions;
with PolyORB.GIOP; use PolyORB.GIOP;
with Ada.Streams; use Ada.Streams;

package body CDR_Regression_Tests is

   ----------------------------------------------------------------------------
   -- Test Data
   ----------------------------------------------------------------------------

   Test_Object_Key : aliased String := "TestObject";
   Test_Operation  : aliased String := "test_operation";

   ----------------------------------------------------------------------------
   -- Setup and Teardown
   ----------------------------------------------------------------------------

   procedure Set_Up (T : in out Test_Case) is
      pragma Unreferenced (T);
   begin
      Reset_All;
   end Set_Up;

   procedure Tear_Down (T : in out Test_Case) is
      pragma Unreferenced (T);
   begin
      Reset_All;
   end Tear_Down;

   ----------------------------------------------------------------------------
   -- Common_Process_Request_1_0_1_1 Wire Format Parity Tests
   ----------------------------------------------------------------------------

   -- Test 1: GIOP 1.0 request produces correct wire format
   procedure Test_GIOP_1_0_Request_Wire_Format (T : in out Test_Case) is
      pragma Unreferenced (T);
      Buffer : CDR_Buffer;
      Header : Request_Header;
   begin
      -- Arrange
      Buffer := Create_Buffer;
      Header := (Service_Context => 0,
                 Request_ID => 1,
                 Response_Expected => True,
                 Object_Key => Test_Object_Key'Access,
                 Operation => Test_Operation'Access);

      -- Act
      Process_Request_1_0 (Header, Buffer);

      -- Assert: Valid GIOP header
      Assert (Validate_Header (Buffer), "Should produce valid GIOP header");
      Assert (Get_Version (Buffer) = GIOP_1_0,
              "Should be GIOP 1.0");
      Assert (Get_Message_Type (Buffer) = Request,
              "Should be Request message");
      Assert (Size (Buffer) > 12,
              "Buffer should contain message body");
   end Test_GIOP_1_0_Request_Wire_Format;

   -- Test 2: GIOP 1.1 request produces correct wire format
   procedure Test_GIOP_1_1_Request_Wire_Format (T : in out Test_Case) is
      pragma Unreferenced (T);
      Buffer : CDR_Buffer;
      Header : Request_Header;
   begin
      -- Arrange
      Buffer := Create_Buffer;
      Header := (Service_Context => 0,
                 Request_ID => 1,
                 Response_Expected => True,
                 Object_Key => Test_Object_Key'Access,
                 Operation => Test_Operation'Access);

      -- Act
      Process_Request_1_1 (Header, Buffer);

      -- Assert: Valid GIOP header
      Assert (Validate_Header (Buffer), "Should produce valid GIOP header");
      Assert (Get_Version (Buffer) = GIOP_1_1,
              "Should be GIOP 1.1");
      Assert (Get_Message_Type (Buffer) = Request,
              "Should be Request message");
   end Test_GIOP_1_1_Request_Wire_Format;

   -- Test 3: Both versions produce compatible formats where expected
   procedure Test_Version_Compatibility (T : in out Test_Case) is
      pragma Unreferenced (T);
      Buffer_1_0, Buffer_1_1 : CDR_Buffer;
      Header : Request_Header;
   begin
      -- Arrange
      Buffer_1_0 := Create_Buffer;
      Buffer_1_1 := Create_Buffer;
      Header := (Service_Context => 0,
                 Request_ID => 100,
                 Response_Expected => False,
                 Object_Key => Test_Object_Key'Access,
                 Operation => Test_Operation'Access);

      -- Act
      Process_Request_1_0 (Header, Buffer_1_0);
      Process_Request_1_1 (Header, Buffer_1_1);

      -- Assert: Both valid, but different sizes (1.1 has reserved bytes)
      Assert (Validate_Header (Buffer_1_0), "1.0 should be valid");
      Assert (Validate_Header (Buffer_1_1), "1.1 should be valid");
      Assert (Size (Buffer_1_1) > Size (Buffer_1_0),
              "GIOP 1.1 should be larger due to reserved bytes");
   end Test_Version_Compatibility;

   -- Test 4: Request header marshalling is correct
   procedure Test_Request_Header_Marshalling (T : in out Test_Case) is
      pragma Unreferenced (T);
      Buffer : CDR_Buffer;
      Header : Request_Header;
   begin
      -- Arrange
      Buffer := Create_Buffer;
      Header := (Service_Context => 5,
                 Request_ID => 42,
                 Response_Expected => True,
                 Object_Key => Test_Object_Key'Access,
                 Operation => Test_Operation'Access);

      -- Act
      Common_Process_Request_1_0_1_1 (Header, GIOP_1_0, Buffer);

      -- Assert
      Assert (Size (Buffer) > 0, "Buffer should have content");
      Assert (Validate_Header (Buffer), "Header should be valid");

      -- Verify magic bytes "GIOP"
      -- Note: Bytes must be declared after buffer has content to avoid
      -- CONSTRAINT_ERROR from array length mismatch
      declare
         Bytes : constant Ada.Streams.Stream_Element_Array := Get_Bytes (Buffer);
      begin
         Assert (Natural (Bytes (Bytes'First)) = Character'Pos ('G'), "Magic byte 1");
         Assert (Natural (Bytes (Bytes'First + 1)) = Character'Pos ('I'), "Magic byte 2");
         Assert (Natural (Bytes (Bytes'First + 2)) = Character'Pos ('O'), "Magic byte 3");
         Assert (Natural (Bytes (Bytes'First + 3)) = Character'Pos ('P'), "Magic byte 4");
      end;
   end Test_Request_Header_Marshalling;

   ----------------------------------------------------------------------------
   -- GIOP 1.0/1.1 Request Processing Validation Tests
   ----------------------------------------------------------------------------

   -- Test 5: GIOP 1.0 requests processed correctly
   procedure Test_GIOP_1_0_Processing (T : in out Test_Case) is
      pragma Unreferenced (T);
      Buffer : CDR_Buffer;
      Header : Request_Header;
   begin
      Buffer := Create_Buffer;
      Header := (Service_Context => 0,
                 Request_ID => 999,
                 Response_Expected => True,
                 Object_Key => Test_Object_Key'Access,
                 Operation => Test_Operation'Access);

      Process_Request_1_0 (Header, Buffer);

      -- Verify version bytes
      Assert (Get_Version (Buffer).Major = 1, "Major version should be 1");
      Assert (Get_Version (Buffer).Minor = 0, "Minor version should be 0");
   end Test_GIOP_1_0_Processing;

   -- Test 6: GIOP 1.1 requests processed correctly
   procedure Test_GIOP_1_1_Processing (T : in out Test_Case) is
      pragma Unreferenced (T);
      Buffer : CDR_Buffer;
      Header : Request_Header;
   begin
      Buffer := Create_Buffer;
      Header := (Service_Context => 0,
                 Request_ID => 999,
                 Response_Expected => True,
                 Object_Key => Test_Object_Key'Access,
                 Operation => Test_Operation'Access);

      Process_Request_1_1 (Header, Buffer);

      -- Verify version bytes
      Assert (Get_Version (Buffer).Major = 1, "Major version should be 1");
      Assert (Get_Version (Buffer).Minor = 1, "Minor version should be 1");
   end Test_GIOP_1_1_Processing;

   -- Test 7: Service context handling
   procedure Test_Service_Context_Handling (T : in out Test_Case) is
      pragma Unreferenced (T);
      Buffer1, Buffer2 : CDR_Buffer;
      Header1, Header2 : Request_Header;
   begin
      Buffer1 := Create_Buffer;
      Buffer2 := Create_Buffer;

      Header1 := (Service_Context => 0,
                  Request_ID => 1,
                  Response_Expected => True,
                  Object_Key => Test_Object_Key'Access,
                  Operation => Test_Operation'Access);

      Header2 := (Service_Context => 100,
                  Request_ID => 1,
                  Response_Expected => True,
                  Object_Key => Test_Object_Key'Access,
                  Operation => Test_Operation'Access);

      Process_Request_1_0 (Header1, Buffer1);
      Process_Request_1_0 (Header2, Buffer2);

      -- Different service contexts should produce different wire formats
      Assert (not Wire_Format_Equal (Buffer1, Buffer2),
              "Different service contexts should produce different wire formats");
   end Test_Service_Context_Handling;

   -- Test 8: Response expected flag handling
   procedure Test_Response_Expected_Flag (T : in out Test_Case) is
      pragma Unreferenced (T);
      Buffer1, Buffer2 : CDR_Buffer;
      Header1, Header2 : Request_Header;
   begin
      Buffer1 := Create_Buffer;
      Buffer2 := Create_Buffer;

      Header1 := (Service_Context => 0,
                  Request_ID => 1,
                  Response_Expected => True,
                  Object_Key => Test_Object_Key'Access,
                  Operation => Test_Operation'Access);

      Header2 := (Service_Context => 0,
                  Request_ID => 1,
                  Response_Expected => False,
                  Object_Key => Test_Object_Key'Access,
                  Operation => Test_Operation'Access);

      Process_Request_1_0 (Header1, Buffer1);
      Process_Request_1_0 (Header2, Buffer2);

      -- Different response flags should produce different wire formats
      Assert (not Wire_Format_Equal (Buffer1, Buffer2),
              "Different response expected flags should produce different wire formats");
   end Test_Response_Expected_Flag;

   ----------------------------------------------------------------------------
   -- Marshall_Locate_Request Tests
   ----------------------------------------------------------------------------

   -- Test 9: Locate request GIOP 1.0 format
   procedure Test_Locate_Request_1_0 (T : in out Test_Case) is
      pragma Unreferenced (T);
      Buffer : CDR_Buffer;
      Header : Locate_Request_Header;
   begin
      Buffer := Create_Buffer;
      Header := (Request_ID => 50,
                 Object_Key => Test_Object_Key'Access);

      Marshall_Locate_Request (Header, GIOP_1_0, Buffer);

      Assert (Validate_Header (Buffer), "Should produce valid header");
      Assert (Get_Version (Buffer) = GIOP_1_0, "Should be GIOP 1.0");
      Assert (Get_Message_Type (Buffer) = Locate_Request,
              "Should be Locate_Request message");
   end Test_Locate_Request_1_0;

   -- Test 10: Locate request GIOP 1.1 format
   procedure Test_Locate_Request_1_1 (T : in out Test_Case) is
      pragma Unreferenced (T);
      Buffer : CDR_Buffer;
      Header : Locate_Request_Header;
   begin
      Buffer := Create_Buffer;
      Header := (Request_ID => 50,
                 Object_Key => Test_Object_Key'Access);

      Marshall_Locate_Request (Header, GIOP_1_1, Buffer);

      Assert (Validate_Header (Buffer), "Should produce valid header");
      Assert (Get_Version (Buffer) = GIOP_1_1, "Should be GIOP 1.1");
      Assert (Get_Message_Type (Buffer) = Locate_Request,
              "Should be Locate_Request message");
   end Test_Locate_Request_1_1;

   ----------------------------------------------------------------------------
   -- Wire Format Validation Tests
   ----------------------------------------------------------------------------

   -- Test 11: GIOP magic number validation
   procedure Test_GIOP_Magic_Validation (T : in out Test_Case) is
      pragma Unreferenced (T);
      Valid_Buffer   : CDR_Buffer;
      Invalid_Buffer : CDR_Buffer;
      Header         : Request_Header;
   begin
      Valid_Buffer := Create_Buffer;
      Header := (Service_Context => 0,
                 Request_ID => 1,
                 Response_Expected => True,
                 Object_Key => Test_Object_Key'Access,
                 Operation => Test_Operation'Access);

      Process_Request_1_0 (Header, Valid_Buffer);

      -- Valid buffer should validate
      Assert (Validate_Header (Valid_Buffer),
              "Valid buffer should pass validation");

      -- Empty/invalid buffer should not validate
      Invalid_Buffer := Create_Buffer;
      Assert (not Validate_Header (Invalid_Buffer),
              "Empty buffer should fail validation");
   end Test_GIOP_Magic_Validation;

   -- Test 12: Message type encoding
   procedure Test_Message_Type_Encoding (T : in out Test_Case) is
      pragma Unreferenced (T);
      Buffer : CDR_Buffer;
   begin
      -- Test Request encoding
      Buffer := Create_Reference_Buffer (GIOP_1_0, Request);
      Assert (Get_Message_Type (Buffer) = Request, "Should decode Request");

      -- Test Locate_Request encoding
      Buffer := Create_Reference_Buffer (GIOP_1_0, Locate_Request);
      Assert (Get_Message_Type (Buffer) = Locate_Request,
              "Should decode Locate_Request");

      -- Test Reply encoding
      Buffer := Create_Reference_Buffer (GIOP_1_0, Reply);
      Assert (Get_Message_Type (Buffer) = Reply, "Should decode Reply");
   end Test_Message_Type_Encoding;

   -- Test 13: Message size field accuracy
   procedure Test_Message_Size_Field (T : in out Test_Case) is
      pragma Unreferenced (T);
      Buffer : CDR_Buffer;
      Header : Request_Header;
      Msg_Size : Natural;
   begin
      Buffer := Create_Buffer;
      Header := (Service_Context => 0,
                 Request_ID => 1,
                 Response_Expected => True,
                 Object_Key => Test_Object_Key'Access,
                 Operation => Test_Operation'Access);

      Process_Request_1_0 (Header, Buffer);

      declare
         Bytes : constant Ada.Streams.Stream_Element_Array := Get_Bytes (Buffer);
         Base  : constant Ada.Streams.Stream_Element_Offset := Bytes'First;
      begin
         -- Message size is at bytes 9-12 (little-endian), offset from Base
         Msg_Size := Natural (Bytes (Base + 8)) +
                     Natural (Bytes (Base + 9)) * 256 +
                     Natural (Bytes (Base + 10)) * 65536 +
                     Natural (Bytes (Base + 11)) * 16777216;
      end;

      -- Size should equal total buffer size minus 12-byte header
      Assert (Msg_Size = Size (Buffer) - 12,
              "Message size field should match actual body size");
   end Test_Message_Size_Field;

   ----------------------------------------------------------------------------
   -- Edge Cases and Boundary Tests
   ----------------------------------------------------------------------------

   -- Test 14: Empty operation name handling
   procedure Test_Empty_Operation_Name (T : in out Test_Case) is
      pragma Unreferenced (T);
      Buffer : CDR_Buffer;
      Header : Request_Header;
   begin
      Buffer := Create_Buffer;
      Header := (Service_Context => 0,
                 Request_ID => 1,
                 Response_Expected => True,
                 Object_Key => Test_Object_Key'Access,
                 Operation => null);  -- Empty operation

      Process_Request_1_0 (Header, Buffer);

      Assert (Validate_Header (Buffer),
              "Should handle null operation gracefully");
   end Test_Empty_Operation_Name;

   -- Test 15: Empty object key handling
   procedure Test_Empty_Object_Key (T : in out Test_Case) is
      pragma Unreferenced (T);
      Buffer : CDR_Buffer;
      Header : Request_Header;
   begin
      Buffer := Create_Buffer;
      Header := (Service_Context => 0,
                 Request_ID => 1,
                 Response_Expected => True,
                 Object_Key => null,  -- Empty key
                 Operation => Test_Operation'Access);

      Process_Request_1_0 (Header, Buffer);

      Assert (Validate_Header (Buffer),
              "Should handle null object key gracefully");
   end Test_Empty_Object_Key;

   -- Test 16: Large request ID handling
   procedure Test_Large_Request_ID (T : in out Test_Case) is
      pragma Unreferenced (T);
      Buffer : CDR_Buffer;
      Header : Request_Header;
   begin
      Buffer := Create_Buffer;
      Header := (Service_Context => 0,
                 Request_ID => 2147483647,  -- Max 32-bit signed
                 Response_Expected => True,
                 Object_Key => Test_Object_Key'Access,
                 Operation => Test_Operation'Access);

      Process_Request_1_0 (Header, Buffer);

      Assert (Validate_Header (Buffer),
              "Should handle large request ID");
      Assert (Size (Buffer) > 12,
              "Should produce valid message");
   end Test_Large_Request_ID;

end CDR_Regression_Tests;
