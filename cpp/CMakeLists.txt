cmake_minimum_required(VERSION 3.14)
project(StringUtilsTests)

# Set C++ standard
set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

# Enable testing
enable_testing()

# Find GoogleTest
find_package(GTest REQUIRED)
include_directories(${GTEST_INCLUDE_DIRS})

# Add source files (header-only in this case)
include_directories(${PROJECT_SOURCE_DIR}/src)

# Create test executable
add_executable(string_utils_test
    tests/string_utils_test.cpp
)

# Link GoogleTest
target_link_libraries(string_utils_test
    ${GTEST_LIBRARIES}
    pthread
)

# Add test
add_test(NAME StringUtilsTest COMMAND string_utils_test)

# Enable CTest
include(CTest)
