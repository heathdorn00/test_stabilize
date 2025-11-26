# Sanitizers.cmake - Reusable sanitizer configuration module
# Task 7de375: Integrate ASan and UBSan into CI
#
# Usage in CMakeLists.txt:
#   include(${CMAKE_SOURCE_DIR}/../../cmake/Sanitizers.cmake)
#   # or: list(APPEND CMAKE_MODULE_PATH "${CMAKE_SOURCE_DIR}/../../cmake")
#   #     include(Sanitizers)
#
# Build with sanitizers:
#   cmake -DENABLE_ASAN=ON ..
#   cmake -DENABLE_UBSAN=ON ..
#   cmake -DENABLE_SANITIZERS=ON ..  # Both
#   cmake -DCMAKE_BUILD_TYPE=ASan ..
#   cmake -DCMAKE_BUILD_TYPE=UBSan ..
#   cmake -DCMAKE_BUILD_TYPE=Sanitizers ..
#
# @owner @test_stabilize
# @date 2025-11-26

# Options
option(ENABLE_ASAN "Enable AddressSanitizer" OFF)
option(ENABLE_UBSAN "Enable UndefinedBehaviorSanitizer" OFF)
option(ENABLE_SANITIZERS "Enable both ASan and UBSan" OFF)
option(ENABLE_TSAN "Enable ThreadSanitizer (mutually exclusive with ASan)" OFF)
option(ENABLE_MSAN "Enable MemorySanitizer (requires instrumented libc++)" OFF)

# Sanitizer flags
set(ASAN_FLAGS "-fsanitize=address -fno-omit-frame-pointer")
set(UBSAN_FLAGS "-fsanitize=undefined,integer,float-divide-by-zero,implicit-conversion,nullability")
set(TSAN_FLAGS "-fsanitize=thread")
set(MSAN_FLAGS "-fsanitize=memory -fno-omit-frame-pointer")

# Common debug flags for sanitizers
set(SANITIZER_COMMON_FLAGS "-g -O1")

# Check for incompatible combinations
if(ENABLE_ASAN AND ENABLE_TSAN)
  message(FATAL_ERROR "ASan and TSan cannot be enabled together")
endif()

if(ENABLE_ASAN AND ENABLE_MSAN)
  message(FATAL_ERROR "ASan and MSan cannot be enabled together")
endif()

if(ENABLE_TSAN AND ENABLE_MSAN)
  message(FATAL_ERROR "TSan and MSan cannot be enabled together")
endif()

# Function to apply sanitizer flags to a target
function(target_enable_sanitizers target_name)
  # Check if any sanitizer is enabled
  set(SANITIZERS_ENABLED FALSE)
  set(SANITIZER_FLAGS "")

  if(ENABLE_ASAN OR CMAKE_BUILD_TYPE STREQUAL "ASan")
    set(SANITIZERS_ENABLED TRUE)
    set(SANITIZER_FLAGS "${ASAN_FLAGS}")
    message(STATUS "Enabling AddressSanitizer for ${target_name}")
  endif()

  if(ENABLE_UBSAN OR CMAKE_BUILD_TYPE STREQUAL "UBSan")
    set(SANITIZERS_ENABLED TRUE)
    if(SANITIZER_FLAGS)
      set(SANITIZER_FLAGS "${SANITIZER_FLAGS},undefined,integer")
    else()
      set(SANITIZER_FLAGS "${UBSAN_FLAGS}")
    endif()
    message(STATUS "Enabling UndefinedBehaviorSanitizer for ${target_name}")
  endif()

  if(ENABLE_SANITIZERS OR CMAKE_BUILD_TYPE STREQUAL "Sanitizers")
    set(SANITIZERS_ENABLED TRUE)
    set(SANITIZER_FLAGS "-fsanitize=address,undefined -fno-omit-frame-pointer")
    message(STATUS "Enabling ASan + UBSan for ${target_name}")
  endif()

  if(ENABLE_TSAN OR CMAKE_BUILD_TYPE STREQUAL "TSan")
    set(SANITIZERS_ENABLED TRUE)
    set(SANITIZER_FLAGS "${TSAN_FLAGS}")
    message(STATUS "Enabling ThreadSanitizer for ${target_name}")
  endif()

  if(ENABLE_MSAN OR CMAKE_BUILD_TYPE STREQUAL "MSan")
    set(SANITIZERS_ENABLED TRUE)
    set(SANITIZER_FLAGS "${MSAN_FLAGS}")
    message(STATUS "Enabling MemorySanitizer for ${target_name}")
  endif()

  if(SANITIZERS_ENABLED)
    target_compile_options(${target_name} PRIVATE
      ${SANITIZER_FLAGS}
      ${SANITIZER_COMMON_FLAGS}
    )
    target_link_options(${target_name} PRIVATE
      ${SANITIZER_FLAGS}
    )
  endif()
endfunction()

# Legacy macro for backward compatibility (applies to CMAKE_CXX_FLAGS globally)
macro(enable_sanitizers_global)
  if(ENABLE_ASAN OR CMAKE_BUILD_TYPE STREQUAL "ASan")
    message(STATUS "Enabling AddressSanitizer (global)")
    set(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} ${ASAN_FLAGS} ${SANITIZER_COMMON_FLAGS}")
    set(CMAKE_C_FLAGS "${CMAKE_C_FLAGS} ${ASAN_FLAGS} ${SANITIZER_COMMON_FLAGS}")
    set(CMAKE_EXE_LINKER_FLAGS "${CMAKE_EXE_LINKER_FLAGS} ${ASAN_FLAGS}")
    set(CMAKE_SHARED_LINKER_FLAGS "${CMAKE_SHARED_LINKER_FLAGS} ${ASAN_FLAGS}")
  endif()

  if(ENABLE_UBSAN OR CMAKE_BUILD_TYPE STREQUAL "UBSan")
    message(STATUS "Enabling UndefinedBehaviorSanitizer (global)")
    set(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} ${UBSAN_FLAGS} ${SANITIZER_COMMON_FLAGS}")
    set(CMAKE_C_FLAGS "${CMAKE_C_FLAGS} ${UBSAN_FLAGS} ${SANITIZER_COMMON_FLAGS}")
    set(CMAKE_EXE_LINKER_FLAGS "${CMAKE_EXE_LINKER_FLAGS} ${UBSAN_FLAGS}")
    set(CMAKE_SHARED_LINKER_FLAGS "${CMAKE_SHARED_LINKER_FLAGS} ${UBSAN_FLAGS}")
  endif()

  if(ENABLE_SANITIZERS OR CMAKE_BUILD_TYPE STREQUAL "Sanitizers")
    message(STATUS "Enabling ASan + UBSan (global)")
    set(COMBINED_FLAGS "-fsanitize=address,undefined -fno-omit-frame-pointer")
    set(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} ${COMBINED_FLAGS} ${SANITIZER_COMMON_FLAGS}")
    set(CMAKE_C_FLAGS "${CMAKE_C_FLAGS} ${COMBINED_FLAGS} ${SANITIZER_COMMON_FLAGS}")
    set(CMAKE_EXE_LINKER_FLAGS "${CMAKE_EXE_LINKER_FLAGS} ${COMBINED_FLAGS}")
    set(CMAKE_SHARED_LINKER_FLAGS "${CMAKE_SHARED_LINKER_FLAGS} ${COMBINED_FLAGS}")
  endif()

  if(ENABLE_TSAN OR CMAKE_BUILD_TYPE STREQUAL "TSan")
    message(STATUS "Enabling ThreadSanitizer (global)")
    set(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} ${TSAN_FLAGS} ${SANITIZER_COMMON_FLAGS}")
    set(CMAKE_C_FLAGS "${CMAKE_C_FLAGS} ${TSAN_FLAGS} ${SANITIZER_COMMON_FLAGS}")
    set(CMAKE_EXE_LINKER_FLAGS "${CMAKE_EXE_LINKER_FLAGS} ${TSAN_FLAGS}")
    set(CMAKE_SHARED_LINKER_FLAGS "${CMAKE_SHARED_LINKER_FLAGS} ${TSAN_FLAGS}")
  endif()

  if(ENABLE_MSAN OR CMAKE_BUILD_TYPE STREQUAL "MSan")
    message(STATUS "Enabling MemorySanitizer (global)")
    set(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} ${MSAN_FLAGS} ${SANITIZER_COMMON_FLAGS}")
    set(CMAKE_C_FLAGS "${CMAKE_C_FLAGS} ${MSAN_FLAGS} ${SANITIZER_COMMON_FLAGS}")
    set(CMAKE_EXE_LINKER_FLAGS "${CMAKE_EXE_LINKER_FLAGS} ${MSAN_FLAGS}")
    set(CMAKE_SHARED_LINKER_FLAGS "${CMAKE_SHARED_LINKER_FLAGS} ${MSAN_FLAGS}")
  endif()
endmacro()

# Print current sanitizer status
function(print_sanitizer_status)
  message(STATUS "=== Sanitizer Configuration ===")
  message(STATUS "  ENABLE_ASAN: ${ENABLE_ASAN}")
  message(STATUS "  ENABLE_UBSAN: ${ENABLE_UBSAN}")
  message(STATUS "  ENABLE_SANITIZERS: ${ENABLE_SANITIZERS}")
  message(STATUS "  ENABLE_TSAN: ${ENABLE_TSAN}")
  message(STATUS "  ENABLE_MSAN: ${ENABLE_MSAN}")
  message(STATUS "  CMAKE_BUILD_TYPE: ${CMAKE_BUILD_TYPE}")
  message(STATUS "===============================")
endfunction()
