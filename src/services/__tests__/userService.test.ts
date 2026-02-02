import { UserService } from '../userService';
import { IUserRepository } from '../../repositories/userRepository';
import { UserStatusUpdate, UserStatus } from '../../types';
import { QueryRunner } from 'typeorm';

describe('UserService - updateUsersStatuses', () => {
  let userService: UserService;
  let mockUserRepository: jest.Mocked<IUserRepository>;
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
    mockUserRepository = {
      findAll: jest.fn(),
      updateUsersStatuses: jest.fn(),
      getQueryRunner: jest.fn().mockResolvedValue(mockQueryRunner)
    } as jest.Mocked<IUserRepository>;

    // Create service with mocked repository
    userService = new UserService(mockUserRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Success cases', () => {
    it('should update users statuses successfully', async () => {
      const updates: UserStatusUpdate[] = [
        { userId: 1, status: UserStatus.ACTIVE },
        { userId: 2, status: UserStatus.BLOCKED }
      ];

      mockUserRepository.updateUsersStatuses.mockResolvedValue(2);

      const result = await userService.updateUsersStatuses(updates);

      expect(result.updatedCount).toBe(2);
      expect(mockQueryRunner.startTransaction).toHaveBeenCalledTimes(1);
      expect(mockUserRepository.updateUsersStatuses).toHaveBeenCalledWith(updates, mockQueryRunner);
      expect(mockQueryRunner.commitTransaction).toHaveBeenCalledTimes(1);
      expect(mockQueryRunner.release).toHaveBeenCalledTimes(1);
      expect(mockQueryRunner.rollbackTransaction).not.toHaveBeenCalled();
    });

    it('should handle single user update', async () => {
      const updates: UserStatusUpdate[] = [
        { userId: 1, status: UserStatus.PENDING }
      ];

      mockUserRepository.updateUsersStatuses.mockResolvedValue(1);

      const result = await userService.updateUsersStatuses(updates);

      expect(result.updatedCount).toBe(1);
      expect(mockQueryRunner.startTransaction).toHaveBeenCalledTimes(1);
      expect(mockQueryRunner.commitTransaction).toHaveBeenCalledTimes(1);
      expect(mockQueryRunner.release).toHaveBeenCalledTimes(1);
    });

    it('should handle maximum 500 users', async () => {
      const updates: UserStatusUpdate[] = Array.from({ length: 500 }, (_, i) => ({
        userId: i + 1,
        status: UserStatus.ACTIVE
      }));

      mockUserRepository.updateUsersStatuses.mockResolvedValue(500);

      const result = await userService.updateUsersStatuses(updates);

      expect(result.updatedCount).toBe(500);
      expect(mockQueryRunner.startTransaction).toHaveBeenCalledTimes(1);
      expect(mockQueryRunner.commitTransaction).toHaveBeenCalledTimes(1);
      expect(mockQueryRunner.release).toHaveBeenCalledTimes(1);
    });

    it('should handle all valid statuses', async () => {
      const updates: UserStatusUpdate[] = [
        { userId: 1, status: UserStatus.PENDING },
        { userId: 2, status: UserStatus.ACTIVE },
        { userId: 3, status: UserStatus.BLOCKED }
      ];

      mockUserRepository.updateUsersStatuses.mockResolvedValue(3);

      const result = await userService.updateUsersStatuses(updates);

      expect(result.updatedCount).toBe(3);
      expect(mockQueryRunner.commitTransaction).toHaveBeenCalledTimes(1);
    });
  });

  describe('Validation errors', () => {
    it('should throw error when updates array is empty', async () => {
      await expect(userService.updateUsersStatuses([]))
        .rejects
        .toThrow('No updates provided');

      expect(mockQueryRunner.startTransaction).not.toHaveBeenCalled();
      expect(mockQueryRunner.commitTransaction).not.toHaveBeenCalled();
      expect(mockQueryRunner.rollbackTransaction).not.toHaveBeenCalled();
    });

    it('should throw error when updates is null', async () => {
      await expect(userService.updateUsersStatuses(null as any))
        .rejects
        .toThrow('No updates provided');
    });

    it('should throw error when updates is undefined', async () => {
      await expect(userService.updateUsersStatuses(undefined as any))
        .rejects
        .toThrow('No updates provided');
    });

    it('should throw error when exceeding 500 users limit', async () => {
      const updates: UserStatusUpdate[] = Array.from({ length: 501 }, (_, i) => ({
        userId: i + 1,
        status: UserStatus.ACTIVE
      }));

      await expect(userService.updateUsersStatuses(updates))
        .rejects
        .toThrow('Maximum 500 users can be updated at once');

      expect(mockQueryRunner.startTransaction).not.toHaveBeenCalled();
    });

    it('should throw error for invalid status', async () => {
      const updates: UserStatusUpdate[] = [
        { userId: 1, status: 'invalid' as any }
      ];

      await expect(userService.updateUsersStatuses(updates))
        .rejects
        .toThrow('Invalid status: invalid. Must be one of: pending, active, blocked');

      expect(mockQueryRunner.startTransaction).not.toHaveBeenCalled();
    });

    it('should throw error when one of multiple statuses is invalid', async () => {
      const updates: UserStatusUpdate[] = [
        { userId: 1, status: UserStatus.ACTIVE },
        { userId: 2, status: 'invalid' as any },
        { userId: 3, status: UserStatus.BLOCKED }
      ];

      await expect(userService.updateUsersStatuses(updates))
        .rejects
        .toThrow('Invalid status: invalid');
    });
  });

  describe('Transaction rollback', () => {
    it('should rollback transaction on database error', async () => {
      const updates: UserStatusUpdate[] = [
        { userId: 1, status: UserStatus.ACTIVE }
      ];

      const dbError = new Error('Database connection failed');
      mockUserRepository.updateUsersStatuses.mockRejectedValue(dbError);

      await expect(userService.updateUsersStatuses(updates))
        .rejects
        .toThrow('Database connection failed');

      expect(mockQueryRunner.startTransaction).toHaveBeenCalledTimes(1);
      expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalledTimes(1);
      expect(mockQueryRunner.commitTransaction).not.toHaveBeenCalled();
      expect(mockQueryRunner.release).toHaveBeenCalledTimes(1);
    });

    it('should rollback transaction on repository error', async () => {
      const updates: UserStatusUpdate[] = [
        { userId: 1, status: UserStatus.ACTIVE },
        { userId: 2, status: UserStatus.BLOCKED }
      ];

      const repoError = new Error('Update failed');
      mockUserRepository.updateUsersStatuses.mockRejectedValue(repoError);

      await expect(userService.updateUsersStatuses(updates))
        .rejects
        .toThrow('Update failed');

      expect(mockQueryRunner.startTransaction).toHaveBeenCalledTimes(1);
      expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalledTimes(1);
      expect(mockQueryRunner.commitTransaction).not.toHaveBeenCalled();
      expect(mockQueryRunner.release).toHaveBeenCalledTimes(1);
    });

    it('should release connection even when rollback fails', async () => {
      const updates: UserStatusUpdate[] = [
        { userId: 1, status: UserStatus.ACTIVE }
      ];

      // Mock console.error to suppress expected error output
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      mockUserRepository.updateUsersStatuses.mockRejectedValue(new Error('Update failed'));
      mockQueryRunner.rollbackTransaction.mockRejectedValue(new Error('Rollback failed'));

      await expect(userService.updateUsersStatuses(updates))
        .rejects
        .toThrow('Update failed');

      expect(mockQueryRunner.release).toHaveBeenCalledTimes(1);
      expect(consoleErrorSpy).toHaveBeenCalledWith('Rollback failed:', expect.any(Error));
      
      consoleErrorSpy.mockRestore();
    });
  });

  describe('Edge cases', () => {
    it('should handle partial updates (some users not found)', async () => {
      const updates: UserStatusUpdate[] = [
        { userId: 1, status: UserStatus.ACTIVE },
        { userId: 999, status: UserStatus.BLOCKED }, // User doesn't exist
        { userId: 3, status: UserStatus.PENDING }
      ];

      // Only 2 users were actually updated
      mockUserRepository.updateUsersStatuses.mockResolvedValue(2);

      const result = await userService.updateUsersStatuses(updates);

      expect(result.updatedCount).toBe(2);
      expect(mockQueryRunner.commitTransaction).toHaveBeenCalledTimes(1);
    });

    it('should handle updates with duplicate user IDs', async () => {
      const updates: UserStatusUpdate[] = [
        { userId: 1, status: UserStatus.ACTIVE },
        { userId: 1, status: UserStatus.BLOCKED } // Duplicate ID
      ];

      mockUserRepository.updateUsersStatuses.mockResolvedValue(1);

      const result = await userService.updateUsersStatuses(updates);

      expect(result.updatedCount).toBe(1);
      expect(mockQueryRunner.commitTransaction).toHaveBeenCalledTimes(1);
    });
  });
});
