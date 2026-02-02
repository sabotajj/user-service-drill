import { Pool, RowDataPacket, PoolConnection } from 'mysql2/promise';
import { User, UserStatusUpdate } from '../types';

export interface IUserRepository {
  findAll(limit: number, offset: number): Promise<{ users: User[]; total: number }>;
  updateUsersStatuses(updates: UserStatusUpdate[], connection: PoolConnection): Promise<number>;
  getConnection(): Promise<PoolConnection>;
}

export class UserRepository implements IUserRepository {
  constructor(private pool: Pool) {}

  async getConnection(): Promise<PoolConnection> {
    return await this.pool.getConnection();
  }

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

  async updateUsersStatuses(updates: UserStatusUpdate[], connection: PoolConnection): Promise<number> {
    let updatedCount = 0;

    for (const update of updates) {
      const [result]: any = await connection.query(
        'UPDATE users SET status = ? WHERE id = ?',
        [update.status, update.userId]
      );
      updatedCount += result.affectedRows;
    }

    return updatedCount;
  }
}
