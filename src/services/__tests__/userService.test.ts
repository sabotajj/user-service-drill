import { UserService } from '../userService';
import { IUserRepository } from '../../repositories/userRepository';
import { UserStatusUpdate } from '../../types';
import { PoolConnection } from 'mysql2/promise';

describe('UserService - updateUsersStatuses', () => {
  let userService: UserService;
  let mockUserRepository: jest.Mocked<IUserRepository>;
  let mockConnection: jest.Mocked<PoolConnection>;

  beforeEach(() => {
    // Mock connection
    mockConnection = {
      beginTransaction: jest.fn(),
      commit: jest.fn(),
      rollback: jest.fn(),
      release: jest.fn()
    } as any;

    // Mock repository
    mockUserRepository = {
      findAll: jest.fn(),
      updateUsersStatuses: jest.fn(),
      getConnection: jest.fn().mockResolvedValue(mockConnection)
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
        { userId: 1, status: 'active' },
        { userId: 2, status: 'blocked' }
      ];

      mockUserRepository.updateUsersStatuses.mockResolvedValue(2);

      const result = await userService.updateUsersStatuses(updates);

      expect(result.updatedCount).toBe(2);
      expect(mockConnection.beginTransaction).toHaveBeenCalledTimes(1);
      expect(mockUserRepository.updateUsersStatuses).toHaveBeenCalledWith(updates, mockConnection);
      expect(mockConnection.commit).toHaveBeenCalledTimes(1);
      expect(mockConnection.release).toHaveBeenCalledTimes(1);
      expect(mockConnection.rollback).not.toHaveBeenCalled();
    });

    it('should handle single user update', async () => {
      const updates: UserStatusUpdate[] = [
        { userId: 1, status: 'pending' }
      ];

      mockUserRepository.updateUsersStatuses.mockResolvedValue(1);

      const result = await userService.updateUsersStatuses(updates);

      expect(result.updatedCount).toBe(1);
      expect(mockConnection.beginTransaction).toHaveBeenCalledTimes(1);
      expect(mockConnection.commit).toHaveBeenCalledTimes(1);
      expect(mockConnection.release).toHaveBeenCalledTimes(1);
    });

    it('should handle maximum 500 users', async () => {
      const updates: UserStatusUpdate[] = Array.from({ length: 500 }, (_, i) => ({
        userId: i + 1,
        status: 'active' as const
      }));

      mockUserRepository.updateUsersStatuses.mockResolvedValue(500);

      const result = await userService.updateUsersStatuses(updates);

      expect(result.updatedCount).toBe(500);
      expect(mockConnection.beginTransaction).toHaveBeenCalledTimes(1);
      expect(mockConnection.commit).toHaveBeenCalledTimes(1);
      expect(mockConnection.release).toHaveBeenCalledTimes(1);
    });

    it('should handle all valid statuses', async () => {
      const updates: UserStatusUpdate[] = [
        { userId: 1, status: 'pending' },
        { userId: 2, status: 'active' },
        { userId: 3, status: 'blocked' }
      ];

      mockUserRepository.updateUsersStatuses.mockResolvedValue(3);

      const result = await userService.updateUsersStatuses(updates);

      expect(result.updatedCount).toBe(3);
      expect(mockConnection.commit).toHaveBeenCalledTimes(1);
    });
  });

  describe('Validation errors', () => {
    it('should throw error when updates array is empty', async () => {
      await expect(userService.updateUsersStatuses([]))
        .rejects
        .toThrow('No updates provided');

      expect(mockConnection.beginTransaction).not.toHaveBeenCalled();
      expect(mockConnection.commit).not.toHaveBeenCalled();
      expect(mockConnection.rollback).not.toHaveBeenCalled();
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
        status: 'active' as const
      }));

      await expect(userService.updateUsersStatuses(updates))
        .rejects
        .toThrow('Maximum 500 users can be updated at once');

      expect(mockConnection.beginTransaction).not.toHaveBeenCalled();
    });

    it('should throw error for invalid status', async () => {
      const updates: UserStatusUpdate[] = [
        { userId: 1, status: 'invalid' as any }
      ];

      await expect(userService.updateUsersStatuses(updates))
        .rejects
        .toThrow('Invalid status: invalid. Must be one of: pending, active, blocked');

      expect(mockConnection.beginTransaction).not.toHaveBeenCalled();
    });

    it('should throw error when one of multiple statuses is invalid', async () => {
      const updates: UserStatusUpdate[] = [
        { userId: 1, status: 'active' },
        { userId: 2, status: 'invalid' as any },
        { userId: 3, status: 'blocked' }
      ];

      await expect(userService.updateUsersStatuses(updates))
        .rejects
        .toThrow('Invalid status: invalid');
    });
  });

  describe('Transaction rollback', () => {
    it('should rollback transaction on database error', async () => {
      const updates: UserStatusUpdate[] = [
        { userId: 1, status: 'active' }
      ];

      const dbError = new Error('Database connection failed');
      mockUserRepository.updateUsersStatuses.mockRejectedValue(dbError);

      await expect(userService.updateUsersStatuses(updates))
        .rejects
        .toThrow('Database connection failed');

      expect(mockConnection.beginTransaction).toHaveBeenCalledTimes(1);
      expect(mockConnection.rollback).toHaveBeenCalledTimes(1);
      expect(mockConnection.commit).not.toHaveBeenCalled();
      expect(mockConnection.release).toHaveBeenCalledTimes(1);
    });

    it('should rollback transaction on repository error', async () => {
      const updates: UserStatusUpdate[] = [
        { userId: 1, status: 'active' },
        { userId: 2, status: 'blocked' }
      ];

      const repoError = new Error('Update failed');
      mockUserRepository.updateUsersStatuses.mockRejectedValue(repoError);

      await expect(userService.updateUsersStatuses(updates))
        .rejects
        .toThrow('Update failed');

      expect(mockConnection.beginTransaction).toHaveBeenCalledTimes(1);
      expect(mockConnection.rollback).toHaveBeenCalledTimes(1);
      expect(mockConnection.commit).not.toHaveBeenCalled();
      expect(mockConnection.release).toHaveBeenCalledTimes(1);
    });

    it('should release connection even when rollback fails', async () => {
      const updates: UserStatusUpdate[] = [
        { userId: 1, status: 'active' }
      ];

      mockUserRepository.updateUsersStatuses.mockRejectedValue(new Error('Update failed'));
      mockConnection.rollback.mockRejectedValue(new Error('Rollback failed'));

      await expect(userService.updateUsersStatuses(updates))
        .rejects
        .toThrow('Update failed');

      expect(mockConnection.release).toHaveBeenCalledTimes(1);
    });
  });

  describe('Edge cases', () => {
    it('should handle partial updates (some users not found)', async () => {
      const updates: UserStatusUpdate[] = [
        { userId: 1, status: 'active' },
        { userId: 999, status: 'blocked' }, // User doesn't exist
        { userId: 3, status: 'pending' }
      ];

      // Only 2 users were actually updated
      mockUserRepository.updateUsersStatuses.mockResolvedValue(2);

      const result = await userService.updateUsersStatuses(updates);

      expect(result.updatedCount).toBe(2);
      expect(mockConnection.commit).toHaveBeenCalledTimes(1);
    });

    it('should handle updates with duplicate user IDs', async () => {
      const updates: UserStatusUpdate[] = [
        { userId: 1, status: 'active' },
        { userId: 1, status: 'blocked' } // Duplicate ID
      ];

      mockUserRepository.updateUsersStatuses.mockResolvedValue(1);

      const result = await userService.updateUsersStatuses(updates);

      expect(result.updatedCount).toBe(1);
      expect(mockConnection.commit).toHaveBeenCalledTimes(1);
    });
  });
});
