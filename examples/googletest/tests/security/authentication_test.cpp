// Security Service - Authentication Unit Tests
// Test 1 of 10 for Week 1 Pilot

#include <gtest/gtest.h>
#include <gmock/gmock.h>
#include "security/authentication.h"

using ::testing::Return;
using ::testing::_;

namespace security {
namespace {

// Test Fixture for Authentication tests
class AuthenticationTest : public ::testing::Test {
 protected:
  void SetUp() override {
    auth_ = std::make_unique<Authentication>();
  }

  void TearDown() override {
    auth_.reset();
  }

  std::unique_ptr<Authentication> auth_;
};

// Test 1: Valid credentials authenticate successfully
TEST_F(AuthenticationTest, ValidCredentialsAuthenticateSuccessfully) {
  // Arrange
  std::string username = "testuser";
  std::string password = "SecurePass123!";

  // Act
  AuthResult result = auth_->Authenticate(username, password);

  // Assert
  EXPECT_TRUE(result.success) << "Authentication should succeed with valid credentials";
  EXPECT_EQ(result.userId, "testuser");
  EXPECT_FALSE(result.token.empty()) << "Token should be generated";
}

// Test 2: Invalid credentials fail authentication
TEST_F(AuthenticationTest, InvalidCredentialsFailAuthentication) {
  // Arrange
  std::string username = "testuser";
  std::string password = "WrongPassword";

  // Act
  AuthResult result = auth_->Authenticate(username, password);

  // Assert
  EXPECT_FALSE(result.success) << "Authentication should fail with invalid password";
  EXPECT_TRUE(result.token.empty()) << "No token should be generated";
  EXPECT_EQ(result.errorCode, AuthError::INVALID_CREDENTIALS);
}

// Test 3: Empty username fails authentication
TEST_F(AuthenticationTest, EmptyUsernameFailsAuthentication) {
  // Arrange
  std::string username = "";
  std::string password = "SecurePass123!";

  // Act
  AuthResult result = auth_->Authenticate(username, password);

  // Assert
  EXPECT_FALSE(result.success);
  EXPECT_EQ(result.errorCode, AuthError::EMPTY_USERNAME);
}

// Test 4: Empty password fails authentication
TEST_F(AuthenticationTest, EmptyPasswordFailsAuthentication) {
  // Arrange
  std::string username = "testuser";
  std::string password = "";

  // Act
  AuthResult result = auth_->Authenticate(username, password);

  // Assert
  EXPECT_FALSE(result.success);
  EXPECT_EQ(result.errorCode, AuthError::EMPTY_PASSWORD);
}

// Test 5: Rate limiting after multiple failed attempts
TEST_F(AuthenticationTest, RateLimitingAfterFailedAttempts) {
  // Arrange
  std::string username = "testuser";
  std::string password = "WrongPassword";

  // Act: Attempt authentication 5 times (trigger rate limit)
  for (int i = 0; i < 5; i++) {
    auth_->Authenticate(username, password);
  }

  AuthResult result = auth_->Authenticate(username, password);

  // Assert
  EXPECT_FALSE(result.success);
  EXPECT_EQ(result.errorCode, AuthError::RATE_LIMITED);
}

// Test 6: Token expiration
TEST_F(AuthenticationTest, TokenExpiresAfterTimeout) {
  // Arrange
  std::string username = "testuser";
  std::string password = "SecurePass123!";
  AuthResult auth_result = auth_->Authenticate(username, password);
  std::string token = auth_result.token;

  // Act: Simulate time passing (e.g., 1 hour)
  auth_->AdvanceTime(3600);  // 3600 seconds = 1 hour
  bool isValid = auth_->ValidateToken(token);

  // Assert
  EXPECT_FALSE(isValid) << "Token should expire after 1 hour";
}

// Test 7: Valid token validates successfully
TEST_F(AuthenticationTest, ValidTokenValidatesSuccessfully) {
  // Arrange
  std::string username = "testuser";
  std::string password = "SecurePass123!";
  AuthResult auth_result = auth_->Authenticate(username, password);
  std::string token = auth_result.token;

  // Act
  bool isValid = auth_->ValidateToken(token);

  // Assert
  EXPECT_TRUE(isValid) << "Freshly generated token should be valid";
}

// Test 8: Invalid token format fails validation
TEST_F(AuthenticationTest, InvalidTokenFormatFailsValidation) {
  // Arrange
  std::string invalid_token = "not-a-valid-token-format";

  // Act
  bool isValid = auth_->ValidateToken(invalid_token);

  // Assert
  EXPECT_FALSE(isValid) << "Malformed token should fail validation";
}

// Test 9: Logout invalidates token
TEST_F(AuthenticationTest, LogoutInvalidatesToken) {
  // Arrange
  std::string username = "testuser";
  std::string password = "SecurePass123!";
  AuthResult auth_result = auth_->Authenticate(username, password);
  std::string token = auth_result.token;

  // Act
  auth_->Logout(token);
  bool isValid = auth_->ValidateToken(token);

  // Assert
  EXPECT_FALSE(isValid) << "Token should be invalid after logout";
}

// Test 10: Concurrent authentication requests (thread safety)
TEST_F(AuthenticationTest, ConcurrentAuthenticationRequests) {
  // Arrange
  std::string username = "testuser";
  std::string password = "SecurePass123!";
  const int num_threads = 10;
  std::vector<std::thread> threads;
  std::atomic<int> success_count{0};

  // Act: Spawn multiple threads authenticating concurrently
  for (int i = 0; i < num_threads; i++) {
    threads.emplace_back([&]() {
      AuthResult result = auth_->Authenticate(username, password);
      if (result.success) {
        success_count++;
      }
    });
  }

  // Wait for all threads to complete
  for (auto& thread : threads) {
    thread.join();
  }

  // Assert: All authentications should succeed
  EXPECT_EQ(success_count, num_threads)
      << "All concurrent authentication requests should succeed";
}

// Parameterized test: Various invalid username/password combinations
class InvalidCredentialsTest :
    public ::testing::TestWithParam<std::pair<std::string, std::string>> {};

TEST_P(InvalidCredentialsTest, FailsAuthentication) {
  Authentication auth;
  auto [username, password] = GetParam();

  AuthResult result = auth.Authenticate(username, password);

  EXPECT_FALSE(result.success)
      << "Authentication should fail for username='" << username
      << "' password='" << password << "'";
}

INSTANTIATE_TEST_SUITE_P(
    InvalidCombinations,
    InvalidCredentialsTest,
    ::testing::Values(
        std::make_pair("", ""),
        std::make_pair("user", ""),
        std::make_pair("", "pass"),
        std::make_pair("admin' OR '1'='1", "password"),  // SQL injection attempt
        std::make_pair("<script>alert('xss')</script>", "password")  // XSS attempt
    )
);

}  // namespace
}  // namespace security
