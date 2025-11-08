/**
 * Test Data Factory for User objects
 * RDB-002 Week 1 - Test Data Factories
 *
 * Provides deterministic test data generation for consistent, reproducible tests
 */

export interface User {
  id: number;
  name: string;
  email: string;
  createdAt: Date;
}

export class UserFactory {
  private static idCounter = 1;

  /**
   * Reset the ID counter (useful for test isolation)
   */
  static reset(): void {
    this.idCounter = 1;
  }

  /**
   * Create a default user with optional overrides
   */
  static create(overrides?: Partial<User>): User {
    const id = this.idCounter++;
    return {
      id,
      name: `User ${id}`,
      email: `user${id}@example.com`,
      createdAt: new Date('2025-01-01'),
      ...overrides
    };
  }

  /**
   * Create multiple users
   */
  static createMany(count: number, overrides?: Partial<User>): User[] {
    return Array.from({ length: count }, () => this.create(overrides));
  }

  /**
   * Create a user with specific preset (admin, guest, etc.)
   */
  static createAdmin(overrides?: Partial<User>): User {
    return this.create({
      name: 'Admin User',
      email: 'admin@example.com',
      ...overrides
    });
  }

  static createGuest(overrides?: Partial<User>): User {
    return this.create({
      name: 'Guest User',
      email: 'guest@example.com',
      ...overrides
    });
  }

  /**
   * Create a user with invalid data (for error testing)
   */
  static createInvalid(): Partial<User> {
    return {
      name: '',
      email: 'invalid-email'
    };
  }

  /**
   * Create a batch of users with different characteristics
   */
  static createBatch(): User[] {
    this.reset();
    return [
      this.create({ name: 'Alice Johnson', email: 'alice@example.com' }),
      this.create({ name: 'Bob Smith', email: 'bob@example.com' }),
      this.create({ name: 'Charlie Brown', email: 'charlie@example.com' }),
      this.create({ name: 'Diana Prince', email: 'diana@example.com' }),
      this.create({ name: 'Eve Adams', email: 'eve@example.com' })
    ];
  }
}
