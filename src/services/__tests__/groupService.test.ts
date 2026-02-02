import { GroupService } from '../groupService';
import { IGroupRepository } from '../../repositories/groupRepository';
import { QueryRunner } from 'typeorm';

describe('GroupService - removeUserFromGroup', () => {
  let groupService: GroupService;
  let mockGroupRepository: jest.Mocked<IGroupRepository>;
  let mockQueryRunner: jest.Mocked<QueryRunner>;

  beforeEach(() => {
    // Mock QueryRunner
    mockQueryRunner = {
      connect: jest.fn(),
      startTransaction: jest.fn(),
      commitTransaction: jest.fn(),
      rollbackTransaction: jest.fn(),
      release: jest.fn()
    } as any;

    // Mock repository
    mockGroupRepository = {
      findAll: jest.fn(),
      removeUserFromGroup: jest.fn(),
      getGroupMemberCount: jest.fn(),
      updateGroupStatus: jest.fn(),
      getQueryRunner: jest.fn().mockResolvedValue(mockQueryRunner)
    } as jest.Mocked<IGroupRepository>;

    // Create service with mocked repository
    groupService = new GroupService(mockGroupRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Success cases', () => {
    it('should remove user from group and keep group as notEmpty when other members exist', async () => {
      mockGroupRepository.removeUserFromGroup.mockResolvedValue(true);
      mockGroupRepository.getGroupMemberCount.mockResolvedValue(3); // 3 members remain

      const result = await groupService.removeUserFromGroup(1, 10);

      expect(result.success).toBe(true);
      expect(result.message).toContain('User 1 removed from group 10');
      expect(result.message).toContain('notEmpty');
      expect(mockQueryRunner.startTransaction).toHaveBeenCalledTimes(1);
      expect(mockGroupRepository.removeUserFromGroup).toHaveBeenCalledWith(1, 10, mockQueryRunner);
      expect(mockGroupRepository.getGroupMemberCount).toHaveBeenCalledWith(10, mockQueryRunner);
      expect(mockGroupRepository.updateGroupStatus).toHaveBeenCalledWith(10, 'notEmpty', mockQueryRunner);
      expect(mockQueryRunner.commitTransaction).toHaveBeenCalledTimes(1);
      expect(mockQueryRunner.release).toHaveBeenCalledTimes(1);
      expect(mockQueryRunner.rollbackTransaction).not.toHaveBeenCalled();
    });

    it('should remove last user from group and set group status to empty', async () => {
      mockGroupRepository.removeUserFromGroup.mockResolvedValue(true);
      mockGroupRepository.getGroupMemberCount.mockResolvedValue(0); // No members remain

      const result = await groupService.removeUserFromGroup(5, 20);

      expect(result.success).toBe(true);
      expect(result.message).toContain('User 5 removed from group 20');
      expect(result.message).toContain('empty');
      expect(mockGroupRepository.removeUserFromGroup).toHaveBeenCalledWith(5, 20, mockQueryRunner);
      expect(mockGroupRepository.getGroupMemberCount).toHaveBeenCalledWith(20, mockQueryRunner);
      expect(mockGroupRepository.updateGroupStatus).toHaveBeenCalledWith(20, 'empty', mockQueryRunner);
      expect(mockQueryRunner.commitTransaction).toHaveBeenCalledTimes(1);
      expect(mockQueryRunner.release).toHaveBeenCalledTimes(1);
    });

    it('should remove second-to-last user and keep group as notEmpty with 1 member', async () => {
      mockGroupRepository.removeUserFromGroup.mockResolvedValue(true);
      mockGroupRepository.getGroupMemberCount.mockResolvedValue(1); // 1 member remains

      const result = await groupService.removeUserFromGroup(10, 30);

      expect(result.success).toBe(true);
      expect(mockGroupRepository.updateGroupStatus).toHaveBeenCalledWith(30, 'notEmpty', mockQueryRunner);
      expect(mockQueryRunner.commitTransaction).toHaveBeenCalledTimes(1);
    });
  });

  describe('Failure cases', () => {
    it('should return failure when user is not a member of the group', async () => {
      mockGroupRepository.removeUserFromGroup.mockResolvedValue(false); // User not found in group

      const result = await groupService.removeUserFromGroup(1, 10);

      expect(result.success).toBe(false);
      expect(result.message).toBe('User is not a member of this group');
      expect(mockQueryRunner.startTransaction).toHaveBeenCalledTimes(1);
      expect(mockGroupRepository.removeUserFromGroup).toHaveBeenCalledWith(1, 10, mockQueryRunner);
      expect(mockGroupRepository.getGroupMemberCount).not.toHaveBeenCalled();
      expect(mockGroupRepository.updateGroupStatus).not.toHaveBeenCalled();
      expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalledTimes(1);
      expect(mockQueryRunner.commitTransaction).not.toHaveBeenCalled();
      expect(mockQueryRunner.release).toHaveBeenCalledTimes(1);
    });

    it('should rollback and throw error when remove operation fails', async () => {
      const dbError = new Error('Database error during removal');
      mockGroupRepository.removeUserFromGroup.mockRejectedValue(dbError);

      await expect(groupService.removeUserFromGroup(1, 10))
        .rejects
        .toThrow('Database error during removal');

      expect(mockQueryRunner.startTransaction).toHaveBeenCalledTimes(1);
      expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalledTimes(1);
      expect(mockQueryRunner.commitTransaction).not.toHaveBeenCalled();
      expect(mockQueryRunner.release).toHaveBeenCalledTimes(1);
    });

    it('should rollback and throw error when getGroupMemberCount fails', async () => {
      mockGroupRepository.removeUserFromGroup.mockResolvedValue(true);
      const countError = new Error('Failed to count members');
      mockGroupRepository.getGroupMemberCount.mockRejectedValue(countError);

      await expect(groupService.removeUserFromGroup(1, 10))
        .rejects
        .toThrow('Failed to count members');

      expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalledTimes(1);
      expect(mockQueryRunner.commitTransaction).not.toHaveBeenCalled();
      expect(mockQueryRunner.release).toHaveBeenCalledTimes(1);
    });

    it('should rollback and throw error when updateGroupStatus fails', async () => {
      mockGroupRepository.removeUserFromGroup.mockResolvedValue(true);
      mockGroupRepository.getGroupMemberCount.mockResolvedValue(0);
      const updateError = new Error('Failed to update status');
      mockGroupRepository.updateGroupStatus.mockRejectedValue(updateError);

      await expect(groupService.removeUserFromGroup(1, 10))
        .rejects
        .toThrow('Failed to update status');

      expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalledTimes(1);
      expect(mockQueryRunner.commitTransaction).not.toHaveBeenCalled();
      expect(mockQueryRunner.release).toHaveBeenCalledTimes(1);
    });

    it('should release connection even when rollback fails', async () => {
      // Mock console.error to suppress expected error output
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      mockGroupRepository.removeUserFromGroup.mockRejectedValue(new Error('Remove failed'));
      mockQueryRunner.rollbackTransaction.mockRejectedValue(new Error('Rollback failed'));

      await expect(groupService.removeUserFromGroup(1, 10))
        .rejects
        .toThrow('Remove failed');

      expect(mockQueryRunner.release).toHaveBeenCalledTimes(1);
      expect(consoleErrorSpy).toHaveBeenCalledWith('Rollback failed:', expect.any(Error));
      
      consoleErrorSpy.mockRestore();
    });
  });

  describe('Group status logic', () => {
    it('should correctly transition from notEmpty to empty when last user removed', async () => {
      mockGroupRepository.removeUserFromGroup.mockResolvedValue(true);
      mockGroupRepository.getGroupMemberCount.mockResolvedValue(0);

      await groupService.removeUserFromGroup(1, 10);

      expect(mockGroupRepository.updateGroupStatus).toHaveBeenCalledWith(10, 'empty', mockQueryRunner);
    });

    it('should maintain notEmpty status when exactly 1 member remains', async () => {
      mockGroupRepository.removeUserFromGroup.mockResolvedValue(true);
      mockGroupRepository.getGroupMemberCount.mockResolvedValue(1);

      await groupService.removeUserFromGroup(1, 10);

      expect(mockGroupRepository.updateGroupStatus).toHaveBeenCalledWith(10, 'notEmpty', mockQueryRunner);
    });

    it('should maintain notEmpty status when many members remain', async () => {
      mockGroupRepository.removeUserFromGroup.mockResolvedValue(true);
      mockGroupRepository.getGroupMemberCount.mockResolvedValue(100);

      await groupService.removeUserFromGroup(1, 10);

      expect(mockGroupRepository.updateGroupStatus).toHaveBeenCalledWith(10, 'notEmpty', mockQueryRunner);
    });

    it('should update status only after successful removal', async () => {
      mockGroupRepository.removeUserFromGroup.mockResolvedValue(true);
      mockGroupRepository.getGroupMemberCount.mockResolvedValue(0);

      await groupService.removeUserFromGroup(1, 10);

      // Verify order of operations
      const removeCall = mockGroupRepository.removeUserFromGroup.mock.invocationCallOrder[0];
      const countCall = mockGroupRepository.getGroupMemberCount.mock.invocationCallOrder[0];
      const updateCall = mockGroupRepository.updateGroupStatus.mock.invocationCallOrder[0];

      expect(removeCall).toBeLessThan(countCall);
      expect(countCall).toBeLessThan(updateCall);
    });
  });

  describe('Edge cases', () => {
    it('should handle removal with invalid user ID gracefully', async () => {
      mockGroupRepository.removeUserFromGroup.mockResolvedValue(false);

      const result = await groupService.removeUserFromGroup(-1, 10);

      expect(result.success).toBe(false);
      expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalledTimes(1);
    });

    it('should handle removal with invalid group ID gracefully', async () => {
      mockGroupRepository.removeUserFromGroup.mockResolvedValue(false);

      const result = await groupService.removeUserFromGroup(1, -10);

      expect(result.success).toBe(false);
      expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalledTimes(1);
    });

    it('should ensure commit happens after all operations', async () => {
      mockGroupRepository.removeUserFromGroup.mockResolvedValue(true);
      mockGroupRepository.getGroupMemberCount.mockResolvedValue(2);

      await groupService.removeUserFromGroup(1, 10);

      const updateCall = mockGroupRepository.updateGroupStatus.mock.invocationCallOrder[0];
      const commitCall = mockQueryRunner.commitTransaction.mock.invocationCallOrder[0];

      expect(updateCall).toBeLessThan(commitCall);
    });

    it('should not commit when user is not in group', async () => {
      mockGroupRepository.removeUserFromGroup.mockResolvedValue(false);

      await groupService.removeUserFromGroup(1, 10);

      expect(mockQueryRunner.commitTransaction).not.toHaveBeenCalled();
      expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalledTimes(1);
    });
  });

  describe('Transaction integrity', () => {
    it('should always begin transaction before any operations', async () => {
      mockGroupRepository.removeUserFromGroup.mockResolvedValue(true);
      mockGroupRepository.getGroupMemberCount.mockResolvedValue(0);

      await groupService.removeUserFromGroup(1, 10);

      const beginCall = mockQueryRunner.startTransaction.mock.invocationCallOrder[0];
      const removeCall = mockGroupRepository.removeUserFromGroup.mock.invocationCallOrder[0];

      expect(beginCall).toBeLessThan(removeCall);
    });

    it('should always release connection regardless of success or failure', async () => {
      mockGroupRepository.removeUserFromGroup.mockResolvedValue(true);
      mockGroupRepository.getGroupMemberCount.mockResolvedValue(0);

      await groupService.removeUserFromGroup(1, 10);

      expect(mockQueryRunner.release).toHaveBeenCalledTimes(1);
    });

    it('should release connection even when transaction fails', async () => {
      mockGroupRepository.removeUserFromGroup.mockRejectedValue(new Error('Transaction failed'));

      await expect(groupService.removeUserFromGroup(1, 10)).rejects.toThrow();

      expect(mockQueryRunner.release).toHaveBeenCalledTimes(1);
    });
  });
});
