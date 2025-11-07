import express, { Request, Response } from 'express';

export interface User {
  id: number;
  name: string;
  email: string;
  createdAt: Date;
}

// In-memory database for testing
let users: User[] = [
  { id: 1, name: 'Alice Johnson', email: 'alice@example.com', createdAt: new Date('2025-01-01') },
  { id: 2, name: 'Bob Smith', email: 'bob@example.com', createdAt: new Date('2025-01-02') }
];

let nextId = 3;

export const createApp = () => {
  const app = express();
  app.use(express.json());

  // Health check endpoint
  app.get('/health', (req: Request, res: Response) => {
    res.status(200).json({ status: 'healthy', timestamp: new Date().toISOString() });
  });

  // Get all users
  app.get('/api/users', (req: Request, res: Response) => {
    const { limit, offset } = req.query;
    let result = users;

    if (offset) {
      result = result.slice(Number(offset));
    }

    if (limit) {
      result = result.slice(0, Number(limit));
    }

    res.status(200).json({
      data: result,
      total: users.length,
      limit: limit ? Number(limit) : users.length,
      offset: offset ? Number(offset) : 0
    });
  });

  // Get user by ID
  app.get('/api/users/:id', (req: Request, res: Response) => {
    const userId = parseInt(req.params.id, 10);
    const user = users.find(u => u.id === userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found', userId });
    }

    res.status(200).json(user);
  });

  // Create new user
  app.post('/api/users', (req: Request, res: Response) => {
    const { name, email } = req.body;

    // Validation
    if (!name || !email) {
      return res.status(400).json({ error: 'Name and email are required' });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    // Check for duplicate email
    if (users.some(u => u.email === email)) {
      return res.status(409).json({ error: 'Email already exists' });
    }

    const newUser: User = {
      id: nextId++,
      name,
      email,
      createdAt: new Date()
    };

    users.push(newUser);
    res.status(201).json(newUser);
  });

  // Update user
  app.put('/api/users/:id', (req: Request, res: Response) => {
    const userId = parseInt(req.params.id, 10);
    const { name, email } = req.body;

    const userIndex = users.findIndex(u => u.id === userId);

    if (userIndex === -1) {
      return res.status(404).json({ error: 'User not found', userId });
    }

    // Validate email if provided
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    // Check for duplicate email (excluding current user)
    if (email && users.some(u => u.email === email && u.id !== userId)) {
      return res.status(409).json({ error: 'Email already exists' });
    }

    if (name) users[userIndex].name = name;
    if (email) users[userIndex].email = email;

    res.status(200).json(users[userIndex]);
  });

  // Delete user
  app.delete('/api/users/:id', (req: Request, res: Response) => {
    const userId = parseInt(req.params.id, 10);
    const userIndex = users.findIndex(u => u.id === userId);

    if (userIndex === -1) {
      return res.status(404).json({ error: 'User not found', userId });
    }

    const deletedUser = users[userIndex];
    users.splice(userIndex, 1);

    res.status(200).json({ message: 'User deleted successfully', user: deletedUser });
  });

  // 404 handler
  app.use((req: Request, res: Response) => {
    res.status(404).json({ error: 'Endpoint not found', path: req.path });
  });

  return app;
};

// Export reset function for testing
export const resetDatabase = () => {
  users = [
    { id: 1, name: 'Alice Johnson', email: 'alice@example.com', createdAt: new Date('2025-01-01') },
    { id: 2, name: 'Bob Smith', email: 'bob@example.com', createdAt: new Date('2025-01-02') }
  ];
  nextId = 3;
};

// Start server if run directly
if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  const app = createApp();
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}
