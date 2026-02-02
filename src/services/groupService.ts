import { IGroupRepository } from '../repositories/groupRepository';

export interface IGroupService {
  removeUserFromGroup(userId: number, groupId: number): Promise<{ success: boolean; message: string }>;
}

export class GroupService implements IGroupService {
  constructor(private groupRepository: IGroupRepository) {}

  async removeUserFromGroup(userId: number, groupId: number): Promise<{ success: boolean; message: string }> {
    const connection = await this.groupRepository.getConnection();
    
    try {
      // Start transaction
      await connection.beginTransaction();

      // Remove user from group
      const removed = await this.groupRepository.removeUserFromGroup(userId, groupId, connection);

      if (!removed) {
        await connection.rollback();
        return {
          success: false,
          message: 'User is not a member of this group'
        };
      }

      // Check remaining members in the group
      const memberCount = await this.groupRepository.getGroupMemberCount(groupId, connection);

      // Update group status based on member count
      const newStatus = memberCount === 0 ? 'empty' : 'notEmpty';
      await this.groupRepository.updateGroupStatus(groupId, newStatus, connection);

      // Commit transaction
      await connection.commit();

      return {
        success: true,
        message: `User ${userId} removed from group ${groupId}. Group status updated to ${newStatus}`
      };
    } catch (error) {
      // Rollback on error
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }
}
