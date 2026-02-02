import { Pool, RowDataPacket, PoolConnection } from 'mysql2/promise';
import { Group } from '../types';

export interface IGroupRepository {
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
