# CMakeLists.txt for Auth Service with GoogleTest
# Task 5613bc: GoogleTest Rollout - Phase 1 Critical Service
cmake_minimum_required(VERSION 3.14)
project(AuthServiceTests VERSION 1.0)

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

# ============================================================================
# Sanitizer Configurations (Task 7de375)
# ============================================================================

# AddressSanitizer configuration
if(ENABLE_ASAN OR CMAKE_BUILD_TYPE STREQUAL "ASan")
  message(STATUS "Enabling AddressSanitizer")
  set(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} -fsanitize=address -fno-omit-frame-pointer -g -O1")
  set(CMAKE_EXE_LINKER_FLAGS "${CMAKE_EXE_LINKER_FLAGS} -fsanitize=address")
  set(CMAKE_SHARED_LINKER_FLAGS "${CMAKE_SHARED_LINKER_FLAGS} -fsanitize=address")
endif()

# UndefinedBehaviorSanitizer configuration
if(ENABLE_UBSAN OR CMAKE_BUILD_TYPE STREQUAL "UBSan")
  message(STATUS "Enabling UndefinedBehaviorSanitizer")
  set(UBSAN_FLAGS "undefined,integer,float-divide-by-zero,implicit-conversion,nullability")
  set(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} -fsanitize=${UBSAN_FLAGS} -fno-omit-frame-pointer -g -O1")
  set(CMAKE_EXE_LINKER_FLAGS "${CMAKE_EXE_LINKER_FLAGS} -fsanitize=${UBSAN_FLAGS}")
  set(CMAKE_SHARED_LINKER_FLAGS "${CMAKE_SHARED_LINKER_FLAGS} -fsanitize=${UBSAN_FLAGS}")
endif()

# Combined ASan + UBSan configuration
if(ENABLE_SANITIZERS OR CMAKE_BUILD_TYPE STREQUAL "Sanitizers")
  message(STATUS "Enabling AddressSanitizer + UndefinedBehaviorSanitizer")
  set(SANITIZER_FLAGS "address,undefined")
  set(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} -fsanitize=${SANITIZER_FLAGS} -fno-omit-frame-pointer -g -O1")
  set(CMAKE_EXE_LINKER_FLAGS "${CMAKE_EXE_LINKER_FLAGS} -fsanitize=${SANITIZER_FLAGS}")
  set(CMAKE_SHARED_LINKER_FLAGS "${CMAKE_SHARED_LINKER_FLAGS} -fsanitize=${SANITIZER_FLAGS}")
endif()

# Add test executable
add_executable(
  auth_service_tests
  tests/authentication_test.cpp
  tests/authorization_test.cpp
  tests/session_management_test.cpp
  tests/token_validation_test.cpp
  tests/password_security_test.cpp
)

# Link against GoogleTest, GoogleMock
target_link_libraries(
  auth_service_tests
  gtest_main
  gmock_main
  pthread
)

# Include directories
target_include_directories(
  auth_service_tests PRIVATE
  ${CMAKE_SOURCE_DIR}/src
  ${CMAKE_SOURCE_DIR}/tests
)

# Discover tests for CTest
include(GoogleTest)
gtest_discover_tests(auth_service_tests)

# Add custom target for running tests with verbose output
add_custom_target(test_verbose
  COMMAND ${CMAKE_CTEST_COMMAND} --output-on-failure
  DEPENDS auth_service_tests
)

# Coverage target
if(CMAKE_BUILD_TYPE STREQUAL "Coverage")
  find_program(LCOV lcov)
  find_program(GENHTML genhtml)

  if(LCOV AND GENHTML)
    add_custom_target(coverage
      COMMAND ${CMAKE_COMMAND} --build ${CMAKE_BINARY_DIR} --target auth_service_tests
      COMMAND ./auth_service_tests
      COMMAND ${LCOV} --capture --directory . --output-file coverage.info
      COMMAND ${LCOV} --remove coverage.info '/usr/*' --output-file coverage.info
      COMMAND ${LCOV} --remove coverage.info '*/tests/*' --output-file coverage.info
      COMMAND ${GENHTML} coverage.info --output-directory coverage_html
      WORKING_DIRECTORY ${CMAKE_BINARY_DIR}
      COMMENT "Generating code coverage report for Auth Service"
    )
  endif()
endif()
