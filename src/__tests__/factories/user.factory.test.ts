/**
 * Tests for User Factory
 * Validates test data factory functionality
 */

import { UserFactory } from './user.factory';

describe('UserFactory', () => {
  beforeEach(() => {
    UserFactory.reset();
  });

  describe('create', () => {
    it('should create user with default values', () => {
      const user = UserFactory.create();

      expect(user).toMatchObject({
        id: 1,
        name: 'User 1',
        email: 'user1@example.com'
      });
      expect(user.createdAt).toBeInstanceOf(Date);
    });

    it('should create user with overrides', () => {
      const user = UserFactory.create({
        name: 'Custom Name',
        email: 'custom@example.com'
      });

      expect(user.name).toBe('Custom Name');
      expect(user.email).toBe('custom@example.com');
    });

    it('should increment ID for each user', () => {
      const user1 = UserFactory.create();
      const user2 = UserFactory.create();
      const user3 = UserFactory.create();

      expect(user1.id).toBe(1);
      expect(user2.id).toBe(2);
      expect(user3.id).toBe(3);
    });
  });

  describe('createMany', () => {
    it('should create multiple users', () => {
      const users = UserFactory.createMany(5);

      expect(users).toHaveLength(5);
      expect(users[0].id).toBe(1);
      expect(users[4].id).toBe(5);
    });

    it('should apply overrides to all users', () => {
      const users = UserFactory.createMany(3, { name: 'Same Name' });

      users.forEach(user => {
        expect(user.name).toBe('Same Name');
      });
    });
  });

  describe('createAdmin', () => {
    it('should create admin user with preset values', () => {
      const admin = UserFactory.createAdmin();

      expect(admin.name).toBe('Admin User');
      expect(admin.email).toBe('admin@example.com');
    });

    it('should allow overriding admin preset', () => {
      const admin = UserFactory.createAdmin({ name: 'Super Admin' });

      expect(admin.name).toBe('Super Admin');
      expect(admin.email).toBe('admin@example.com');
    });
  });

  describe('createGuest', () => {
    it('should create guest user with preset values', () => {
      const guest = UserFactory.createGuest();

      expect(guest.name).toBe('Guest User');
      expect(guest.email).toBe('guest@example.com');
    });
  });

  describe('createInvalid', () => {
    it('should create user with invalid data', () => {
      const invalid = UserFactory.createInvalid();

      expect(invalid.name).toBe('');
      expect(invalid.email).toBe('invalid-email');
    });
  });

  describe('createBatch', () => {
    it('should create predefined batch of users', () => {
      const batch = UserFactory.createBatch();

      expect(batch).toHaveLength(5);
      expect(batch[0].name).toBe('Alice Johnson');
      expect(batch[1].name).toBe('Bob Smith');
      expect(batch[4].name).toBe('Eve Adams');
    });

    it('should reset IDs when creating batch', () => {
      UserFactory.create(); // ID 1
      UserFactory.create(); // ID 2

      const batch = UserFactory.createBatch();

      // Batch should start from ID 1
      expect(batch[0].id).toBe(1);
    });
  });

  describe('reset', () => {
    it('should reset ID counter', () => {
      UserFactory.create(); // ID 1
      UserFactory.create(); // ID 2

      UserFactory.reset();

      const user = UserFactory.create();
      expect(user.id).toBe(1);
    });
  });
});
