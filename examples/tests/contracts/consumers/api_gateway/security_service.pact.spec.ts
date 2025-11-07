/**
 * Pact Consumer Contract Test - API Gateway → Security Service
 * Task: 57fbde - Comprehensive Test Framework / RDB-002
 * Layer 3: Contract Tests (Consumer Side)
 *
 * This test defines the contract between API Gateway (consumer)
 * and Security Service (provider) for authentication operations.
 */

import { Pact } from '@pact-foundation/pact';
import { like, term } from '@pact-foundation/pact/src/dsl/matchers';
import axios from 'axios';
import path from 'path';

// Initialize Pact
const provider = new Pact({
  consumer: 'APIGateway',
  provider: 'SecurityService',
  port: 8083,
  log: path.resolve(process.cwd(), 'logs', 'pact.log'),
  dir: path.resolve(process.cwd(), 'pacts'),
  logLevel: 'info',
});

describe('API Gateway → Security Service Contract', () => {
  // ===========================================================================
  // Setup and Teardown
  // ===========================================================================

  beforeAll(() => provider.setup());
  afterEach(() => provider.verify());
  afterAll(() => provider.finalize());

  // ===========================================================================
  // Authentication Contracts
  // ===========================================================================

  describe('User Authentication', () => {
    it('should authenticate user and return JWT token', async () => {
      // Given: Security service is available and user credentials are valid
      await provider.addInteraction({
        state: 'user with email test@example.com exists',
        uponReceiving: 'a request to authenticate user',
        withRequest: {
          method: 'POST',
          path: '/api/v1/auth/login',
          headers: {
            'Content-Type': 'application/json',
          },
          body: {
            email: 'test@example.com',
            password: 'secure-password-123',
          },
        },
        willRespondWith: {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
          },
          body: {
            success: true,
            token: like('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c'),
            expiresIn: like(3600),
            user: {
              id: like(1),
              email: 'test@example.com',
              role: like('user'),
            },
          },
        },
      });

      // When: API Gateway requests authentication
      const response = await axios.post(
        'http://localhost:8083/api/v1/auth/login',
        {
          email: 'test@example.com',
          password: 'secure-password-123',
        }
      );

      // Then: Response matches expected contract
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.token).toBeDefined();
      expect(response.data.expiresIn).toBeDefined();
      expect(response.data.user.email).toBe('test@example.com');
    });

    it('should reject invalid credentials', async () => {
      // Given: Security service is available
      await provider.addInteraction({
        state: 'security service is available',
        uponReceiving: 'a request with invalid credentials',
        withRequest: {
          method: 'POST',
          path: '/api/v1/auth/login',
          headers: {
            'Content-Type': 'application/json',
          },
          body: {
            email: 'test@example.com',
            password: 'wrong-password',
          },
        },
        willRespondWith: {
          status: 401,
          headers: {
            'Content-Type': 'application/json',
          },
          body: {
            success: false,
            error: 'Invalid credentials',
          },
        },
      });

      // When: API Gateway requests authentication with invalid credentials
      try {
        await axios.post('http://localhost:8083/api/v1/auth/login', {
          email: 'test@example.com',
          password: 'wrong-password',
        });
        fail('Expected request to fail with 401');
      } catch (error: any) {
        // Then: Response indicates authentication failure
        expect(error.response.status).toBe(401);
        expect(error.response.data.success).toBe(false);
        expect(error.response.data.error).toBe('Invalid credentials');
      }
    });
  });

  // ===========================================================================
  // Token Validation Contracts
  // ===========================================================================

  describe('Token Validation', () => {
    it('should validate JWT token and return user info', async () => {
      // Given: Security service is available and token is valid
      await provider.addInteraction({
        state: 'valid JWT token exists',
        uponReceiving: 'a request to validate JWT token',
        withRequest: {
          method: 'POST',
          path: '/api/v1/auth/validate',
          headers: {
            'Content-Type': 'application/json',
            Authorization: term({
              matcher: 'Bearer [A-Za-z0-9\\-._~+/]+=*',
              generate: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test.signature',
            }),
          },
        },
        willRespondWith: {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
          },
          body: {
            valid: true,
            user: {
              id: like(1),
              email: 'test@example.com',
              role: like('user'),
            },
          },
        },
      });

      // When: API Gateway validates token
      const response = await axios.post(
        'http://localhost:8083/api/v1/auth/validate',
        {},
        {
          headers: {
            Authorization: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test.signature',
          },
        }
      );

      // Then: Response indicates token is valid
      expect(response.status).toBe(200);
      expect(response.data.valid).toBe(true);
      expect(response.data.user).toBeDefined();
      expect(response.data.user.email).toBe('test@example.com');
    });

    it('should reject expired token', async () => {
      // Given: Security service is available
      await provider.addInteraction({
        state: 'security service is available',
        uponReceiving: 'a request with expired token',
        withRequest: {
          method: 'POST',
          path: '/api/v1/auth/validate',
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer expired-token',
          },
        },
        willRespondWith: {
          status: 401,
          headers: {
            'Content-Type': 'application/json',
          },
          body: {
            valid: false,
            error: 'Token expired',
          },
        },
      });

      // When: API Gateway validates expired token
      try {
        await axios.post(
          'http://localhost:8083/api/v1/auth/validate',
          {},
          {
            headers: {
              Authorization: 'Bearer expired-token',
            },
          }
        );
        fail('Expected request to fail with 401');
      } catch (error: any) {
        // Then: Response indicates token is invalid
        expect(error.response.status).toBe(401);
        expect(error.response.data.valid).toBe(false);
        expect(error.response.data.error).toBe('Token expired');
      }
    });
  });

  // ===========================================================================
  // User Registration Contracts
  // ===========================================================================

  describe('User Registration', () => {
    it('should register new user', async () => {
      // Given: Security service is available and user does not exist
      await provider.addInteraction({
        state: 'user with email newuser@example.com does not exist',
        uponReceiving: 'a request to register new user',
        withRequest: {
          method: 'POST',
          path: '/api/v1/auth/register',
          headers: {
            'Content-Type': 'application/json',
          },
          body: {
            email: 'newuser@example.com',
            password: 'secure-password-456',
            name: 'New User',
          },
        },
        willRespondWith: {
          status: 201,
          headers: {
            'Content-Type': 'application/json',
          },
          body: {
            success: true,
            user: {
              id: like(2),
              email: 'newuser@example.com',
              name: 'New User',
              role: 'user',
            },
          },
        },
      });

      // When: API Gateway requests user registration
      const response = await axios.post(
        'http://localhost:8083/api/v1/auth/register',
        {
          email: 'newuser@example.com',
          password: 'secure-password-456',
          name: 'New User',
        }
      );

      // Then: User is created successfully
      expect(response.status).toBe(201);
      expect(response.data.success).toBe(true);
      expect(response.data.user.email).toBe('newuser@example.com');
    });

    it('should reject registration with existing email', async () => {
      // Given: User with email already exists
      await provider.addInteraction({
        state: 'user with email test@example.com exists',
        uponReceiving: 'a request to register user with existing email',
        withRequest: {
          method: 'POST',
          path: '/api/v1/auth/register',
          headers: {
            'Content-Type': 'application/json',
          },
          body: {
            email: 'test@example.com',
            password: 'secure-password-789',
            name: 'Duplicate User',
          },
        },
        willRespondWith: {
          status: 409,
          headers: {
            'Content-Type': 'application/json',
          },
          body: {
            success: false,
            error: 'Email already registered',
          },
        },
      });

      // When: API Gateway attempts registration with existing email
      try {
        await axios.post('http://localhost:8083/api/v1/auth/register', {
          email: 'test@example.com',
          password: 'secure-password-789',
          name: 'Duplicate User',
        });
        fail('Expected request to fail with 409');
      } catch (error: any) {
        // Then: Response indicates email conflict
        expect(error.response.status).toBe(409);
        expect(error.response.data.success).toBe(false);
        expect(error.response.data.error).toBe('Email already registered');
      }
    });
  });

  // ===========================================================================
  // Authorization Contracts
  // ===========================================================================

  describe('Authorization', () => {
    it('should check user permissions for resource access', async () => {
      // Given: User has permission to access widget resource
      await provider.addInteraction({
        state: 'user 1 has permission to access widget 123',
        uponReceiving: 'a request to check widget access permission',
        withRequest: {
          method: 'POST',
          path: '/api/v1/auth/authorize',
          headers: {
            'Content-Type': 'application/json',
            Authorization: term({
              matcher: 'Bearer [A-Za-z0-9\\-._~+/]+=*',
              generate: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test.signature',
            }),
          },
          body: {
            resource: 'widget',
            resourceId: '123',
            action: 'read',
          },
        },
        willRespondWith: {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
          },
          body: {
            authorized: true,
            permissions: like(['read', 'update']),
          },
        },
      });

      // When: API Gateway checks authorization
      const response = await axios.post(
        'http://localhost:8083/api/v1/auth/authorize',
        {
          resource: 'widget',
          resourceId: '123',
          action: 'read',
        },
        {
          headers: {
            Authorization: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test.signature',
          },
        }
      );

      // Then: Response indicates user is authorized
      expect(response.status).toBe(200);
      expect(response.data.authorized).toBe(true);
      expect(response.data.permissions).toContain('read');
    });

    it('should deny access when user lacks permissions', async () => {
      // Given: User does not have permission
      await provider.addInteraction({
        state: 'user 1 does not have permission to delete widget 456',
        uponReceiving: 'a request to check delete permission',
        withRequest: {
          method: 'POST',
          path: '/api/v1/auth/authorize',
          headers: {
            'Content-Type': 'application/json',
            Authorization: term({
              matcher: 'Bearer [A-Za-z0-9\\-._~+/]+=*',
              generate: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test.signature',
            }),
          },
          body: {
            resource: 'widget',
            resourceId: '456',
            action: 'delete',
          },
        },
        willRespondWith: {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
          },
          body: {
            authorized: false,
            reason: 'Insufficient permissions',
          },
        },
      });

      // When: API Gateway checks authorization
      const response = await axios.post(
        'http://localhost:8083/api/v1/auth/authorize',
        {
          resource: 'widget',
          resourceId: '456',
          action: 'delete',
        },
        {
          headers: {
            Authorization: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test.signature',
          },
        }
      );

      // Then: Response indicates user is not authorized
      expect(response.status).toBe(200);
      expect(response.data.authorized).toBe(false);
      expect(response.data.reason).toBe('Insufficient permissions');
    });
  });
});

/**
 * Usage Instructions:
 *
 * 1. Install dependencies:
 *    npm install
 *
 * 2. Run consumer tests (generates contract):
 *    npm test
 *
 * 3. Publish contract to Pact Broker:
 *    npm run pact:publish:local
 *
 * 4. View contract in Pact Broker:
 *    http://localhost:9292/pacts/provider/SecurityService/consumer/APIGateway/latest
 *
 * 5. Provider verification:
 *    See ../providers/security-service/pact-verification.test.ts
 *
 * Contract States Required by Provider:
 * - "security service is available"
 * - "user with email test@example.com exists"
 * - "user with email newuser@example.com does not exist"
 * - "valid JWT token exists"
 * - "user 1 has permission to access widget 123"
 * - "user 1 does not have permission to delete widget 456"
 */
