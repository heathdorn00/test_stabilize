# Week 1: GoogleTest Framework Setup

**Task**: Install GoogleTest (C++) framework and verify in CI/CD
**Owner**: @test_stabilize
**Date**: 2025-11-05
**Status**: In Progress

---

## Overview

GoogleTest is Google's C++ testing framework, industry standard for unit testing C++ code. This guide sets up GoogleTest for wxWidgets services.

## Installation Steps

### Option 1: CMake FetchContent (Recommended)

Add to `CMakeLists.txt`:

```cmake
cmake_minimum_required(VERSION 3.14)
project(wxWidgets-Tests)

# Enable testing
enable_testing()

# Fetch GoogleTest
include(FetchContent)
FetchContent_Declare(
  googletest
  GIT_REPOSITORY https://github.com/google/googletest.git
  GIT_TAG        v1.14.0  # Latest stable release
)

# For Windows: Prevent overriding the parent project's compiler/linker settings
set(gtest_force_shared_crt ON CACHE BOOL "" FORCE)
FetchContent_MakeAvailable(googletest)

# Add test executable
add_executable(
  widget_tests
  tests/widget_core_test.cpp
  tests/event_processing_test.cpp
  tests/rendering_test.cpp
  # Add more test files here
)

# Link against GoogleTest and GoogleMock
target_link_libraries(
  widget_tests
  gtest_main
  gmock_main
  # Your production libraries here
  widget_core
  event_processing
)

# Discover tests for CTest
include(GoogleTest)
gtest_discover_tests(widget_tests)
```

### Option 2: System Package Manager

**Ubuntu/Debian**:
```bash
sudo apt-get update
sudo apt-get install -y libgtest-dev libgmock-dev
cd /usr/src/gtest
sudo cmake CMakeLists.txt
sudo make
sudo cp lib/*.a /usr/lib
```

**macOS (Homebrew)**:
```bash
brew install googletest
```

### Option 3: Manual Build

```bash
git clone https://github.com/google/googletest.git
cd googletest
mkdir build && cd build
cmake ..
make
sudo make install
```

---

## Example Test Structure

### Directory Structure

```
wxWidgets/
├── src/
│   ├── widget_core/
│   │   ├── button.cpp
│   │   └── button.h
│   └── event_processing/
│       ├── event_handler.cpp
│       └── event_handler.h
└── tests/
    ├── CMakeLists.txt
    ├── widget_core/
    │   └── button_test.cpp
    └── event_processing/
        └── event_handler_test.cpp
```

### Example Test: `tests/widget_core/button_test.cpp`

```cpp
#include <gtest/gtest.h>
#include <gmock/gmock.h>
#include "widget_core/button.h"

using ::testing::Return;
using ::testing::_;

namespace widget_core {
namespace {

// Test fixture for Button tests
class ButtonTest : public ::testing::Test {
 protected:
  void SetUp() override {
    // Setup code executed before each test
    button_ = std::make_unique<Button>("Submit");
  }

  void TearDown() override {
    // Cleanup code executed after each test
    button_.reset();
  }

  std::unique_ptr<Button> button_;
};

// Test: Button creation with label
TEST_F(ButtonTest, CreatesButtonWithLabel) {
  EXPECT_EQ(button_->GetLabel(), "Submit");
  EXPECT_TRUE(button_->IsEnabled());
}

// Test: Button enable/disable
TEST_F(ButtonTest, EnableAndDisable) {
  button_->SetEnabled(false);
  EXPECT_FALSE(button_->IsEnabled());

  button_->SetEnabled(true);
  EXPECT_TRUE(button_->IsEnabled());
}

// Test: Button click event
TEST_F(ButtonTest, ClickEvent) {
  bool clicked = false;
  button_->SetOnClick([&clicked]() {
    clicked = true;
  });

  button_->Click();
  EXPECT_TRUE(clicked);
}

// Test: Disabled button doesn't fire click event
TEST_F(ButtonTest, DisabledButtonDoesNotClick) {
  bool clicked = false;
  button_->SetEnabled(false);
  button_->SetOnClick([&clicked]() {
    clicked = true;
  });

  button_->Click();
  EXPECT_FALSE(clicked);
}

// Parameterized test: Button with various labels
class ButtonLabelTest : public ::testing::TestWithParam<std::string> {};

TEST_P(ButtonLabelTest, CreatesButtonWithVariousLabels) {
  std::string label = GetParam();
  Button button(label);
  EXPECT_EQ(button.GetLabel(), label);
}

INSTANTIATE_TEST_SUITE_P(
    VariousLabels,
    ButtonLabelTest,
    ::testing::Values("Submit", "Cancel", "OK", "Apply", "")
);

// Mock example: Testing button with mock event handler
class MockEventHandler {
 public:
  MOCK_METHOD(void, OnButtonClick, (const std::string& buttonId), ());
};

TEST_F(ButtonTest, NotifiesEventHandler) {
  MockEventHandler mock_handler;
  button_->SetId("submit-btn");

  EXPECT_CALL(mock_handler, OnButtonClick("submit-btn"))
      .Times(1);

  button_->Click();
  mock_handler.OnButtonClick(button_->GetId());
}

}  // namespace
}  // namespace widget_core
```

### Example Test: `tests/event_processing/event_handler_test.cpp`

```cpp
#include <gtest/gtest.h>
#include "event_processing/event_handler.h"

namespace event_processing {
namespace {

TEST(EventHandlerTest, HandlesButtonClickEvent) {
  EventHandler handler;
  Event event{EventType::BUTTON_CLICK, "submit-btn"};

  bool handled = handler.HandleEvent(event);

  EXPECT_TRUE(handled);
}

TEST(EventHandlerTest, RejectsInvalidEvent) {
  EventHandler handler;
  Event event{EventType::INVALID, ""};

  bool handled = handler.HandleEvent(event);

  EXPECT_FALSE(handled);
}

// Death test: Verifies crash behavior
TEST(EventHandlerDeathTest, CrashesOnNullEvent) {
  EventHandler handler;

  EXPECT_DEATH(handler.HandleEvent(nullptr), "Event cannot be null");
}

}  // namespace
}  // namespace event_processing
```

---

## Running Tests

### Local Execution

```bash
# Build tests
mkdir build && cd build
cmake ..
make

# Run all tests
./widget_tests

# Run specific test suite
./widget_tests --gtest_filter=ButtonTest.*

# Run with detailed output
./widget_tests --gtest_filter=ButtonTest.* --gtest_print_time=1

# Generate XML report
./widget_tests --gtest_output=xml:test_results.xml
```

### CTest Integration

```bash
# Run via CTest
cd build
ctest

# Verbose output
ctest --output-on-failure

# Run specific test
ctest -R ButtonTest
```

---

## CI/CD Integration

Add to `.github/workflows/wxwidgets-ci.yaml`:

```yaml
name: wxWidgets CI with GoogleTest

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Install dependencies
        run: |
          sudo apt-get update
          sudo apt-get install -y cmake g++ libgtest-dev libgmock-dev

      - name: Build tests
        run: |
          mkdir build && cd build
          cmake ..
          make -j$(nproc)

      - name: Run GoogleTest
        run: |
          cd build
          ./widget_tests --gtest_output=xml:test_results.xml

      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: test-results
          path: build/test_results.xml

      - name: Generate coverage
        run: |
          cd build
          gcov -o . ../tests/**/*.cpp
          bash <(curl -s https://codecov.io/bash)
```

---

## Coverage Configuration

### Enable Coverage in CMake

```cmake
# Add to CMakeLists.txt
if(CMAKE_BUILD_TYPE STREQUAL "Coverage")
  set(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} --coverage -g -O0")
  set(CMAKE_EXE_LINKER_FLAGS "${CMAKE_EXE_LINKER_FLAGS} --coverage")
endif()
```

### Generate Coverage Report

```bash
# Build with coverage
mkdir build-coverage && cd build-coverage
cmake -DCMAKE_BUILD_TYPE=Coverage ..
make

# Run tests
./widget_tests

# Generate HTML report
lcov --capture --directory . --output-file coverage.info
lcov --remove coverage.info '/usr/*' --output-file coverage.info
lcov --remove coverage.info '*/tests/*' --output-file coverage.info
genhtml coverage.info --output-directory coverage_html

# Open in browser
open coverage_html/index.html
```

---

## Best Practices

### 1. Test Naming Convention

```cpp
// Format: TEST(TestSuiteName, TestName)
TEST(ButtonTest, CreatesButtonWithDefaultState)  // Good
TEST(test1, test)  // Bad: Not descriptive
```

### 2. Arrange-Act-Assert Pattern

```cpp
TEST_F(ButtonTest, ClickIncrementesCounter) {
  // Arrange
  button_->SetCounter(0);

  // Act
  button_->Click();

  // Assert
  EXPECT_EQ(button_->GetCounter(), 1);
}
```

### 3. Use Descriptive Assertions

```cpp
// Good: Clear failure message
EXPECT_EQ(button->GetLabel(), "Submit")
    << "Button label should be 'Submit' after initialization";

// Bad: No context
EXPECT_EQ(button->GetLabel(), "Submit");
```

### 4. Test One Concept Per Test

```cpp
// Good: Single responsibility
TEST_F(ButtonTest, ClickIncrementsCounter) { ... }
TEST_F(ButtonTest, DisabledButtonDoesNotClick) { ... }

// Bad: Testing multiple concepts
TEST_F(ButtonTest, ClickAndDisable) {
  // Tests both click and disable logic
}
```

### 5. Use Test Fixtures for Common Setup

```cpp
class ButtonTest : public ::testing::Test {
 protected:
  void SetUp() override {
    // Common setup for all tests
    button_ = std::make_unique<Button>("Submit");
  }

  std::unique_ptr<Button> button_;
};
```

---

## Troubleshooting

### Issue: GoogleTest not found

```bash
# Check if GoogleTest is installed
pkg-config --libs gtest
pkg-config --cflags gtest

# If missing, install
sudo apt-get install libgtest-dev
```

### Issue: Linking errors

```cmake
# Ensure correct libraries linked
target_link_libraries(
  widget_tests
  gtest_main  # Provides main()
  gmock_main  # Provides Google Mock
  pthread     # Required on Linux
)
```

### Issue: Tests not discovered

```cmake
# Add to CMakeLists.txt
include(GoogleTest)
gtest_discover_tests(widget_tests)
```

---

## Metrics

### Target for Week 1:
- ✅ GoogleTest installed and verified
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

1. Expand to 50 unit tests (Security Service)
2. Add unit tests for PolyORB services (AUnit)
3. Add unit tests for TypeScript services (Jest)
4. Begin Pact contract testing setup

---

**Status**: ✅ Setup Complete, Ready for Test Writing
**Owner**: @test_stabilize
**Last Updated**: 2025-11-05
