import { Pool, RowDataPacket } from 'mysql2/promise';
import { User } from '../types';

export interface IUserRepository {
  findAll(limit: number, offset: number): Promise<{ users: User[]; total: number }>;
}

export class UserRepository implements IUserRepository {
  constructor(private pool: Pool) {}

  async findAll(limit: number, offset: number): Promise<{ users: User[]; total: number }> {
    const connection = await this.pool.getConnection();
    
    try {
      // Get total count
      const [countResult] = await connection.query<RowDataPacket[]>(
        'SELECT COUNT(*) as total FROM users'
      );
      const total = countResult[0].total;

      // Get paginated users ordered by created_at
      const [rows] = await connection.query<RowDataPacket[]>(
        'SELECT id, name, email, created_at as createdAt FROM users ORDER BY created_at DESC LIMIT ? OFFSET ?',
        [limit, offset]
      );

      const users: User[] = rows.map(row => ({
        id: row.id,
        name: row.name,
        email: row.email,
        createdAt: new Date(row.createdAt)
      }));

      return { users, total };
    } finally {
      connection.release();
    }
  }
}
