#!/bin/bash
# UndefinedBehaviorSanitizer Runner
# Task 7de375: Integrate ASan and UBSan into CI
#
# Purpose: Build and run tests with UBSan enabled
# Detects: signed overflow, null deref, invalid shifts, type errors
#
# Usage:
#   ./scripts/sanitizers/run-ubsan.sh [service_name]
#   ./scripts/sanitizers/run-ubsan.sh auth-service
#   ./scripts/sanitizers/run-ubsan.sh cpp  # For cpp/ directory tests
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
echo -e "  ${BLUE}UndefinedBehaviorSanitizer${NC} - UB Detection"
echo "  Task 7de375: Sanitizer CI Integration"
echo "================================================"
echo ""

# Target service/directory
TARGET="${1:-cpp}"
OUTPUT_DIR="${PROJECT_ROOT}/sanitizer-reports"

# Create output directory
mkdir -p "$OUTPUT_DIR"

# UBSan configuration
export UBSAN_OPTIONS="print_stacktrace=1:halt_on_error=0:suppressions=${PROJECT_ROOT}/.sanitizers/ubsan.supp:log_path=${OUTPUT_DIR}/ubsan.log"

# UBSan checks to enable
UBSAN_CHECKS="undefined,integer,float-divide-by-zero,implicit-conversion,nullability"

echo "Configuration:"
echo "  Target:       $TARGET"
echo "  Project Root: $PROJECT_ROOT"
echo "  Output Dir:   $OUTPUT_DIR"
echo "  UBSan Checks: $UBSAN_CHECKS"
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
    echo "Building cpp/ tests with UBSan..."
    echo ""

    cd "$PROJECT_ROOT/cpp"
    mkdir -p build-ubsan
    cd build-ubsan

    # Get GoogleTest prefix
    GTEST_PREFIX=$(brew --prefix googletest 2>/dev/null || echo "/usr/local")

    # Compile with UBSan
    echo "Compiling with UndefinedBehaviorSanitizer..."
    $CXX -std=c++17 \
        -fsanitize=$UBSAN_CHECKS \
        -fno-omit-frame-pointer \
        -g -O1 \
        -Wall -Wextra \
        -I../src \
        -I${GTEST_PREFIX}/include \
        ../tests/string_utils_test.cpp \
        -L${GTEST_PREFIX}/lib \
        -lgtest -lgtest_main \
        -pthread \
        -o string_utils_test_ubsan 2>&1 | tee compile.log

    if [ -f ./string_utils_test_ubsan ]; then
        echo ""
        echo "Running tests with UBSan..."
        echo ""
        ./string_utils_test_ubsan 2>&1 | tee "$OUTPUT_DIR/ubsan-cpp.log"
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

    echo "Building $TARGET with UBSan..."
    echo ""

    cd "$SERVICE_DIR"
    mkdir -p build-ubsan
    cd build-ubsan

    # Configure with CMake
    cmake -G "Unix Makefiles" \
        -DCMAKE_BUILD_TYPE=Debug \
        -DCMAKE_C_COMPILER=$CC \
        -DCMAKE_CXX_COMPILER=$CXX \
        -DENABLE_UBSAN=ON \
        .. 2>&1 | tee cmake.log

    # Build
    make -j$(nproc 2>/dev/null || sysctl -n hw.ncpu) 2>&1 | tee build.log

    # Run tests
    echo ""
    echo "Running tests with UBSan..."
    echo ""

    EXIT_CODE=0
    for test_exe in $(find . -name "*test*" -type f -executable 2>/dev/null); do
        echo "Running: $test_exe"
        $test_exe 2>&1 | tee -a "$OUTPUT_DIR/ubsan-$TARGET.log" || EXIT_CODE=$?
    done
fi

# Parse results
echo ""
echo "================================================"
echo "  Results Summary"
echo "================================================"
echo ""

LOG_FILE="$OUTPUT_DIR/ubsan-${TARGET}.log"
if [ -f "$LOG_FILE" ]; then
    SIGNED_OVERFLOW=$(grep -c "signed integer overflow" "$LOG_FILE" 2>/dev/null || echo "0")
    NULL_DEREF=$(grep -c "null pointer" "$LOG_FILE" 2>/dev/null || echo "0")
    SHIFT_ERROR=$(grep -c "shift" "$LOG_FILE" 2>/dev/null || echo "0")
    DIVIDE_ZERO=$(grep -c "division by zero" "$LOG_FILE" 2>/dev/null || echo "0")
    ALIGNMENT=$(grep -c "misaligned" "$LOG_FILE" 2>/dev/null || echo "0")
    RUNTIME_ERROR=$(grep -c "runtime error:" "$LOG_FILE" 2>/dev/null || echo "0")

    echo "UB Type                | Count"
    echo "-----------------------|------"
    echo "Signed Int Overflow    | $SIGNED_OVERFLOW"
    echo "Null Pointer Access    | $NULL_DEREF"
    echo "Invalid Shift          | $SHIFT_ERROR"
    echo "Division by Zero       | $DIVIDE_ZERO"
    echo "Misalignment           | $ALIGNMENT"
    echo "Total Runtime Errors   | $RUNTIME_ERROR"
    echo ""

    if [ "$RUNTIME_ERROR" -gt "0" ]; then
        echo -e "${YELLOW}⚠${NC} Undefined behavior detected! Review: $LOG_FILE"
        echo ""
        echo "First error details:"
        grep "runtime error:" "$LOG_FILE" | head -10
    else
        echo -e "${GREEN}✓${NC} No undefined behavior detected!"
    fi
else
    echo -e "${YELLOW}⚠${NC} No log file generated"
fi

echo ""
echo "Full report: $OUTPUT_DIR/"
exit $EXIT_CODE
