#!/bin/bash
# Docker Environment Validation Script
# Task: 81500c - Set Up Docker/Linux Test Environment
# Owner: @test_stabilize
# Purpose: Validate Docker environment is correctly configured

set -e  # Exit on error

echo "========================================="
echo "Docker Environment Validation"
echo "Task: 81500c"
echo "========================================="
echo

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test counter
TESTS_PASSED=0
TESTS_FAILED=0

# Helper functions
pass() {
    echo -e "${GREEN}✓ PASS${NC}: $1"
    ((TESTS_PASSED++))
}

fail() {
    echo -e "${RED}✗ FAIL${NC}: $1"
    ((TESTS_FAILED++))
}

warn() {
    echo -e "${YELLOW}⚠ WARN${NC}: $1"
}

# ====================
# Test 1: Docker Installation
# ====================
echo "Test 1: Checking Docker installation..."
if command -v docker &> /dev/null; then
    DOCKER_VERSION=$(docker --version)
    pass "Docker is installed: $DOCKER_VERSION"
else
    fail "Docker is not installed"
fi
echo

# ====================
# Test 2: Docker Compose Installation
# ====================
echo "Test 2: Checking Docker Compose installation..."
if command -v docker-compose &> /dev/null; then
    COMPOSE_VERSION=$(docker-compose --version)
    pass "Docker Compose is installed: $COMPOSE_VERSION"
else
    fail "Docker Compose is not installed"
fi
echo

# ====================
# Test 3: Docker Daemon Running
# ====================
echo "Test 3: Checking if Docker daemon is running..."
if docker info &> /dev/null; then
    pass "Docker daemon is running"
else
    fail "Docker daemon is not running"
fi
echo

# ====================
# Test 4: Required Files Exist
# ====================
echo "Test 4: Checking required Docker files..."

if [ -f "Dockerfile.polyorb" ]; then
    pass "Dockerfile.polyorb exists"
else
    fail "Dockerfile.polyorb not found"
fi

if [ -f "docker-compose.polyorb.yml" ]; then
    pass "docker-compose.polyorb.yml exists"
else
    fail "docker-compose.polyorb.yml not found"
fi
echo

# ====================
# Test 5: Docker Image Build
# ====================
echo "Test 5: Building Docker image..."
if docker-compose -f docker-compose.polyorb.yml build polyorb-test; then
    pass "Docker image built successfully"
else
    fail "Docker image build failed"
fi
echo

# ====================
# Test 6: Container Start
# ====================
echo "Test 6: Starting container..."
if docker-compose -f docker-compose.polyorb.yml up -d polyorb-test; then
    pass "Container started successfully"
else
    fail "Container failed to start"
fi
echo

# ====================
# Test 7: GNAT Toolchain
# ====================
echo "Test 7: Verifying GNAT toolchain in container..."
GNAT_TEST=$(docker-compose -f docker-compose.polyorb.yml exec -T polyorb-test gnat --version 2>&1 || echo "FAIL")
if [[ "$GNAT_TEST" != *"FAIL"* ]]; then
    pass "GNAT is available in container"
    echo "   Version: $(echo "$GNAT_TEST" | head -n 1)"
else
    fail "GNAT is not available in container"
fi
echo

# ====================
# Test 8: GPRbuild
# ====================
echo "Test 8: Verifying gprbuild in container..."
GPRBUILD_TEST=$(docker-compose -f docker-compose.polyorb.yml exec -T polyorb-test gprbuild --version 2>&1 || echo "FAIL")
if [[ "$GPRBUILD_TEST" != *"FAIL"* ]]; then
    pass "gprbuild is available in container"
    echo "   Version: $(echo "$GPRBUILD_TEST" | head -n 1)"
else
    fail "gprbuild is not available in container"
fi
echo

# ====================
# Test 9: Testing Tools
# ====================
echo "Test 9: Verifying testing tools in container..."

# Check gcov
GCOV_TEST=$(docker-compose -f docker-compose.polyorb.yml exec -T polyorb-test gcov --version 2>&1 || echo "FAIL")
if [[ "$GCOV_TEST" != *"FAIL"* ]]; then
    pass "gcov is available"
else
    fail "gcov is not available"
fi

# Check lcov
LCOV_TEST=$(docker-compose -f docker-compose.polyorb.yml exec -T polyorb-test lcov --version 2>&1 || echo "FAIL")
if [[ "$LCOV_TEST" != *"FAIL"* ]]; then
    pass "lcov is available"
else
    fail "lcov is not available"
fi

# Check valgrind
VALGRIND_TEST=$(docker-compose -f docker-compose.polyorb.yml exec -T polyorb-test valgrind --version 2>&1 || echo "FAIL")
if [[ "$VALGRIND_TEST" != *"FAIL"* ]]; then
    pass "valgrind is available"
else
    fail "valgrind is not available"
fi

# Check pytest
PYTEST_TEST=$(docker-compose -f docker-compose.polyorb.yml exec -T polyorb-test pytest --version 2>&1 || echo "FAIL")
if [[ "$PYTEST_TEST" != *"FAIL"* ]]; then
    pass "pytest is available"
else
    fail "pytest is not available"
fi
echo

# ====================
# Test 10: Volume Mounts
# ====================
echo "Test 10: Verifying volume mounts..."
VOLUME_TEST=$(docker-compose -f docker-compose.polyorb.yml exec -T polyorb-test ls -la /workspace 2>&1 || echo "FAIL")
if [[ "$VOLUME_TEST" != *"FAIL"* ]]; then
    pass "Workspace volume is mounted"
else
    fail "Workspace volume mount failed"
fi
echo

# ====================
# Test 11: PostgreSQL (Optional)
# ====================
echo "Test 11: Starting PostgreSQL container (optional)..."
if docker-compose -f docker-compose.polyorb.yml up -d postgres-test; then
    pass "PostgreSQL container started"

    echo "   Waiting for PostgreSQL to be ready..."
    sleep 10

    POSTGRES_TEST=$(docker-compose -f docker-compose.polyorb.yml exec -T postgres-test pg_isready -U polyorb_test 2>&1 || echo "FAIL")
    if [[ "$POSTGRES_TEST" != *"FAIL"* ]]; then
        pass "PostgreSQL is ready and accepting connections"
    else
        warn "PostgreSQL is not ready yet (may need more time)"
    fi
else
    warn "PostgreSQL container failed to start (optional for basic testing)"
fi
echo

# ====================
# Test 12: Network Connectivity
# ====================
echo "Test 12: Testing network connectivity between containers..."
NETWORK_TEST=$(docker-compose -f docker-compose.polyorb.yml exec -T polyorb-test ping -c 1 postgres-test 2>&1 || echo "FAIL")
if [[ "$NETWORK_TEST" != *"FAIL"* ]] && [[ "$NETWORK_TEST" == *"1 received"* ]]; then
    pass "Network connectivity between containers works"
else
    warn "Network connectivity test failed (expected if PostgreSQL not started)"
fi
echo

# ====================
# Cleanup
# ====================
echo "Cleaning up test containers..."
docker-compose -f docker-compose.polyorb.yml down
echo

# ====================
# Summary
# ====================
echo "========================================="
echo "Validation Summary"
echo "========================================="
echo -e "Tests Passed: ${GREEN}$TESTS_PASSED${NC}"
echo -e "Tests Failed: ${RED}$TESTS_FAILED${NC}"
echo

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "${GREEN}✓ All tests passed! Docker environment is ready.${NC}"
    echo
    echo "Next steps:"
    echo "1. Run 'docker-compose -f docker-compose.polyorb.yml up -d' to start environment"
    echo "2. Run 'docker-compose -f docker-compose.polyorb.yml exec polyorb-test bash' to access shell"
    echo "3. Follow DOCKER-TEST-ENVIRONMENT.md for usage instructions"
    exit 0
else
    echo -e "${RED}✗ Some tests failed. Please fix issues before proceeding.${NC}"
    echo
    echo "See DOCKER-TEST-ENVIRONMENT.md for troubleshooting guidance."
    exit 1
fi
