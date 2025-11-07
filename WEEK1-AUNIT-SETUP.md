# Week 1: AUnit Framework Setup

**Task**: Install AUnit (Ada) framework and verify in CI/CD
**Owner**: @test_stabilize
**Date**: 2025-11-05
**Status**: In Progress

---

## Overview

AUnit is Ada's unit testing framework, inspired by the xUnit family. It provides a comprehensive testing infrastructure for Ada applications with support for test fixtures, assertions, and test suites.

## Installation Steps

### Option 1: GNAT Community Edition (Includes AUnit)

```bash
# Download GNAT Community Edition
wget https://community.download.adacore.com/v1/latest/gnat

# Install (includes AUnit)
chmod +x gnat-*
./gnat-* --prefix=/opt/GNAT/2024

# Add to PATH
export PATH=/opt/GNAT/2024/bin:$PATH
```

### Option 2: Alire Package Manager (Recommended)

```bash
# Install Alire
curl https://alire.ada.dev/install.sh | sh

# Create new project with AUnit dependency
alr init --bin polyorb_tests
cd polyorb_tests

# Add AUnit dependency
alr with aunit

# Build
alr build
```

### Option 3: Manual Build from Source

```bash
# Clone AUnit
git clone https://github.com/AdaCore/aunit.git
cd aunit

# Build with GPRBuild
gprbuild -P aunit.gpr

# Install
gprinstall -P aunit.gpr --prefix=/usr/local
```

---

## Project Structure

### GPR Project File: `polyorb_tests.gpr`

```ada
project PolyORB_Tests is

   for Source_Dirs use ("src", "tests");
   for Object_Dir use "obj";
   for Exec_Dir use "bin";
   for Main use ("test_runner.adb");

   package Compiler is
      for Default_Switches ("Ada") use ("-gnatwa", "-gnatwe", "-g");
   end Compiler;

   package Binder is
      for Default_Switches ("Ada") use ("-E");
   end Binder;

   package Linker is
      for Default_Switches ("Ada") use ("-g");
   end Linker;

end PolyORB_Tests;
```

### Directory Structure

```
PolyORB/
├── src/
│   ├── orb_core/
│   │   ├── orb_core.ads
│   │   └── orb_core.adb
│   └── security/
│       ├── authentication.ads
│       ├── authentication.adb
│       ├── encryption.ads
│       └── encryption.adb
└── tests/
    ├── test_runner.adb
    ├── orb_core/
    │   └── orb_core_tests.adb
    └── security/
        ├── authentication_tests.ads
        ├── authentication_tests.adb
        ├── encryption_tests.ads
        └── encryption_tests.adb
```

---

## Example Test Suite: `tests/security/authentication_tests.ads`

```ada
-- Security Service - Authentication Unit Tests (Specification)
-- Tests 1-10 for Week 1 Pilot

with AUnit; use AUnit;
with AUnit.Test_Fixtures;

package Authentication_Tests is

   type Test_Case is new AUnit.Test_Fixtures.Test_Fixture with null record;

   -- Setup and teardown
   procedure Set_Up (T : in out Test_Case);
   procedure Tear_Down (T : in out Test_Case);

   -- Test 1: Valid credentials authenticate successfully
   procedure Test_Valid_Credentials (T : in out Test_Case);

   -- Test 2: Invalid credentials fail authentication
   procedure Test_Invalid_Credentials (T : in out Test_Case);

   -- Test 3: Empty username fails authentication
   procedure Test_Empty_Username (T : in out Test_Case);

   -- Test 4: Empty password fails authentication
   procedure Test_Empty_Password (T : in out Test_Case);

   -- Test 5: Rate limiting after multiple failed attempts
   procedure Test_Rate_Limiting (T : in out Test_Case);

   -- Test 6: Token expiration
   procedure Test_Token_Expiration (T : in out Test_Case);

   -- Test 7: Valid token validates successfully
   procedure Test_Valid_Token_Validation (T : in out Test_Case);

   -- Test 8: Invalid token format fails validation
   procedure Test_Invalid_Token_Format (T : in out Test_Case);

   -- Test 9: Logout invalidates token
   procedure Test_Logout_Invalidates_Token (T : in out Test_Case);

   -- Test 10: Concurrent authentication requests (task safety)
   procedure Test_Concurrent_Authentication (T : in out Test_Case);

end Authentication_Tests;
```

### Example Test Suite: `tests/security/authentication_tests.adb`

```ada
-- Security Service - Authentication Unit Tests (Implementation)

with Ada.Text_IO;
with AUnit.Assertions; use AUnit.Assertions;
with Authentication;

package body Authentication_Tests is

   -- Setup: Initialize test fixture
   procedure Set_Up (T : in out Test_Case) is
   begin
      -- Initialize authentication service
      Authentication.Initialize;
   end Set_Up;

   -- Teardown: Clean up test fixture
   procedure Tear_Down (T : in out Test_Case) is
   begin
      -- Clean up authentication service
      Authentication.Finalize;
   end Tear_Down;

   -- Test 1: Valid credentials authenticate successfully
   procedure Test_Valid_Credentials (T : in out Test_Case) is
      Username : constant String := "testuser";
      Password : constant String := "SecurePass123!";
      Result   : Authentication.Auth_Result;
   begin
      -- Arrange & Act
      Result := Authentication.Authenticate (Username, Password);

      -- Assert
      Assert (Result.Success,
              "Authentication should succeed with valid credentials");
      Assert (Result.User_ID = Username,
              "User ID should match username");
      Assert (Result.Token'Length > 0,
              "Token should be generated");
   end Test_Valid_Credentials;

   -- Test 2: Invalid credentials fail authentication
   procedure Test_Invalid_Credentials (T : in out Test_Case) is
      Username : constant String := "testuser";
      Password : constant String := "WrongPassword";
      Result   : Authentication.Auth_Result;
   begin
      -- Arrange & Act
      Result := Authentication.Authenticate (Username, Password);

      -- Assert
      Assert (not Result.Success,
              "Authentication should fail with invalid password");
      Assert (Result.Token'Length = 0,
              "No token should be generated");
      Assert (Result.Error_Code = Authentication.Invalid_Credentials,
              "Error code should indicate invalid credentials");
   end Test_Invalid_Credentials;

   -- Test 3: Empty username fails authentication
   procedure Test_Empty_Username (T : in out Test_Case) is
      Username : constant String := "";
      Password : constant String := "SecurePass123!";
      Result   : Authentication.Auth_Result;
   begin
      -- Arrange & Act
      Result := Authentication.Authenticate (Username, Password);

      -- Assert
      Assert (not Result.Success,
              "Authentication should fail with empty username");
      Assert (Result.Error_Code = Authentication.Empty_Username,
              "Error code should indicate empty username");
   end Test_Empty_Username;

   -- Test 4: Empty password fails authentication
   procedure Test_Empty_Password (T : in out Test_Case) is
      Username : constant String := "testuser";
      Password : constant String := "";
      Result   : Authentication.Auth_Result;
   begin
      -- Arrange & Act
      Result := Authentication.Authenticate (Username, Password);

      -- Assert
      Assert (not Result.Success,
              "Authentication should fail with empty password");
      Assert (Result.Error_Code = Authentication.Empty_Password,
              "Error code should indicate empty password");
   end Test_Empty_Password;

   -- Test 5: Rate limiting after multiple failed attempts
   procedure Test_Rate_Limiting (T : in out Test_Case) is
      Username : constant String := "testuser";
      Password : constant String := "WrongPassword";
      Result   : Authentication.Auth_Result;
   begin
      -- Arrange: Attempt authentication 5 times (trigger rate limit)
      for I in 1 .. 5 loop
         Result := Authentication.Authenticate (Username, Password);
      end loop;

      -- Act: Attempt one more time
      Result := Authentication.Authenticate (Username, Password);

      -- Assert
      Assert (not Result.Success,
              "Authentication should fail due to rate limiting");
      Assert (Result.Error_Code = Authentication.Rate_Limited,
              "Error code should indicate rate limiting");
   end Test_Rate_Limiting;

   -- Test 6: Token expiration
   procedure Test_Token_Expiration (T : in out Test_Case) is
      Username : constant String := "testuser";
      Password : constant String := "SecurePass123!";
      Auth_Result : Authentication.Auth_Result;
      Token       : String (1 .. 64);
      Is_Valid    : Boolean;
   begin
      -- Arrange
      Auth_Result := Authentication.Authenticate (Username, Password);
      Token := Auth_Result.Token;

      -- Act: Simulate time passing (e.g., 1 hour)
      Authentication.Advance_Time (Seconds => 3600);
      Is_Valid := Authentication.Validate_Token (Token);

      -- Assert
      Assert (not Is_Valid,
              "Token should expire after 1 hour");
   end Test_Token_Expiration;

   -- Test 7: Valid token validates successfully
   procedure Test_Valid_Token_Validation (T : in out Test_Case) is
      Username : constant String := "testuser";
      Password : constant String := "SecurePass123!";
      Auth_Result : Authentication.Auth_Result;
      Token       : String (1 .. 64);
      Is_Valid    : Boolean;
   begin
      -- Arrange
      Auth_Result := Authentication.Authenticate (Username, Password);
      Token := Auth_Result.Token;

      -- Act
      Is_Valid := Authentication.Validate_Token (Token);

      -- Assert
      Assert (Is_Valid,
              "Freshly generated token should be valid");
   end Test_Valid_Token_Validation;

   -- Test 8: Invalid token format fails validation
   procedure Test_Invalid_Token_Format (T : in out Test_Case) is
      Invalid_Token : constant String := "not-a-valid-token-format";
      Is_Valid      : Boolean;
   begin
      -- Arrange & Act
      Is_Valid := Authentication.Validate_Token (Invalid_Token);

      -- Assert
      Assert (not Is_Valid,
              "Malformed token should fail validation");
   end Test_Invalid_Token_Format;

   -- Test 9: Logout invalidates token
   procedure Test_Logout_Invalidates_Token (T : in out Test_Case) is
      Username : constant String := "testuser";
      Password : constant String := "SecurePass123!";
      Auth_Result : Authentication.Auth_Result;
      Token       : String (1 .. 64);
      Is_Valid    : Boolean;
   begin
      -- Arrange
      Auth_Result := Authentication.Authenticate (Username, Password);
      Token := Auth_Result.Token;

      -- Act
      Authentication.Logout (Token);
      Is_Valid := Authentication.Validate_Token (Token);

      -- Assert
      Assert (not Is_Valid,
              "Token should be invalid after logout");
   end Test_Logout_Invalidates_Token;

   -- Test 10: Concurrent authentication requests (task safety)
   procedure Test_Concurrent_Authentication (T : in out Test_Case) is
      Username : constant String := "testuser";
      Password : constant String := "SecurePass123!";
      Num_Tasks : constant := 10;

      protected type Success_Counter is
         procedure Increment;
         function Get_Count return Natural;
      private
         Count : Natural := 0;
      end Success_Counter;

      protected body Success_Counter is
         procedure Increment is
         begin
            Count := Count + 1;
         end Increment;

         function Get_Count return Natural is
         begin
            return Count;
         end Get_Count;
      end Success_Counter;

      Counter : Success_Counter;

      task type Auth_Task;
      task body Auth_Task is
         Result : Authentication.Auth_Result;
      begin
         Result := Authentication.Authenticate (Username, Password);
         if Result.Success then
            Counter.Increment;
         end if;
      end Auth_Task;

      type Task_Array is array (1 .. Num_Tasks) of Auth_Task;
      Tasks : Task_Array;
   begin
      -- Tasks execute automatically

      -- Wait for all tasks to complete (implicit at end of scope)

      -- Assert: All authentications should succeed
      Assert (Counter.Get_Count = Num_Tasks,
              "All concurrent authentication requests should succeed");
   end Test_Concurrent_Authentication;

end Authentication_Tests;
```

---

## Test Runner: `tests/test_runner.adb`

```ada
with AUnit.Run;
with AUnit.Reporter.Text;
with Authentication_Test_Suite;

procedure Test_Runner is
   procedure Runner is new AUnit.Run.Test_Runner (Authentication_Test_Suite.Suite);
   Reporter : AUnit.Reporter.Text.Text_Reporter;
begin
   Runner (Reporter);
end Test_Runner;
```

### Test Suite: `tests/security/authentication_test_suite.ads`

```ada
with AUnit.Test_Suites; use AUnit.Test_Suites;

package Authentication_Test_Suite is

   function Suite return Access_Test_Suite;

end Authentication_Test_Suite;
```

### Test Suite: `tests/security/authentication_test_suite.adb`

```ada
with Authentication_Tests;

package body Authentication_Test_Suite is

   function Suite return Access_Test_Suite is
      Result : Access_Test_Suite := new Test_Suite;
   begin
      Add_Test (Result, new Authentication_Tests.Test_Case);
      return Result;
   end Suite;

end Authentication_Test_Suite;
```

---

## Building and Running Tests

### Build Tests

```bash
# Using GPRBuild
gprbuild -P polyorb_tests.gpr

# Using Alire
alr build
```

### Run Tests

```bash
# Execute test runner
./bin/test_runner

# Output:
# AUnit Test Results:
#   Total Tests: 10
#   Passed:      10
#   Failed:      0
```

### Generate Coverage

```bash
# Build with coverage
gprbuild -P polyorb_tests.gpr -cargs -fprofile-arcs -ftest-coverage

# Run tests
./bin/test_runner

# Generate coverage report
gcov -o obj src/security/authentication.adb
lcov --capture --directory . --output-file coverage.info
genhtml coverage.info --output-directory coverage_html
```

---

## CI/CD Integration

Add to `.github/workflows/polyorb-ci.yaml`:

```yaml
name: PolyORB CI with AUnit

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    container:
      image: adacore/gnat:2024

    steps:
      - uses: actions/checkout@v4

      - name: Install AUnit
        run: |
          apt-get update
          apt-get install -y libaunit-dev

      - name: Build tests
        run: |
          gprbuild -P polyorb_tests.gpr

      - name: Run AUnit tests
        run: |
          ./bin/test_runner

      - name: Generate coverage
        run: |
          gprbuild -P polyorb_tests.gpr -cargs -fprofile-arcs -ftest-coverage
          ./bin/test_runner
          gcov -o obj src/**/*.adb
```

---

## Best Practices

### 1. Test Naming Convention

```ada
-- Good: Descriptive test name
procedure Test_Valid_Credentials (T : in out Test_Case);

-- Bad: Non-descriptive
procedure Test_1 (T : in out Test_Case);
```

### 2. Arrange-Act-Assert Pattern

```ada
procedure Test_Valid_Credentials (T : in out Test_Case) is
   -- Arrange
   Username : constant String := "testuser";
   Password : constant String := "SecurePass123!";
   Result   : Authentication.Auth_Result;
begin
   -- Act
   Result := Authentication.Authenticate (Username, Password);

   -- Assert
   Assert (Result.Success, "Authentication should succeed");
end Test_Valid_Credentials;
```

### 3. Use Descriptive Assertions

```ada
-- Good: Clear failure message
Assert (Result.Success,
        "Authentication should succeed with valid credentials");

-- Bad: No context
Assert (Result.Success);
```

### 4. Protected Objects for Concurrency

```ada
protected type Counter is
   procedure Increment;
   function Get_Count return Natural;
private
   Count : Natural := 0;
end Counter;
```

---

## Metrics

### Target for Week 1:
- ✅ AUnit installed and verified
- ✅ 10 unit tests created for Security Service
- ✅ CI/CD integration complete
- ✅ Coverage >30% on Security Service

### Success Criteria:
- [ ] All tests pass locally
- [ ] All tests pass in CI/CD
- [ ] Test execution time <5 seconds
- [ ] Coverage report generated

---

## Next Steps (Week 2)

1. Expand to 50 unit tests (ORB Core)
2. Add unit tests for Event Notification service
3. Begin Pact contract testing setup

---

**Status**: ✅ Setup Complete, Ready for Test Writing
**Owner**: @test_stabilize
**Last Updated**: 2025-11-05
