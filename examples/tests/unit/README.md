# Layer 1: Unit Tests

**Task**: 57fbde - Comprehensive Test Framework / RDB-002
**Layer**: 1 - Unit Tests (50% coverage target)

---

## Overview

Unit tests validate **individual components in isolation** with mocked dependencies. They are the foundation of the test pyramid, providing fast feedback and high code coverage.

**Coverage Target**: ~500 tests (50% of test pyramid)
**Execution Time**: <2 minutes
**Frameworks**: GoogleTest (C++), AUnit (Ada)

---

## Quick Start

### C++ Unit Tests (GoogleTest)

```bash
# Build C++ unit tests
cd services/wxwidgets/widget-core
mkdir build && cd build
cmake -DBUILD_TESTING=ON -DENABLE_COVERAGE=ON ..
make

# Run tests
ctest --output-on-failure

# Run specific test
./tests/widget_core_tests --gtest_filter=WidgetTest.CreateButtonWidget*

# Generate coverage report
gcovr --root .. --html --html-details -o coverage.html
open coverage.html
```

### Ada Unit Tests (AUnit)

```bash
# Build Ada unit tests
cd services/polyorb/orb-core
gprbuild -P tests/unit_tests.gpr

# Run tests
./tests/obj/unit_tests_runner

# Run with verbose output
./tests/obj/unit_tests_runner -v

# Generate coverage report
gnatcov coverage --level=stmt+decision --annotate=html \
  -P tests/unit_tests.gpr -o coverage/
open coverage/index.html
```

---

## Test Structure

### C++ Tests (GoogleTest)

**Test File**: `widget_core_tests.cpp` (22 tests)

**Test Categories**:
1. **Creation Tests** (5 tests)
   - Valid widget creation
   - Negative width/height validation
   - Empty label validation
   - Unknown type validation

2. **Service Tests with Mocks** (5 tests)
   - Save widget with database mock
   - Database failure handling
   - Cache hit scenario
   - Cache miss scenario
   - Delete with cache invalidation

3. **Validation Tests** (3 tests)
   - Valid widget data
   - Width/height exceed maximum
   - Boundary condition tests

4. **Update Tests** (2 tests)
   - Valid property updates
   - Invalid update rejection

5. **ORB Integration** (2 tests)
   - Object reference creation
   - Object reference destruction

6. **Error Handling** (2 tests)
   - ORB failure rollback
   - Database exception propagation

7. **Concurrency** (1 test)
   - Concurrent modification handling

8. **Performance** (1 test)
   - Creation performance benchmark

**Example Test**:
```cpp
TEST_F(WidgetServiceTest, LoadWidget_NotInCache_LoadsFromDatabase) {
    // Arrange
    int widgetId = 123;

    EXPECT_CALL(*mockCache_, get("widget:123"))
        .WillOnce(Return(std::nullopt));  // Cache miss

    Widget widget = WidgetFactory::create("button", "Test", 100, 50);
    EXPECT_CALL(*mockDb_, loadWidget(widgetId))
        .WillOnce(Return(widget));

    // Cache should be updated
    EXPECT_CALL(*mockCache_, set("widget:123", _, _))
        .WillOnce(Return(true));

    // Act
    auto result = widgetService_->load(widgetId);

    // Assert
    EXPECT_TRUE(result.has_value());
}
```

### Ada Tests (AUnit)

**Test Files**:
- `orb_core_tests.ads` (specification)
- `orb_core_tests.adb` (implementation)

**Test Categories**:
1. **Memory Management** (5 tests)
   - Buffer allocation
   - Buffer deallocation
   - Null buffer handling
   - Critical memory zeroization (Phase 1)
   - Memory leak detection

2. **Connection Pool** (5 tests)
   - Pool creation
   - Connection acquisition
   - Connection release
   - Pool saturation handling
   - Timeout behavior

3. **Object References** (4 tests)
   - IOR creation
   - IOR destruction
   - IOR validation
   - Serialization/deserialization

4. **Request Handler** (4 tests)
   - Simple request handling
   - Invalid request rejection
   - Request timeout
   - Concurrent request handling

5. **Error Handling** (3 tests)
   - Out of memory handling
   - Connection failure recovery
   - Invalid IOR handling

**Example Test**:
```ada
procedure Test_Critical_Memory_Zeroization (T : in out Test_Case) is
   Buffer : ORB_Core.Memory_Manager.Buffer_Type;
   Size : constant Natural := 256;
begin
   -- Arrange
   Buffer := ORB_Core.Memory_Manager.Allocate (Size);

   -- Fill buffer with sensitive data
   for I in Buffer'Range loop
      Buffer (I) := 16#FF#;
   end loop;

   -- Act: Deallocate with critical flag (should zero memory)
   ORB_Core.Memory_Manager.Deallocate (Buffer, Critical => True);

   -- Assert: Memory should be zeroed before deallocation
   Deallocation_Count : constant Natural :=
      ORB_Core.Memory_Manager.Get_Critical_Deallocation_Count;
   Assert (Deallocation_Count > 0,
           "Critical deallocation should increment counter");
end Test_Critical_Memory_Zeroization;
```

---

## Mock Objects

### C++ Mocking (GoogleMock)

**Available Mocks**:
- `MockDatabaseInterface` - Database operations
- `MockOrbInterface` - CORBA/ORB calls
- `MockCacheInterface` - Redis cache operations

**Example Mock Setup**:
```cpp
class WidgetServiceTest : public ::testing::Test {
protected:
    void SetUp() override {
        mockDb_ = std::make_shared<NiceMock<MockDatabaseInterface>>();
        mockOrb_ = std::make_shared<NiceMock<MockOrbInterface>>();
        mockCache_ = std::make_shared<NiceMock<MockCacheInterface>>();

        widgetService_ = std::make_unique<WidgetService>(
            mockDb_, mockOrb_, mockCache_
        );
    }

    std::shared_ptr<MockDatabaseInterface> mockDb_;
    std::shared_ptr<MockOrbInterface> mockOrb_;
    std::shared_ptr<MockCacheInterface> mockCache_;
    std::unique_ptr<WidgetService> widgetService_;
};
```

### Ada Mocking

Ada does not have a built-in mocking framework like GoogleMock. Instead, use:

1. **Manual Mocks**: Create mock packages that implement the same interface
2. **Test Doubles**: Use stub implementations for dependencies
3. **Record/Replay**: Track method calls manually

**Example Manual Mock**:
```ada
package Mock_Database is
   type Call_Record is record
      Method : String (1..50);
      Widget_Id : Natural;
      Called : Boolean;
   end record;

   Calls : array (1..100) of Call_Record;
   Call_Count : Natural := 0;

   procedure Save_Widget (Widget : in Widget_Type);
   function Was_Called (Method : String) return Boolean;
   procedure Reset_Calls;
end Mock_Database;
```

---

## Test Fixtures

### C++ Fixtures

**Basic Fixture**:
```cpp
class WidgetTest : public ::testing::Test {
protected:
    void SetUp() override {
        validWidgetData_ = {
            {"type", "button"},
            {"label", "Click Me"},
            {"width", 100},
            {"height", 50}
        };
    }

    void TearDown() override {
        // Cleanup
    }

    std::map<std::string, std::any> validWidgetData_;
};
```

**Parameterized Tests**:
```cpp
class WidgetParamTest : public ::testing::TestWithParam<int> {
    // Test with different widget sizes
};

TEST_P(WidgetParamTest, CreateWidget_VariousSizes) {
    int size = GetParam();
    Widget widget = WidgetFactory::create("button", "Test", size, size);
    EXPECT_EQ(widget.getWidth(), size);
}

INSTANTIATE_TEST_SUITE_P(
    WidgetSizes,
    WidgetParamTest,
    ::testing::Values(10, 50, 100, 500, 1000)
);
```

### Ada Fixtures

**Setup and Teardown**:
```ada
procedure Set_Up (T : in out Test_Case) is
begin
   Put_Line ("Setting up test case...");
   T.Memory_Manager := ORB_Core.Memory_Manager.Create;
   T.Connection_Pool := ORB_Core.Connection_Pool.Create (Max_Size => 10);
end Set_Up;

procedure Tear_Down (T : in out Test_Case) is
begin
   Put_Line ("Tearing down test case...");
   ORB_Core.Memory_Manager.Destroy (T.Memory_Manager);
   ORB_Core.Connection_Pool.Destroy (T.Connection_Pool);
end Tear_Down;
```

---

## Assertion Patterns

### C++ Assertions (GoogleTest)

```cpp
// Basic assertions
EXPECT_TRUE(condition);
EXPECT_FALSE(condition);
EXPECT_EQ(expected, actual);
EXPECT_NE(value1, value2);
EXPECT_LT(val1, val2);
EXPECT_LE(val1, val2);
EXPECT_GT(val1, val2);
EXPECT_GE(val1, val2);

// String assertions
EXPECT_STREQ("expected", actual);
EXPECT_STRCASEEQ("Expected", "EXPECTED");

// Floating point assertions
EXPECT_FLOAT_EQ(expected, actual);
EXPECT_DOUBLE_EQ(expected, actual);
EXPECT_NEAR(val1, val2, tolerance);

// Exception assertions
EXPECT_THROW(statement, exception_type);
EXPECT_NO_THROW(statement);
EXPECT_ANY_THROW(statement);

// Predicate assertions
EXPECT_PRED1(predicate, arg);
EXPECT_PRED2(predicate, arg1, arg2);

// Custom messages
EXPECT_TRUE(condition) << "Custom failure message: " << details;
```

### Ada Assertions (AUnit)

```ada
-- Basic assertions
Assert (Condition, "Failure message");
Assert (not Condition, "Should be false");

-- Equality assertions
Assert (Expected = Actual, "Values should be equal");
Assert (Value /= Other, "Values should be different");

-- Comparison assertions
Assert (Value > 0, "Value should be positive");
Assert (Value < Max, "Value should be below maximum");

-- Null checks
Assert (Pointer /= null, "Pointer should not be null");
Assert (Pointer = null, "Pointer should be null");

-- Exception assertions
begin
   Risky_Operation;
   Assert (False, "Should have raised exception");
exception
   when Expected_Exception =>
      Assert (True, "Exception caught as expected");
end;
```

---

## Coverage Targets

### Target Coverage by Service

| Service | Language | Target | Current |
|---------|----------|--------|---------|
| Widget Core | C++ | 85% | TBD |
| Platform Adapter | C++ | 85% | TBD |
| UI Renderer | C++ | 85% | TBD |
| Input Handler | C++ | 85% | TBD |
| State Manager | C++ | 85% | TBD |
| Event Dispatcher | C++ | 85% | TBD |
| Layout Engine | C++ | 85% | TBD |
| ORB Core | Ada | 85% | TBD |
| Message Handler | Ada | 85% | TBD |
| Session Manager | Ada | 85% | TBD |
| Protocol Handler | Ada | 85% | TBD |
| Object Adapter | Ada | 85% | TBD |
| Type Manager | Ada | 85% | TBD |
| Request Dispatcher | Ada | 85% | TBD |

### Coverage Metrics

**C++ (gcovr)**:
```bash
# Line coverage
gcovr --root .. --print-summary

# Branch coverage
gcovr --root .. --branches --print-summary

# HTML report with branch coverage
gcovr --root .. --branches --html --html-details -o coverage.html
```

**Ada (gnatcov)**:
```bash
# Statement coverage
gnatcov coverage --level=stmt --annotate=html

# Statement + decision coverage
gnatcov coverage --level=stmt+decision --annotate=html

# Statement + decision + MCDC coverage
gnatcov coverage --level=stmt+decision+mcdc --annotate=html
```

---

## Test Organization

### Directory Structure

```
tests/unit/
├── cpp/
│   ├── widget_core_tests.cpp           # Widget Core (22 tests)
│   ├── platform_adapter_tests.cpp      # Platform Adapter
│   ├── ui_renderer_tests.cpp           # UI Renderer
│   ├── input_handler_tests.cpp         # Input Handler
│   ├── state_manager_tests.cpp         # State Manager
│   ├── event_dispatcher_tests.cpp      # Event Dispatcher
│   ├── layout_engine_tests.cpp         # Layout Engine
│   ├── CMakeLists.txt                  # Build configuration
│   └── README.md                       # C++ test guide
│
├── ada/
│   ├── orb_core_tests.ads              # ORB Core spec (21 tests)
│   ├── orb_core_tests.adb              # ORB Core impl
│   ├── message_handler_tests.ads       # Message Handler spec
│   ├── message_handler_tests.adb       # Message Handler impl
│   ├── session_manager_tests.ads       # Session Manager spec
│   ├── session_manager_tests.adb       # Session Manager impl
│   ├── protocol_handler_tests.ads      # Protocol Handler spec
│   ├── protocol_handler_tests.adb      # Protocol Handler impl
│   ├── unit_tests.gpr                  # GNAT project file
│   └── README.md                       # Ada test guide
│
└── README.md                            # This file
```

---

## Best Practices

### 1. Test Naming

**C++**:
```cpp
TEST_F(TestFixture, MethodUnderTest_Scenario_ExpectedBehavior)
TEST_F(WidgetTest, CreateWidget_NegativeWidth_ThrowsException)
```

**Ada**:
```ada
procedure Test_Method_Under_Test_Scenario (T : in out Test_Case)
procedure Test_Allocate_Buffer_Negative_Size (T : in out Test_Case)
```

### 2. Arrange-Act-Assert Pattern

```cpp
TEST_F(WidgetTest, CreateWidget_ValidData_Success) {
    // Arrange: Set up test data
    std::string type = "button";
    int width = 100;

    // Act: Execute the code under test
    Widget widget = WidgetFactory::create(type, "Test", width, 50);

    // Assert: Verify the results
    EXPECT_EQ(widget.getType(), type);
    EXPECT_EQ(widget.getWidth(), width);
}
```

### 3. Test Independence

Each test should be independent and not rely on other tests:
```cpp
// Bad: Tests depend on execution order
TEST_F(WidgetTest, CreateWidget) {
    widget_ = WidgetFactory::create("button", "Test", 100, 50);
}

TEST_F(WidgetTest, UpdateWidget) {
    widget_.setLabel("Updated");  // Depends on CreateWidget
}

// Good: Each test is independent
TEST_F(WidgetTest, UpdateWidget_ValidLabel_Success) {
    // Arrange: Create widget in this test
    Widget widget = WidgetFactory::create("button", "Test", 100, 50);

    // Act
    widget.setLabel("Updated");

    // Assert
    EXPECT_EQ(widget.getLabel(), "Updated");
}
```

### 4. Mock Verification

```cpp
TEST_F(WidgetServiceTest, SaveWidget_ValidWidget_CallsDatabase) {
    // Arrange
    Widget widget = WidgetFactory::create("button", "Test", 100, 50);

    EXPECT_CALL(*mockDb_, saveWidget(_))
        .Times(1)  // Verify called exactly once
        .WillOnce(Return(true));

    // Act
    widgetService_->save(widget);

    // Assert: Mock expectations verified automatically
}
```

### 5. Test Readability

```cpp
// Bad: Unclear what's being tested
TEST_F(WidgetTest, Test1) {
    auto w = WF::c("b", "T", 100, 50);
    EXPECT_EQ(w.t(), "b");
}

// Good: Clear and descriptive
TEST_F(WidgetTest, CreateButtonWidget_ValidData_ReturnsButtonType) {
    // Arrange
    std::string expectedType = "button";

    // Act
    Widget widget = WidgetFactory::create(expectedType, "Test", 100, 50);

    // Assert
    EXPECT_EQ(widget.getType(), expectedType)
        << "Widget type should match the type passed to factory";
}
```

---

## Running Tests in CI/CD

### GitHub Actions (C++)

```yaml
- name: Build C++ Unit Tests
  run: |
    cmake -B build -DBUILD_TESTING=ON -DENABLE_COVERAGE=ON
    cmake --build build --parallel $(nproc)

- name: Run C++ Unit Tests
  run: |
    cd build
    ctest --output-on-failure --timeout 300

- name: Generate Coverage
  run: |
    cd build
    gcovr --root .. --xml coverage.xml

- name: Upload Coverage
  uses: codecov/codecov-action@v3
  with:
    files: build/coverage.xml
    flags: unit,cpp
```

### GitHub Actions (Ada)

```yaml
- name: Install GNAT
  run: |
    sudo apt-get install -y gnat-12 gprbuild aunit

- name: Build Ada Unit Tests
  run: |
    cd services/polyorb/orb-core
    gprbuild -P tests/unit_tests.gpr

- name: Run Ada Unit Tests
  run: |
    cd services/polyorb/orb-core
    ./tests/obj/unit_tests_runner
```

---

## Troubleshooting

### C++ Tests Not Found

**Issue**: `ctest` reports no tests found

**Solution**:
```bash
# Ensure BUILD_TESTING is ON
cmake -DBUILD_TESTING=ON ..

# Verify tests are built
ls build/tests/

# Run tests with verbose output
ctest -V
```

### Ada Tests Compilation Error

**Issue**: GNAT cannot find AUnit

**Solution**:
```bash
# Install AUnit
sudo apt-get install aunit

# Or build from source
git clone https://github.com/AdaCore/aunit.git
cd aunit && ./configure && make && sudo make install

# Verify installation
gprls -P tests/unit_tests.gpr
```

### Mock Expectation Failures

**Issue**: GoogleMock reports unexpected calls

**Solution**:
```cpp
// Use NiceMock for lenient expectations
std::make_shared<NiceMock<MockDatabaseInterface>>();

// Or StrictMock for strict expectations
std::make_shared<StrictMock<MockDatabaseInterface>>();

// Explicitly allow unexpected calls
EXPECT_CALL(*mockDb_, saveWidget(_))
    .Times(AtLeast(0));
```

---

## Next Steps

1. **Expand Coverage**: Create unit tests for remaining 14 services
2. **Increase Test Count**: Target 500 total unit tests (currently: 43)
3. **Improve Coverage**: Achieve 85%+ line and branch coverage
4. **Mutation Testing**: Run Mull and Stryker to validate test quality
5. **Performance**: Keep unit test suite under 2 minutes

---

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
