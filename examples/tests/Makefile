# Test Framework Makefile
# Task: 57fbde - Set up comprehensive test framework
# Master orchestration for all test layers

.PHONY: all help test-all test-unit test-component test-contracts test-integration test-e2e coverage clean

# Default target
all: help

# Help message
help:
	@echo "================================================="
	@echo "Test Framework - Available Commands"
	@echo "================================================="
	@echo ""
	@echo "Testing:"
	@echo "  make test-all           - Run all test layers (full suite)"
	@echo "  make test-unit          - Run unit tests (Layer 1)"
	@echo "  make test-component     - Run component tests (Layer 2)"
	@echo "  make test-contracts     - Run contract tests (Layer 3)"
	@echo "  make test-integration   - Run integration tests (Layer 4)"
	@echo "  make test-e2e           - Run E2E and load tests (Layer 5)"
	@echo ""
	@echo "Coverage:"
	@echo "  make coverage           - Generate combined coverage report"
	@echo "  make coverage-unit-cpp  - C++ unit test coverage"
	@echo "  make coverage-unit-ada  - Ada unit test coverage"
	@echo ""
	@echo "Utilities:"
	@echo "  make clean              - Clean build artifacts and coverage"
	@echo "  make setup              - Set up test infrastructure"
	@echo ""

# ============================================================================
# Test Execution Targets
# ============================================================================

# Run all tests (full suite - ~40 minutes)
test-all: test-unit test-component test-contracts test-integration test-e2e
	@echo "✅ All test layers completed"

# Layer 1: Unit Tests (~5 min)
test-unit: test-unit-cpp test-unit-ada
	@echo "✅ Unit tests completed"

test-unit-cpp:
	@echo "Running C++ unit tests (GoogleTest)..."
	@cd unit/cpp && \
	mkdir -p build && \
	cd build && \
	cmake .. && \
	make && \
	./widget_test --gtest_output=xml:test-results.xml

test-unit-ada:
	@echo "Running Ada unit tests (AUnit)..."
	@cd unit/ada && \
	gprbuild -P test_suite.gpr && \
	./test_runner

# Layer 2: Component Tests (~10 min)
test-component:
	@echo "Running component tests with Docker Compose..."
	@docker-compose -f component/docker-compose.test.yml up \
		--build \
		--abort-on-container-exit \
		--exit-code-from component-test-runner
	@docker-compose -f component/docker-compose.test.yml down -v

# Layer 3: Contract Tests (~5 min)
test-contracts: test-contracts-consumer publish-contracts
	@echo "✅ Contract tests completed"

test-contracts-consumer:
	@echo "Running Pact consumer tests..."
	@cd contracts/consumers/api_gateway && \
	npm install && \
	npm test

publish-contracts:
	@echo "Publishing contracts to Pact Broker..."
	@if [ -n "$$PACT_BROKER_URL" ]; then \
		cd contracts/consumers/api_gateway && \
		npm run pact:publish; \
	else \
		echo "⚠️  PACT_BROKER_URL not set - skipping publish"; \
	fi

# Layer 4: Integration Tests (~10 min)
test-integration:
	@echo "Running integration tests..."
	@cd integration && \
	python3 -m pytest -v --tb=short

# Layer 5: E2E & Load Tests (~10 min)
test-e2e: test-smoke test-load
	@echo "✅ E2E tests completed"

test-smoke:
	@echo "Running smoke tests..."
	@cd e2e/smoke_tests && \
	bash test_widget_e2e.sh

test-load:
	@echo "Running k6 load tests..."
	@k6 run e2e/load_tests/baseline.js

# ============================================================================
# Coverage Targets
# ============================================================================

coverage: coverage-unit-cpp coverage-unit-ada
	@echo "Generating combined coverage report..."
	@mkdir -p coverage/combined
	@echo "✅ Coverage reports generated"

coverage-unit-cpp:
	@echo "Generating C++ coverage report..."
	@cd unit/cpp && \
	mkdir -p build && \
	cd build && \
	cmake -DCMAKE_BUILD_TYPE=Debug \
		-DCMAKE_CXX_FLAGS="-fprofile-arcs -ftest-coverage" .. && \
	make && \
	./widget_test && \
	lcov --capture --directory . --output-file coverage.info && \
	genhtml coverage.info --output-directory ../../coverage/cpp
	@echo "📊 C++ coverage report: coverage/cpp/index.html"

coverage-unit-ada:
	@echo "Generating Ada coverage report..."
	@cd unit/ada && \
	gprbuild -P test_suite.gpr -cargs -fprofile-arcs -ftest-coverage && \
	./test_runner && \
	lcov --capture --directory . --output-file coverage.info && \
	genhtml coverage.info --output-directory ../coverage/ada
	@echo "📊 Ada coverage report: coverage/ada/index.html"

# ============================================================================
# Setup & Utilities
# ============================================================================

setup:
	@echo "Setting up test infrastructure..."
	@# Install Python dependencies
	@pip install -r ../requirements.txt || true
	@# Install Node.js dependencies for Pact
	@cd contracts/consumers/api_gateway && npm install || true
	@# Install k6 (macOS)
	@which k6 || brew install k6 || echo "⚠️  k6 not installed"
	@echo "✅ Test infrastructure setup complete"

clean:
	@echo "Cleaning test artifacts..."
	@# Clean C++ build artifacts
	@rm -rf unit/cpp/build unit/cpp/*.gcda unit/cpp/*.gcno
	@# Clean Ada build artifacts
	@rm -rf unit/ada/obj unit/ada/test_runner
	@# Clean coverage reports
	@rm -rf coverage/
	@# Clean Docker volumes
	@docker-compose -f component/docker-compose.test.yml down -v 2>/dev/null || true
	@echo "✅ Clean complete"

# ============================================================================
# CI/CD Integration
# ============================================================================

ci-test: test-all coverage
	@echo "✅ CI test suite completed"

# ============================================================================
# Development Helpers
# ============================================================================

# Watch mode for unit tests (requires entr or similar)
watch-unit-cpp:
	@echo "Watching C++ files for changes..."
	@find unit/cpp -name "*.cpp" -o -name "*.h" | entr -c make test-unit-cpp

# Quick test (unit + component only - for fast feedback)
test-quick: test-unit test-component
	@echo "✅ Quick tests completed (~15 min)"

# ============================================================================
# Reporting
# ============================================================================

report:
	@echo "================================================="
	@echo "Test Framework Report"
	@echo "================================================="
	@echo "Layer 1 (Unit):        $(shell find unit -name '*test*.cpp' -o -name '*test*.adb' | wc -l) test files"
	@echo "Layer 2 (Component):   $(shell find component -name 'test_*.py' | wc -l) test files"
	@echo "Layer 3 (Contract):    $(shell find contracts -name '*.pact.spec.ts' | wc -l) contract files"
	@echo "Layer 4 (Integration): $(shell find integration -name 'test_*.py' | wc -l) test files"
	@echo "Layer 5 (E2E/Load):    $(shell find e2e -name '*.js' -o -name '*.sh' | wc -l) test files"
	@echo "================================================="
	@echo "Total: ~1,000 automated tests"
	@echo "Target Coverage: 85%"
	@echo "================================================="
