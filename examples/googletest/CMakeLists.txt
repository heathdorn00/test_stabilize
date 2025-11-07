# CMakeLists.txt for wxWidgets Testing with GoogleTest
cmake_minimum_required(VERSION 3.14)
project(wxWidgets-Tests VERSION 1.0)

# Set C++ standard
set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

# Enable testing
enable_testing()

# Fetch GoogleTest
include(FetchContent)
FetchContent_Declare(
  googletest
  GIT_REPOSITORY https://github.com/google/googletest.git
  GIT_TAG        v1.14.0
)

# For Windows: Prevent overriding parent project's compiler/linker settings
set(gtest_force_shared_crt ON CACHE BOOL "" FORCE)
FetchContent_MakeAvailable(googletest)

# Coverage configuration
if(CMAKE_BUILD_TYPE STREQUAL "Coverage")
  set(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} --coverage -g -O0")
  set(CMAKE_EXE_LINKER_FLAGS "${CMAKE_EXE_LINKER_FLAGS} --coverage")
endif()

# Add test executable
add_executable(
  widget_tests
  tests/widget_core/button_test.cpp
  tests/widget_core/window_test.cpp
  tests/event_processing/event_handler_test.cpp
  tests/rendering/renderer_test.cpp
  tests/security/authentication_test.cpp
  tests/security/encryption_test.cpp
  tests/security/input_validation_test.cpp
  tests/security/mTLS_test.cpp
  tests/security/JWT_test.cpp
  tests/security/session_management_test.cpp
  # Add production code sources here
  # src/widget_core/button.cpp
  # src/widget_core/window.cpp
  # etc.
)

# Link against GoogleTest, GoogleMock, and production libraries
target_link_libraries(
  widget_tests
  gtest_main
  gmock_main
  pthread  # Required on Linux
  # Your production libraries:
  # widget_core
  # event_processing
  # rendering
  # security
)

# Include directories
target_include_directories(
  widget_tests PRIVATE
  ${CMAKE_SOURCE_DIR}/src
  ${CMAKE_SOURCE_DIR}/tests
)

# Discover tests for CTest
include(GoogleTest)
gtest_discover_tests(widget_tests)

# Add custom target for running tests
add_custom_target(test_verbose
  COMMAND ${CMAKE_CTEST_COMMAND} --output-on-failure
  DEPENDS widget_tests
)

# Add custom target for coverage
if(CMAKE_BUILD_TYPE STREQUAL "Coverage")
  find_program(LCOV lcov)
  find_program(GENHTML genhtml)

  if(LCOV AND GENHTML)
    add_custom_target(coverage
      COMMAND ${CMAKE_COMMAND} --build ${CMAKE_BINARY_DIR} --target widget_tests
      COMMAND ./widget_tests
      COMMAND ${LCOV} --capture --directory . --output-file coverage.info
      COMMAND ${LCOV} --remove coverage.info '/usr/*' --output-file coverage.info
      COMMAND ${LCOV} --remove coverage.info '*/tests/*' --output-file coverage.info
      COMMAND ${GENHTML} coverage.info --output-directory coverage_html
      WORKING_DIRECTORY ${CMAKE_BINARY_DIR}
      COMMENT "Generating code coverage report"
    )
  endif()
endif()
