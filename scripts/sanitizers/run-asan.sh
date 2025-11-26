#!/bin/bash
# AddressSanitizer Runner
# Task 7de375: Integrate ASan and UBSan into CI
#
# Purpose: Build and run tests with AddressSanitizer enabled
# Detects: buffer overflows, use-after-free, double-free, memory leaks
#
# Usage:
#   ./scripts/sanitizers/run-asan.sh [service_name]
#   ./scripts/sanitizers/run-asan.sh auth-service
#   ./scripts/sanitizers/run-asan.sh cpp  # For cpp/ directory tests
#
# @owner @test_stabilize
# @date 2025-11-26

set -e  # Exit on error

# Color codes
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

echo "================================================"
echo -e "  ${BLUE}AddressSanitizer${NC} - Memory Error Detection"
echo "  Task 7de375: Sanitizer CI Integration"
echo "================================================"
echo ""

# Target service/directory
TARGET="${1:-cpp}"
OUTPUT_DIR="${PROJECT_ROOT}/sanitizer-reports"

# Create output directory
mkdir -p "$OUTPUT_DIR"

# ASan configuration
export ASAN_OPTIONS="detect_leaks=1:check_initialization_order=1:detect_stack_use_after_return=1:strict_init_order=1:strict_string_checks=1:detect_invalid_pointer_pairs=2:print_stats=1:suppressions=${PROJECT_ROOT}/.sanitizers/asan.supp:log_path=${OUTPUT_DIR}/asan.log"
export LSAN_OPTIONS="suppressions=${PROJECT_ROOT}/.sanitizers/lsan.supp:log_path=${OUTPUT_DIR}/lsan.log"

echo "Configuration:"
echo "  Target:       $TARGET"
echo "  Project Root: $PROJECT_ROOT"
echo "  Output Dir:   $OUTPUT_DIR"
echo ""

# Check for clang
if command -v clang++ &> /dev/null; then
    CXX=clang++
    CC=clang
    echo -e "${GREEN}✓${NC} Using Clang: $(clang++ --version | head -n 1)"
elif command -v g++ &> /dev/null; then
    CXX=g++
    CC=gcc
    echo -e "${YELLOW}⚠${NC} Clang not found, using GCC: $(g++ --version | head -n 1)"
else
    echo -e "${RED}✗${NC} No C++ compiler found!"
    exit 1
fi
echo ""

# Build and run based on target
if [ "$TARGET" = "cpp" ]; then
    echo "Building cpp/ tests with ASan..."
    echo ""

    cd "$PROJECT_ROOT/cpp"
    mkdir -p build-asan
    cd build-asan

    # Get GoogleTest prefix
    GTEST_PREFIX=$(brew --prefix googletest 2>/dev/null || echo "/usr/local")

    # Compile with ASan
    echo "Compiling with AddressSanitizer..."
    $CXX -std=c++17 \
        -fsanitize=address \
        -fno-omit-frame-pointer \
        -g -O1 \
        -Wall -Wextra \
        -I../src \
        -I${GTEST_PREFIX}/include \
        ../tests/string_utils_test.cpp \
        -L${GTEST_PREFIX}/lib \
        -lgtest -lgtest_main \
        -pthread \
        -o string_utils_test_asan 2>&1 | tee compile.log

    if [ -f ./string_utils_test_asan ]; then
        echo ""
        echo "Running tests with AddressSanitizer..."
        echo ""
        ./string_utils_test_asan 2>&1 | tee "$OUTPUT_DIR/asan-cpp.log"
        EXIT_CODE=${PIPESTATUS[0]}
    else
        echo -e "${RED}✗${NC} Compilation failed!"
        cat compile.log
        exit 1
    fi
else
    # Service directory
    SERVICE_DIR="$PROJECT_ROOT/services/$TARGET"

    if [ ! -d "$SERVICE_DIR" ]; then
        echo -e "${RED}✗${NC} Service directory not found: $SERVICE_DIR"
        echo ""
        echo "Available services:"
        ls -1 "$PROJECT_ROOT/services/" 2>/dev/null || echo "  (none found)"
        exit 1
    fi

    echo "Building $TARGET with ASan..."
    echo ""

    cd "$SERVICE_DIR"
    mkdir -p build-asan
    cd build-asan

    # Configure with CMake
    cmake -G "Unix Makefiles" \
        -DCMAKE_BUILD_TYPE=Debug \
        -DCMAKE_C_COMPILER=$CC \
        -DCMAKE_CXX_COMPILER=$CXX \
        -DENABLE_ASAN=ON \
        .. 2>&1 | tee cmake.log

    # Build
    make -j$(nproc 2>/dev/null || sysctl -n hw.ncpu) 2>&1 | tee build.log

    # Run tests
    echo ""
    echo "Running tests with AddressSanitizer..."
    echo ""

    EXIT_CODE=0
    for test_exe in $(find . -name "*test*" -type f -executable 2>/dev/null); do
        echo "Running: $test_exe"
        $test_exe 2>&1 | tee -a "$OUTPUT_DIR/asan-$TARGET.log" || EXIT_CODE=$?
    done
fi

# Parse results
echo ""
echo "================================================"
echo "  Results Summary"
echo "================================================"
echo ""

LOG_FILE="$OUTPUT_DIR/asan-${TARGET}.log"
if [ -f "$LOG_FILE" ]; then
    HEAP_BUFFER=$(grep -c "heap-buffer-overflow" "$LOG_FILE" 2>/dev/null || echo "0")
    STACK_BUFFER=$(grep -c "stack-buffer-overflow" "$LOG_FILE" 2>/dev/null || echo "0")
    USE_AFTER_FREE=$(grep -c "heap-use-after-free" "$LOG_FILE" 2>/dev/null || echo "0")
    DOUBLE_FREE=$(grep -c "double-free" "$LOG_FILE" 2>/dev/null || echo "0")
    MEMORY_LEAK=$(grep -c "detected memory leaks" "$LOG_FILE" 2>/dev/null || echo "0")

    echo "Error Type             | Count"
    echo "-----------------------|------"
    echo "Heap Buffer Overflow   | $HEAP_BUFFER"
    echo "Stack Buffer Overflow  | $STACK_BUFFER"
    echo "Use After Free         | $USE_AFTER_FREE"
    echo "Double Free            | $DOUBLE_FREE"
    echo "Memory Leaks Detected  | $MEMORY_LEAK"
    echo ""

    TOTAL=$((HEAP_BUFFER + STACK_BUFFER + USE_AFTER_FREE + DOUBLE_FREE))

    if [ "$TOTAL" -gt "0" ]; then
        echo -e "${RED}✗${NC} Memory errors detected! Review: $LOG_FILE"
        echo ""
        echo "First error details:"
        grep -A 10 "ERROR: AddressSanitizer" "$LOG_FILE" | head -15
    else
        echo -e "${GREEN}✓${NC} No memory errors detected!"
    fi
else
    echo -e "${YELLOW}⚠${NC} No log file generated"
fi

echo ""
echo "Full report: $OUTPUT_DIR/"
exit $EXIT_CODE
