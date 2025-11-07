# Makefile for C++ GoogleTest Project
# RDB-002 Week 1 Implementation

CXX = clang++
CXXFLAGS = -std=c++17 -Wall -Wextra -I./src
TEST_FLAGS = -lgtest -lgtest_main -pthread

# Directories
SRC_DIR = src
TEST_DIR = tests
BUILD_DIR = build

# Targets
TEST_EXEC = $(BUILD_DIR)/string_utils_test

# Default target
all: $(TEST_EXEC)

# Create build directory
$(BUILD_DIR):
	mkdir -p $(BUILD_DIR)

# Build test executable
$(TEST_EXEC): $(TEST_DIR)/string_utils_test.cpp | $(BUILD_DIR)
	$(CXX) $(CXXFLAGS) $< -o $@ $(TEST_FLAGS)

# Run tests
test: $(TEST_EXEC)
	./$(TEST_EXEC)

# Run tests with verbose output
test-verbose: $(TEST_EXEC)
	./$(TEST_EXEC) --gtest_print_time=1

# Clean build artifacts
clean:
	rm -rf $(BUILD_DIR)

# Install GoogleTest (macOS)
install-deps:
	@echo "Installing GoogleTest..."
	@which brew > /dev/null || (echo "Homebrew not found. Please install from https://brew.sh" && exit 1)
	brew install googletest

# Help
help:
	@echo "C++ GoogleTest Makefile"
	@echo ""
	@echo "Targets:"
	@echo "  all            - Build test executable (default)"
	@echo "  test           - Build and run tests"
	@echo "  test-verbose   - Run tests with timing info"
	@echo "  clean          - Remove build artifacts"
	@echo "  install-deps   - Install GoogleTest via Homebrew"
	@echo "  help           - Show this help message"
	@echo ""
	@echo "Requirements:"
	@echo "  - clang++ or g++ with C++17 support"
	@echo "  - GoogleTest library (install via 'make install-deps')"

.PHONY: all test test-verbose clean install-deps help
