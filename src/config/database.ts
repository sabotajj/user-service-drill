import mysql from 'mysql2/promise';
import { DatabaseConfig } from '../types';

export const dbConfig: DatabaseConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  user: process.env.DB_USER || 'user',
  password: process.env.DB_PASSWORD || 'password',
  database: process.env.DB_NAME || 'mydatabase'
};

export const createPool = () => {
  return mysql.createPool(dbConfig);
};

export const pool = createPool();
