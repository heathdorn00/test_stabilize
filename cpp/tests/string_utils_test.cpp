#include <gtest/gtest.h>
#include "../src/string_utils.h"

using namespace utils;

// Test fixture for StringUtils tests
class StringUtilsTest : public ::testing::Test {
protected:
    void SetUp() override {
        // Setup code if needed
    }

    void TearDown() override {
        // Cleanup code if needed
    }
};

// toUpper tests
TEST_F(StringUtilsTest, ToUpperConvertsLowercase) {
    EXPECT_EQ("HELLO", StringUtils::toUpper("hello"));
}

TEST_F(StringUtilsTest, ToUpperHandlesUppercase) {
    EXPECT_EQ("HELLO", StringUtils::toUpper("HELLO"));
}

TEST_F(StringUtilsTest, ToUpperHandlesMixed) {
    EXPECT_EQ("HELLO WORLD", StringUtils::toUpper("HeLLo WoRLd"));
}

TEST_F(StringUtilsTest, ToUpperHandlesEmpty) {
    EXPECT_EQ("", StringUtils::toUpper(""));
}

TEST_F(StringUtilsTest, ToUpperHandlesNumbers) {
    EXPECT_EQ("ABC123", StringUtils::toUpper("abc123"));
}

// toLower tests
TEST_F(StringUtilsTest, ToLowerConvertsUppercase) {
    EXPECT_EQ("hello", StringUtils::toLower("HELLO"));
}

TEST_F(StringUtilsTest, ToLowerHandlesLowercase) {
    EXPECT_EQ("hello", StringUtils::toLower("hello"));
}

TEST_F(StringUtilsTest, ToLowerHandlesMixed) {
    EXPECT_EQ("hello world", StringUtils::toLower("HeLLo WoRLd"));
}

TEST_F(StringUtilsTest, ToLowerHandlesEmpty) {
    EXPECT_EQ("", StringUtils::toLower(""));
}

// startsWith tests
TEST_F(StringUtilsTest, StartsWithReturnsTrue) {
    EXPECT_TRUE(StringUtils::startsWith("hello world", "hello"));
}

TEST_F(StringUtilsTest, StartsWithReturnsFalse) {
    EXPECT_FALSE(StringUtils::startsWith("hello world", "world"));
}

TEST_F(StringUtilsTest, StartsWithHandlesEmpty) {
    EXPECT_TRUE(StringUtils::startsWith("hello", ""));
}

TEST_F(StringUtilsTest, StartsWithHandlesPrefixLongerThanString) {
    EXPECT_FALSE(StringUtils::startsWith("hi", "hello"));
}

TEST_F(StringUtilsTest, StartsWithExactMatch) {
    EXPECT_TRUE(StringUtils::startsWith("hello", "hello"));
}

// endsWith tests
TEST_F(StringUtilsTest, EndsWithReturnsTrue) {
    EXPECT_TRUE(StringUtils::endsWith("hello world", "world"));
}

TEST_F(StringUtilsTest, EndsWithReturnsFalse) {
    EXPECT_FALSE(StringUtils::endsWith("hello world", "hello"));
}

TEST_F(StringUtilsTest, EndsWithHandlesEmpty) {
    EXPECT_TRUE(StringUtils::endsWith("hello", ""));
}

TEST_F(StringUtilsTest, EndsWithHandlesSuffixLongerThanString) {
    EXPECT_FALSE(StringUtils::endsWith("hi", "hello"));
}

TEST_F(StringUtilsTest, EndsWithExactMatch) {
    EXPECT_TRUE(StringUtils::endsWith("hello", "hello"));
}

// split tests
TEST_F(StringUtilsTest, SplitWithSingleDelimiter) {
    std::vector<std::string> expected = {"hello", "world"};
    EXPECT_EQ(expected, StringUtils::split("hello,world", ','));
}

TEST_F(StringUtilsTest, SplitWithMultipleDelimiters) {
    std::vector<std::string> expected = {"a", "b", "c", "d"};
    EXPECT_EQ(expected, StringUtils::split("a,b,c,d", ','));
}

TEST_F(StringUtilsTest, SplitWithNoDelimiter) {
    std::vector<std::string> expected = {"hello"};
    EXPECT_EQ(expected, StringUtils::split("hello", ','));
}

TEST_F(StringUtilsTest, SplitWithEmptyString) {
    std::vector<std::string> expected = {""};
    EXPECT_EQ(expected, StringUtils::split("", ','));
}

TEST_F(StringUtilsTest, SplitWithTrailingDelimiter) {
    std::vector<std::string> expected = {"hello", "world", ""};
    EXPECT_EQ(expected, StringUtils::split("hello,world,", ','));
}

// trim tests
TEST_F(StringUtilsTest, TrimLeadingWhitespace) {
    EXPECT_EQ("hello", StringUtils::trim("  hello"));
}

TEST_F(StringUtilsTest, TrimTrailingWhitespace) {
    EXPECT_EQ("hello", StringUtils::trim("hello  "));
}

TEST_F(StringUtilsTest, TrimBothEnds) {
    EXPECT_EQ("hello", StringUtils::trim("  hello  "));
}

TEST_F(StringUtilsTest, TrimHandlesAllWhitespace) {
    EXPECT_EQ("", StringUtils::trim("   "));
}

TEST_F(StringUtilsTest, TrimHandlesEmpty) {
    EXPECT_EQ("", StringUtils::trim(""));
}

TEST_F(StringUtilsTest, TrimHandlesTabs) {
    EXPECT_EQ("hello", StringUtils::trim("\t\thello\t\t"));
}

TEST_F(StringUtilsTest, TrimHandlesNewlines) {
    EXPECT_EQ("hello", StringUtils::trim("\n\nhello\n\n"));
}

TEST_F(StringUtilsTest, TrimPreservesInternalWhitespace) {
    EXPECT_EQ("hello world", StringUtils::trim("  hello world  "));
}

// Main function to run all tests
int main(int argc, char **argv) {
    ::testing::InitGoogleTest(&argc, argv);
    return RUN_ALL_TESTS();
}
