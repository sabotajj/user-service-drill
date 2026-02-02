import { Pool, RowDataPacket, PoolConnection } from 'mysql2/promise';
import { Group } from '../types';

export interface IGroupRepository {
  findAll(limit: number, offset: number): Promise<{ groups: Group[]; total: number }>;
  removeUserFromGroup(userId: number, groupId: number, connection: PoolConnection): Promise<boolean>;
  getGroupMemberCount(groupId: number, connection: PoolConnection): Promise<number>;
  updateGroupStatus(groupId: number, status: string, connection: PoolConnection): Promise<void>;
  getConnection(): Promise<PoolConnection>;
}

export class GroupRepository implements IGroupRepository {
  constructor(private pool: Pool) {}

  async getConnection(): Promise<PoolConnection> {
    return await this.pool.getConnection();
  }

  async findAll(limit: number, offset: number): Promise<{ groups: Group[]; total: number }> {
    const connection = await this.pool.getConnection();
    
    try {
      // Get total count
      const [countResult] = await connection.query<RowDataPacket[]>(
        'SELECT COUNT(*) as total FROM `groups`'
      );
      const total = countResult[0].total;

      // Get paginated groups ordered by created_at
      const [rows] = await connection.query<RowDataPacket[]>(
        'SELECT id, name, status, created_at as createdAt FROM `groups` ORDER BY created_at DESC LIMIT ? OFFSET ?',
        [limit, offset]
      );

      const groups: Group[] = rows.map(row => ({
        id: row.id,
        name: row.name,
        description: '',
        status: row.status,
        createdAt: new Date(row.createdAt)
      }));

      return { groups, total };
    } finally {
      connection.release();
    }
  }

  async removeUserFromGroup(userId: number, groupId: number, connection: PoolConnection): Promise<boolean> {
    const [result]: any = await connection.query(
      'DELETE FROM user_groups WHERE user_id = ? AND group_id = ?',
      [userId, groupId]
    );
    
    return result.affectedRows > 0;
  }

  async getGroupMemberCount(groupId: number, connection: PoolConnection): Promise<number> {
    const [rows] = await connection.query<RowDataPacket[]>(
      'SELECT COUNT(*) as count FROM user_groups WHERE group_id = ?',
      [groupId]
    );
    
    return rows[0].count;
  }

  async updateGroupStatus(groupId: number, status: string, connection: PoolConnection): Promise<void> {
    await connection.query(
      'UPDATE `groups` SET status = ? WHERE id = ?',
      [status, groupId]
    );
  }
}
