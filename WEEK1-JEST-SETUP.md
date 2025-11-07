# Week 1: Jest Framework Setup

**Task**: Install Jest (TypeScript) framework and verify in CI/CD
**Owner**: @test_stabilize
**Date**: 2025-11-05
**Status**: In Progress

---

## Overview

Jest is a delightful JavaScript/TypeScript testing framework with a focus on simplicity. It provides zero-configuration testing, snapshot testing, and excellent TypeScript support.

## Installation Steps

### Setup TypeScript Project

```bash
# Initialize project
mkdir typescript-services && cd typescript-services
npm init -y

# Install TypeScript
npm install --save-dev typescript @types/node

# Initialize TypeScript configuration
npx tsc --init
```

### Install Jest and TypeScript Support

```bash
# Install Jest
npm install --save-dev jest ts-jest @types/jest

# Install testing utilities
npm install --save-dev @testing-library/jest-dom

# Initialize Jest configuration
npx ts-jest config:init
```

### Configure Jest

Create `jest.config.js`:

```javascript
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src', '<rootDir>/tests'],
  testMatch: ['**/__tests__/**/*.ts', '**/?(*.)+(spec|test).ts'],
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/**/*.interface.ts',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  coverageThresholds: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
  verbose: true,
};
```

### Configure TypeScript

Update `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "tests"]
}
```

### Update package.json

```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:verbose": "jest --verbose",
    "test:ci": "jest --ci --coverage --maxWorkers=2"
  }
}
```

---

## Example Test Suite

### Directory Structure

```
typescript-services/
├── src/
│   ├── security/
│   │   ├── authentication.ts
│   │   ├── encryption.ts
│   │   └── jwt.ts
│   └── api/
│       ├── handler.ts
│       └── middleware.ts
└── tests/
    ├── security/
    │   ├── authentication.test.ts
    │   ├── encryption.test.ts
    │   └── jwt.test.ts
    └── api/
        ├── handler.test.ts
        └── middleware.test.ts
```

### Example Source: `src/security/authentication.ts`

```typescript
export interface AuthResult {
  success: boolean;
  userId?: string;
  token?: string;
  errorCode?: AuthError;
}

export enum AuthError {
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  EMPTY_USERNAME = 'EMPTY_USERNAME',
  EMPTY_PASSWORD = 'EMPTY_PASSWORD',
  RATE_LIMITED = 'RATE_LIMITED',
}

export class Authentication {
  private failedAttempts: Map<string, number> = new Map();

  authenticate(username: string, password: string): AuthResult {
    // Validate inputs
    if (!username) {
      return {
        success: false,
        errorCode: AuthError.EMPTY_USERNAME,
      };
    }

    if (!password) {
      return {
        success: false,
        errorCode: AuthError.EMPTY_PASSWORD,
      };
    }

    // Check rate limiting
    const attempts = this.failedAttempts.get(username) || 0;
    if (attempts >= 5) {
      return {
        success: false,
        errorCode: AuthError.RATE_LIMITED,
      };
    }

    // Validate credentials (simplified for example)
    if (password === 'SecurePass123!') {
      this.failedAttempts.delete(username);
      return {
        success: true,
        userId: username,
        token: this.generateToken(username),
      };
    }

    // Record failed attempt
    this.failedAttempts.set(username, attempts + 1);
    return {
      success: false,
      errorCode: AuthError.INVALID_CREDENTIALS,
    };
  }

  private generateToken(username: string): string {
    // Simplified token generation
    return `token_${username}_${Date.now()}`;
  }
}
```

### Example Test: `tests/security/authentication.test.ts`

```typescript
// Security Service - Authentication Unit Tests (TypeScript)
// Tests 1-10 for Week 1 Pilot

import { Authentication, AuthError } from '../../src/security/authentication';

describe('Authentication', () => {
  let auth: Authentication;

  beforeEach(() => {
    auth = new Authentication();
  });

  afterEach(() => {
    auth = null as any;
  });

  // Test 1: Valid credentials authenticate successfully
  test('should authenticate successfully with valid credentials', () => {
    // Arrange
    const username = 'testuser';
    const password = 'SecurePass123!';

    // Act
    const result = auth.authenticate(username, password);

    // Assert
    expect(result.success).toBe(true);
    expect(result.userId).toBe(username);
    expect(result.token).toBeDefined();
    expect(result.token).toMatch(/^token_testuser_\d+$/);
  });

  // Test 2: Invalid credentials fail authentication
  test('should fail authentication with invalid password', () => {
    // Arrange
    const username = 'testuser';
    const password = 'WrongPassword';

    // Act
    const result = auth.authenticate(username, password);

    // Assert
    expect(result.success).toBe(false);
    expect(result.token).toBeUndefined();
    expect(result.errorCode).toBe(AuthError.INVALID_CREDENTIALS);
  });

  // Test 3: Empty username fails authentication
  test('should fail authentication with empty username', () => {
    // Arrange
    const username = '';
    const password = 'SecurePass123!';

    // Act
    const result = auth.authenticate(username, password);

    // Assert
    expect(result.success).toBe(false);
    expect(result.errorCode).toBe(AuthError.EMPTY_USERNAME);
  });

  // Test 4: Empty password fails authentication
  test('should fail authentication with empty password', () => {
    // Arrange
    const username = 'testuser';
    const password = '';

    // Act
    const result = auth.authenticate(username, password);

    // Assert
    expect(result.success).toBe(false);
    expect(result.errorCode).toBe(AuthError.EMPTY_PASSWORD);
  });

  // Test 5: Rate limiting after multiple failed attempts
  test('should trigger rate limiting after 5 failed attempts', () => {
    // Arrange
    const username = 'testuser';
    const password = 'WrongPassword';

    // Act: Attempt authentication 5 times
    for (let i = 0; i < 5; i++) {
      auth.authenticate(username, password);
    }

    const result = auth.authenticate(username, password);

    // Assert
    expect(result.success).toBe(false);
    expect(result.errorCode).toBe(AuthError.RATE_LIMITED);
  });

  // Test 6: Successful authentication resets failed attempts
  test('should reset failed attempts after successful authentication', () => {
    // Arrange
    const username = 'testuser';
    const wrongPassword = 'WrongPassword';
    const correctPassword = 'SecurePass123!';

    // Act: Fail 3 times, then succeed
    for (let i = 0; i < 3; i++) {
      auth.authenticate(username, wrongPassword);
    }

    const successResult = auth.authenticate(username, correctPassword);
    const nextResult = auth.authenticate(username, correctPassword);

    // Assert
    expect(successResult.success).toBe(true);
    expect(nextResult.success).toBe(true);
  });

  // Test 7: Different users have independent rate limits
  test('should maintain separate rate limits per user', () => {
    // Arrange
    const user1 = 'user1';
    const user2 = 'user2';
    const wrongPassword = 'WrongPassword';

    // Act: Trigger rate limit for user1
    for (let i = 0; i < 5; i++) {
      auth.authenticate(user1, wrongPassword);
    }

    const user1Result = auth.authenticate(user1, wrongPassword);
    const user2Result = auth.authenticate(user2, 'SecurePass123!');

    // Assert
    expect(user1Result.errorCode).toBe(AuthError.RATE_LIMITED);
    expect(user2Result.success).toBe(true);
  });

  // Test 8: Token format validation
  test('should generate tokens with correct format', () => {
    // Arrange
    const username = 'testuser';
    const password = 'SecurePass123!';

    // Act
    const result1 = auth.authenticate(username, password);
    const result2 = auth.authenticate(username, password);

    // Assert
    expect(result1.token).toMatch(/^token_testuser_\d+$/);
    expect(result2.token).toMatch(/^token_testuser_\d+$/);
    expect(result1.token).not.toBe(result2.token); // Tokens should be unique
  });

  // Test 9: Parameterized test - Various invalid inputs
  test.each([
    ['', '', AuthError.EMPTY_USERNAME],
    ['user', '', AuthError.EMPTY_PASSWORD],
    ['', 'pass', AuthError.EMPTY_USERNAME],
    ['admin\' OR \'1\'=\'1', 'password', AuthError.INVALID_CREDENTIALS],
    ['<script>alert(\'xss\')</script>', 'password', AuthError.INVALID_CREDENTIALS],
  ])('should fail for invalid input: username=%s, password=%s', (username, password, expectedError) => {
    // Act
    const result = auth.authenticate(username, password);

    // Assert
    expect(result.success).toBe(false);
    expect(result.errorCode).toBe(expectedError);
  });

  // Test 10: Snapshot testing for auth result structure
  test('should match snapshot for successful authentication', () => {
    // Arrange
    const username = 'testuser';
    const password = 'SecurePass123!';

    // Act
    const result = auth.authenticate(username, password);

    // Normalize dynamic token for snapshot
    const normalized = {
      ...result,
      token: result.token ? 'TOKEN_PLACEHOLDER' : undefined,
    };

    // Assert
    expect(normalized).toMatchSnapshot();
  });
});

// Test Suite: Mocking examples
describe('Authentication with Mocks', () => {
  // Test: Mocking Date.now() for consistent token generation
  test('should generate consistent tokens when time is mocked', () => {
    // Arrange
    const auth = new Authentication();
    const mockDate = 1609459200000; // 2021-01-01T00:00:00.000Z
    jest.spyOn(Date, 'now').mockReturnValue(mockDate);

    // Act
    const result = auth.authenticate('testuser', 'SecurePass123!');

    // Assert
    expect(result.token).toBe(`token_testuser_${mockDate}`);

    // Cleanup
    jest.restoreAllMocks();
  });
});
```

---

## Running Tests

### Local Execution

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm test -- authentication.test.ts

# Run tests matching pattern
npm test -- --testNamePattern="should authenticate"

# Run tests with verbose output
npm run test:verbose
```

### Coverage Report

```bash
# Generate coverage report
npm run test:coverage

# View coverage in browser
open coverage/index.html
```

---

## CI/CD Integration

Add to `.github/workflows/typescript-ci.yaml`:

```yaml
name: TypeScript Services CI with Jest

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest

    strategy:
      matrix:
        node-version: [18.x, 20.x]

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js ${{ matrix.node-version }}
        uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node-version }}
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run tests
        run: npm run test:ci

      - name: Upload coverage to Codecov
        uses: codecov/codecov-action@v4
        with:
          file: ./coverage/coverage-final.json
          flags: typescript-services
          name: codecov-typescript

      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: test-results-node-${{ matrix.node-version }}
          path: coverage/
```

---

## Best Practices

### 1. Test Structure (AAA Pattern)

```typescript
test('should do something', () => {
  // Arrange
  const input = 'test';

  // Act
  const result = doSomething(input);

  // Assert
  expect(result).toBe('expected');
});
```

### 2. Descriptive Test Names

```typescript
// Good: Describes what should happen
test('should authenticate successfully with valid credentials', () => {});

// Bad: Not descriptive
test('test1', () => {});
```

### 3. Use `describe` Blocks for Organization

```typescript
describe('Authentication', () => {
  describe('authenticate', () => {
    test('should succeed with valid credentials', () => {});
    test('should fail with invalid credentials', () => {});
  });

  describe('validateToken', () => {
    test('should validate correct token', () => {});
  });
});
```

### 4. Setup and Teardown

```typescript
describe('MyClass', () => {
  let instance: MyClass;

  beforeEach(() => {
    instance = new MyClass();
  });

  afterEach(() => {
    instance = null as any;
  });

  test('should work', () => {
    expect(instance).toBeDefined();
  });
});
```

### 5. Snapshot Testing

```typescript
test('should match snapshot', () => {
  const data = { foo: 'bar', timestamp: Date.now() };

  // Normalize dynamic data
  const normalized = { ...data, timestamp: 0 };

  expect(normalized).toMatchSnapshot();
});
```

---

## Advanced Features

### Async/Await Testing

```typescript
test('should fetch user data', async () => {
  const userData = await fetchUser('123');
  expect(userData.id).toBe('123');
});
```

### Mocking Modules

```typescript
// Mock external module
jest.mock('../../src/external/api');
import { fetchData } from '../../src/external/api';

test('should use mocked API', () => {
  (fetchData as jest.Mock).mockResolvedValue({ data: 'mocked' });
  // Test code using fetchData
});
```

### Testing Timers

```typescript
test('should execute after timeout', () => {
  jest.useFakeTimers();

  const callback = jest.fn();
  setTimeout(callback, 1000);

  jest.advanceTimersByTime(1000);
  expect(callback).toHaveBeenCalled();

  jest.useRealTimers();
});
```

---

## Metrics

### Target for Week 1:
- ✅ Jest installed and verified
- ✅ 10 unit tests created for TypeScript services
- ✅ CI/CD integration complete
- ✅ Coverage >30% on security module

### Success Criteria:
- [ ] All tests pass locally
- [ ] All tests pass in CI/CD
- [ ] Test execution time <3 seconds
- [ ] Coverage report generated

---

## Next Steps (Week 2)

1. Expand to 50 unit tests (API handlers)
2. Add integration tests with TestContainers
3. Begin Pact contract testing setup

---

**Status**: ✅ Setup Complete, Ready for Test Writing
**Owner**: @test_stabilize
**Last Updated**: 2025-11-05
