import request from 'supertest';
import { createApp, resetDatabase } from '../server';

describe('API Integration Tests', () => {
  const app = createApp();

  beforeEach(() => {
    resetDatabase();
  });

  describe('GET /health', () => {
    it('should return healthy status', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body).toHaveProperty('status', 'healthy');
      expect(response.body).toHaveProperty('timestamp');
    });
  });

  describe('GET /api/users', () => {
    it('should return all users', async () => {
      const response = await request(app)
        .get('/api/users')
        .expect(200);

      expect(response.body.data).toHaveLength(2);
      expect(response.body.total).toBe(2);
      expect(response.body.data[0]).toHaveProperty('name', 'Alice Johnson');
      expect(response.body.data[1]).toHaveProperty('name', 'Bob Smith');
    });

    it('should support pagination with limit', async () => {
      const response = await request(app)
        .get('/api/users?limit=1')
        .expect(200);

      expect(response.body.data).toHaveLength(1);
      expect(response.body.limit).toBe(1);
      expect(response.body.total).toBe(2);
    });

    it('should support pagination with offset', async () => {
      const response = await request(app)
        .get('/api/users?offset=1')
        .expect(200);

      expect(response.body.data).toHaveLength(1);
      expect(response.body.offset).toBe(1);
      expect(response.body.data[0]).toHaveProperty('name', 'Bob Smith');
    });

    it('should support pagination with limit and offset', async () => {
      const response = await request(app)
        .get('/api/users?limit=1&offset=1')
        .expect(200);

      expect(response.body.data).toHaveLength(1);
      expect(response.body.limit).toBe(1);
      expect(response.body.offset).toBe(1);
      expect(response.body.data[0]).toHaveProperty('name', 'Bob Smith');
    });
  });

  describe('GET /api/users/:id', () => {
    it('should return user by ID', async () => {
      const response = await request(app)
        .get('/api/users/1')
        .expect(200);

      expect(response.body).toHaveProperty('id', 1);
      expect(response.body).toHaveProperty('name', 'Alice Johnson');
      expect(response.body).toHaveProperty('email', 'alice@example.com');
    });

    it('should return 404 for non-existent user', async () => {
      const response = await request(app)
        .get('/api/users/999')
        .expect(404);

      expect(response.body).toHaveProperty('error', 'User not found');
      expect(response.body).toHaveProperty('userId', 999);
    });
  });

  describe('POST /api/users', () => {
    it('should create a new user', async () => {
      const newUser = {
        name: 'Charlie Brown',
        email: 'charlie@example.com'
      };

      const response = await request(app)
        .post('/api/users')
        .send(newUser)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('name', 'Charlie Brown');
      expect(response.body).toHaveProperty('email', 'charlie@example.com');
      expect(response.body).toHaveProperty('createdAt');

      // Verify user was actually created
      const getResponse = await request(app)
        .get(`/api/users/${response.body.id}`)
        .expect(200);

      expect(getResponse.body).toHaveProperty('name', 'Charlie Brown');
    });

    it('should return 400 when name is missing', async () => {
      const response = await request(app)
        .post('/api/users')
        .send({ email: 'test@example.com' })
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Name and email are required');
    });

    it('should return 400 when email is missing', async () => {
      const response = await request(app)
        .post('/api/users')
        .send({ name: 'Test User' })
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Name and email are required');
    });

    it('should return 400 for invalid email format', async () => {
      const response = await request(app)
        .post('/api/users')
        .send({ name: 'Test User', email: 'invalid-email' })
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Invalid email format');
    });

    it('should return 409 for duplicate email', async () => {
      const response = await request(app)
        .post('/api/users')
        .send({ name: 'Another Alice', email: 'alice@example.com' })
        .expect(409);

      expect(response.body).toHaveProperty('error', 'Email already exists');
    });
  });

  describe('PUT /api/users/:id', () => {
    it('should update user name', async () => {
      const response = await request(app)
        .put('/api/users/1')
        .send({ name: 'Alice Updated' })
        .expect(200);

      expect(response.body).toHaveProperty('id', 1);
      expect(response.body).toHaveProperty('name', 'Alice Updated');
      expect(response.body).toHaveProperty('email', 'alice@example.com');
    });

    it('should update user email', async () => {
      const response = await request(app)
        .put('/api/users/1')
        .send({ email: 'alice.new@example.com' })
        .expect(200);

      expect(response.body).toHaveProperty('id', 1);
      expect(response.body).toHaveProperty('name', 'Alice Johnson');
      expect(response.body).toHaveProperty('email', 'alice.new@example.com');
    });

    it('should update both name and email', async () => {
      const response = await request(app)
        .put('/api/users/1')
        .send({ name: 'Alice Updated', email: 'alice.updated@example.com' })
        .expect(200);

      expect(response.body).toHaveProperty('name', 'Alice Updated');
      expect(response.body).toHaveProperty('email', 'alice.updated@example.com');
    });

    it('should return 404 for non-existent user', async () => {
      const response = await request(app)
        .put('/api/users/999')
        .send({ name: 'Updated Name' })
        .expect(404);

      expect(response.body).toHaveProperty('error', 'User not found');
    });

    it('should return 400 for invalid email format', async () => {
      const response = await request(app)
        .put('/api/users/1')
        .send({ email: 'invalid-email' })
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Invalid email format');
    });

    it('should return 409 when updating to duplicate email', async () => {
      const response = await request(app)
        .put('/api/users/1')
        .send({ email: 'bob@example.com' })
        .expect(409);

      expect(response.body).toHaveProperty('error', 'Email already exists');
    });
  });

  describe('DELETE /api/users/:id', () => {
    it('should delete user', async () => {
      const response = await request(app)
        .delete('/api/users/1')
        .expect(200);

      expect(response.body).toHaveProperty('message', 'User deleted successfully');
      expect(response.body.user).toHaveProperty('id', 1);

      // Verify user was actually deleted
      await request(app)
        .get('/api/users/1')
        .expect(404);
    });

    it('should return 404 when deleting non-existent user', async () => {
      const response = await request(app)
        .delete('/api/users/999')
        .expect(404);

      expect(response.body).toHaveProperty('error', 'User not found');
    });
  });

  describe('404 Handler', () => {
    it('should return 404 for unknown endpoints', async () => {
      const response = await request(app)
        .get('/api/unknown')
        .expect(404);

      expect(response.body).toHaveProperty('error', 'Endpoint not found');
      expect(response.body).toHaveProperty('path', '/api/unknown');
    });
  });
});
