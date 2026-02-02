import { IUserRepository } from '../repositories/userRepository';
import { User, PaginatedResponse, UserStatusUpdate } from '../types';
import { PAGINATION, BATCH_OPERATIONS } from '../constants';

export interface IUserService {
  getAllUsers(limit: number, offset: number): Promise<PaginatedResponse<User>>;
  updateUsersStatuses(updates: UserStatusUpdate[]): Promise<{ updatedCount: number }>;
}

export class UserService implements IUserService {
  constructor(private userRepository: IUserRepository) {}

  async getAllUsers(limit: number, offset: number): Promise<PaginatedResponse<User>> {
    const validLimit = Math.min(Math.max(limit, PAGINATION.MIN_LIMIT), PAGINATION.MAX_LIMIT);
    const validOffset = Math.max(offset, PAGINATION.MIN_OFFSET);

    const { users, total } = await this.userRepository.findAll(validLimit, validOffset);

    return {
      data: users,
      pagination: {
        limit: validLimit,
        offset: validOffset,
        total
      }
    };
  }

  async updateUsersStatuses(updates: UserStatusUpdate[]): Promise<{ updatedCount: number }> {
    if (!updates || updates.length === 0) {
      throw new Error('No updates provided');
    }

    if (updates.length > BATCH_OPERATIONS.MAX_BULK_STATUS_UPDATES) {
      throw new Error(`Maximum ${BATCH_OPERATIONS.MAX_BULK_STATUS_UPDATES} users can be updated at once`);
    }

    const queryRunner = await this.userRepository.getQueryRunner();
    await queryRunner.connect();

    try {
      // Start transaction
      await queryRunner.startTransaction();

      // Update users statuses
      const updatedCount = await this.userRepository.updateUsersStatuses(updates, queryRunner);

      // Commit transaction
      await queryRunner.commitTransaction();

      return { updatedCount };
    } catch (error) {
      // Rollback on error
      try {
        await queryRunner.rollbackTransaction();
      } catch (rollbackError) {
        // Log rollback error but don't throw - we want to release the connection
        console.error('Rollback failed:', rollbackError);
      }
      throw error;
    } finally {
      await queryRunner.release();
    }
  }
}
