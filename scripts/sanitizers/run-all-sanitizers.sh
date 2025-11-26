#!/bin/bash
# Combined Sanitizer Runner
# Task 7de375: Integrate ASan and UBSan into CI
#
# Purpose: Build and run tests with both ASan and UBSan enabled
# Provides comprehensive memory and UB error detection
#
# Usage:
#   ./scripts/sanitizers/run-all-sanitizers.sh [service_name]
#   ./scripts/sanitizers/run-all-sanitizers.sh auth-service
#   ./scripts/sanitizers/run-all-sanitizers.sh cpp  # For cpp/ directory tests
#
# @owner @test_stabilize
# @date 2025-11-26

set -e  # Exit on error

# Color codes
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

echo "================================================"
echo -e "  ${CYAN}Combined Sanitizers${NC} - ASan + UBSan"
echo "  Task 7de375: Sanitizer CI Integration"
echo "================================================"
echo ""

# Target service/directory
TARGET="${1:-cpp}"
OUTPUT_DIR="${PROJECT_ROOT}/sanitizer-reports"

# Create output directory
mkdir -p "$OUTPUT_DIR"

# Combined sanitizer environment
export ASAN_OPTIONS="detect_leaks=1:check_initialization_order=1:detect_stack_use_after_return=1:strict_init_order=1:strict_string_checks=1:detect_invalid_pointer_pairs=2:print_stats=1:suppressions=${PROJECT_ROOT}/.sanitizers/asan.supp:log_path=${OUTPUT_DIR}/combined-asan.log"
export UBSAN_OPTIONS="print_stacktrace=1:halt_on_error=0:suppressions=${PROJECT_ROOT}/.sanitizers/ubsan.supp:log_path=${OUTPUT_DIR}/combined-ubsan.log"
export LSAN_OPTIONS="suppressions=${PROJECT_ROOT}/.sanitizers/lsan.supp:log_path=${OUTPUT_DIR}/combined-lsan.log"

# Combined sanitizer flags
SANITIZER_FLAGS="address,undefined"

echo "Configuration:"
echo "  Target:       $TARGET"
echo "  Project Root: $PROJECT_ROOT"
echo "  Output Dir:   $OUTPUT_DIR"
echo "  Sanitizers:   ASan + UBSan"
echo ""

# Check for clang (required for combined sanitizers)
if command -v clang++ &> /dev/null; then
    CXX=clang++
    CC=clang
    echo -e "${GREEN}✓${NC} Using Clang: $(clang++ --version | head -n 1)"
else
    echo -e "${RED}✗${NC} Clang is required for combined sanitizers!"
    echo "Please install Clang: brew install llvm (macOS) or apt install clang (Linux)"
    exit 1
fi
echo ""

# Build and run based on target
if [ "$TARGET" = "cpp" ]; then
    echo "Building cpp/ tests with combined sanitizers..."
    echo ""

    cd "$PROJECT_ROOT/cpp"
    mkdir -p build-sanitizers
    cd build-sanitizers

    # Get GoogleTest prefix
    GTEST_PREFIX=$(brew --prefix googletest 2>/dev/null || echo "/usr/local")

    # Compile with both sanitizers
    echo "Compiling with ASan + UBSan..."
    $CXX -std=c++17 \
        -fsanitize=$SANITIZER_FLAGS \
        -fno-omit-frame-pointer \
        -g -O1 \
        -Wall -Wextra \
        -I../src \
        -I${GTEST_PREFIX}/include \
        ../tests/string_utils_test.cpp \
        -L${GTEST_PREFIX}/lib \
        -lgtest -lgtest_main \
        -pthread \
        -o string_utils_test_combined 2>&1 | tee compile.log

    if [ -f ./string_utils_test_combined ]; then
        echo ""
        echo "Running tests with combined sanitizers..."
        echo ""
        ./string_utils_test_combined 2>&1 | tee "$OUTPUT_DIR/combined-$TARGET.log"
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

    echo "Building $TARGET with combined sanitizers..."
    echo ""

    cd "$SERVICE_DIR"
    mkdir -p build-sanitizers
    cd build-sanitizers

    # Configure with CMake
    cmake -G "Unix Makefiles" \
        -DCMAKE_BUILD_TYPE=Debug \
        -DCMAKE_C_COMPILER=$CC \
        -DCMAKE_CXX_COMPILER=$CXX \
        -DENABLE_SANITIZERS=ON \
        .. 2>&1 | tee cmake.log

    # Build
    make -j$(nproc 2>/dev/null || sysctl -n hw.ncpu) 2>&1 | tee build.log

    # Run tests
    echo ""
    echo "Running tests with combined sanitizers..."
    echo ""

    EXIT_CODE=0
    for test_exe in $(find . -name "*test*" -type f -executable 2>/dev/null); do
        echo "Running: $test_exe"
        $test_exe 2>&1 | tee -a "$OUTPUT_DIR/combined-$TARGET.log" || EXIT_CODE=$?
    done
fi

# Parse results
echo ""
echo "================================================"
echo "  Combined Results Summary"
echo "================================================"
echo ""

LOG_FILE="$OUTPUT_DIR/combined-${TARGET}.log"
if [ -f "$LOG_FILE" ]; then
    # ASan errors
    echo -e "${BLUE}AddressSanitizer Results:${NC}"
    HEAP_BUFFER=$(grep -c "heap-buffer-overflow" "$LOG_FILE" 2>/dev/null || echo "0")
    STACK_BUFFER=$(grep -c "stack-buffer-overflow" "$LOG_FILE" 2>/dev/null || echo "0")
    USE_AFTER_FREE=$(grep -c "heap-use-after-free" "$LOG_FILE" 2>/dev/null || echo "0")
    DOUBLE_FREE=$(grep -c "double-free" "$LOG_FILE" 2>/dev/null || echo "0")
    MEMORY_LEAK=$(grep -c "detected memory leaks" "$LOG_FILE" 2>/dev/null || echo "0")
    ASAN_TOTAL=$((HEAP_BUFFER + STACK_BUFFER + USE_AFTER_FREE + DOUBLE_FREE))

    echo "  Heap Buffer Overflow:  $HEAP_BUFFER"
    echo "  Stack Buffer Overflow: $STACK_BUFFER"
    echo "  Use After Free:        $USE_AFTER_FREE"
    echo "  Double Free:           $DOUBLE_FREE"
    echo "  Memory Leaks:          $MEMORY_LEAK"
    echo ""

    # UBSan errors
    echo -e "${BLUE}UndefinedBehaviorSanitizer Results:${NC}"
    SIGNED_OVERFLOW=$(grep -c "signed integer overflow" "$LOG_FILE" 2>/dev/null || echo "0")
    NULL_DEREF=$(grep -c "null pointer" "$LOG_FILE" 2>/dev/null || echo "0")
    SHIFT_ERROR=$(grep -c "shift" "$LOG_FILE" 2>/dev/null || echo "0")
    DIVIDE_ZERO=$(grep -c "division by zero" "$LOG_FILE" 2>/dev/null || echo "0")
    RUNTIME_ERROR=$(grep -c "runtime error:" "$LOG_FILE" 2>/dev/null || echo "0")

    echo "  Signed Int Overflow:   $SIGNED_OVERFLOW"
    echo "  Null Pointer Access:   $NULL_DEREF"
    echo "  Invalid Shift:         $SHIFT_ERROR"
    echo "  Division by Zero:      $DIVIDE_ZERO"
    echo "  Total Runtime Errors:  $RUNTIME_ERROR"
    echo ""

    # Summary
    echo "================================================"
    if [ "$ASAN_TOTAL" -eq "0" ] && [ "$RUNTIME_ERROR" -eq "0" ]; then
        echo -e "${GREEN}✓ All sanitizer checks PASSED!${NC}"
    else
        if [ "$ASAN_TOTAL" -gt "0" ]; then
            echo -e "${RED}✗ Memory errors detected: $ASAN_TOTAL${NC}"
        fi
        if [ "$RUNTIME_ERROR" -gt "0" ]; then
            echo -e "${YELLOW}⚠ Undefined behavior detected: $RUNTIME_ERROR${NC}"
        fi
    fi
else
    echo -e "${YELLOW}⚠${NC} No log file generated"
fi

echo ""
echo "Full report: $OUTPUT_DIR/"
echo ""
echo "Tips for fixing issues:"
echo "  1. Review log file for stack traces"
echo "  2. Add suppressions to .sanitizers/ for known false positives"
echo "  3. Fix actual bugs before merging"

exit $EXIT_CODE
