import { IGroupRepository } from '../repositories/groupRepository';
import { Group, PaginatedResponse } from '../types';

export interface IGroupService {
  getAllGroups(limit: number, offset: number): Promise<PaginatedResponse<Group>>;
  removeUserFromGroup(userId: number, groupId: number): Promise<{ success: boolean; message: string }>;
}

export class GroupService implements IGroupService {
  constructor(private groupRepository: IGroupRepository) {}

  async getAllGroups(limit: number, offset: number): Promise<PaginatedResponse<Group>> {
    // Validate input
    const validLimit = Math.min(Math.max(limit, 1), 100); // Max 100 items per page
    const validOffset = Math.max(offset, 0);

    const { groups, total } = await this.groupRepository.findAll(validLimit, validOffset);

    return {
      data: groups,
      pagination: {
        limit: validLimit,
        offset: validOffset,
        total
      }
    };
  }

  async removeUserFromGroup(userId: number, groupId: number): Promise<{ success: boolean; message: string }> {
    const queryRunner = await this.groupRepository.getQueryRunner();
    await queryRunner.connect();
    
    try {
      // Start transaction
      await queryRunner.startTransaction();

      // Remove user from group
      const removed = await this.groupRepository.removeUserFromGroup(userId, groupId, queryRunner);

      if (!removed) {
        try {
          await queryRunner.rollbackTransaction();
        } catch (rollbackError) {
          console.error('Rollback failed:', rollbackError);
        }
        return {
          success: false,
          message: 'User is not a member of this group'
        };
      }

      // Check remaining members in the group
      const memberCount = await this.groupRepository.getGroupMemberCount(groupId, queryRunner);

      // Update group status based on member count
      const newStatus = memberCount === 0 ? 'empty' : 'notEmpty';
      await this.groupRepository.updateGroupStatus(groupId, newStatus, queryRunner);

      // Commit transaction
      await queryRunner.commitTransaction();

      return {
        success: true,
        message: `User ${userId} removed from group ${groupId}. Group status updated to ${newStatus}`
      };
    } catch (error) {
      // Rollback on error
      try {
        await queryRunner.rollbackTransaction();
      } catch (rollbackError) {
        console.error('Rollback failed:', rollbackError);
      }
      throw error;
    } finally {
      await queryRunner.release();
    }
  }
}
