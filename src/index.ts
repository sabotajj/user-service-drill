import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import { config } from './config/server';
import routes from './routes';

const app: Application = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api', routes);

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'OK', message: 'Server is running' });
});

// Start server
app.listen(config.port, () => {
  console.log(`Server is running on port ${config.port}`);
  console.log(`Environment: ${config.env}`);
  console.log('\nAvailable endpoints:');
  console.log('- GET  /api/users?page=1&limit=10');
  console.log('- GET  /api/groups?page=1&limit=10');
  console.log('- DELETE /api/groups/:groupId/users/:userId');
});

export default app;
