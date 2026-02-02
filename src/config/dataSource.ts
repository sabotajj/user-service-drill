import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { User, Group } from '../entities';

export const AppDataSource = new DataSource({
  type: 'mysql',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  username: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'rootpassword',
  database: process.env.DB_NAME || 'mydatabase',
  synchronize: false, // Set to false in production
  logging: process.env.NODE_ENV === 'development',
  entities: [User, Group],
  migrations: [],
  subscribers: [],
});

export async function initializeDatabase(): Promise<DataSource> {
  if (!AppDataSource.isInitialized) {
    await AppDataSource.initialize();
    console.log('Database connection established with TypeORM');
  }
  return AppDataSource;
}
