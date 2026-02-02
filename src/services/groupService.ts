import { IGroupRepository } from '../repositories/groupRepository';
import { Group, PaginatedResponse, GroupStatus } from '../types';
import { PAGINATION } from '../constants';

export interface IGroupService {
  getAllGroups(limit: number, offset: number): Promise<PaginatedResponse<Group>>;
  removeUserFromGroup(userId: number, groupId: number): Promise<{ success: boolean; message: string }>;
}

export class GroupService implements IGroupService {
  constructor(private groupRepository: IGroupRepository) {}

  async getAllGroups(limit: number, offset: number): Promise<PaginatedResponse<Group>> {
    const validLimit = Math.min(Math.max(limit, PAGINATION.MIN_LIMIT), PAGINATION.MAX_LIMIT);
    const validOffset = Math.max(offset, PAGINATION.MIN_OFFSET);

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

      const wasRemoved = await this.groupRepository.removeUserFromGroup(userId, groupId, queryRunner);

      if (!wasRemoved) {
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

      const remainingMemberCount = await this.groupRepository.getGroupMemberCount(groupId, queryRunner);
      const newStatus = remainingMemberCount === 0 ? GroupStatus.EMPTY : GroupStatus.NOT_EMPTY;
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
