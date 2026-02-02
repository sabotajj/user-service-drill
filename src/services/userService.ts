import { IUserRepository } from '../repositories/userRepository';
import { User, PaginatedResponse, UserStatusUpdate } from '../types';

export interface IUserService {
  getAllUsers(limit: number, offset: number): Promise<PaginatedResponse<User>>;
  updateUsersStatuses(updates: UserStatusUpdate[]): Promise<{ updatedCount: number }>;
}

export class UserService implements IUserService {
  constructor(private userRepository: IUserRepository) {}

  async getAllUsers(limit: number, offset: number): Promise<PaginatedResponse<User>> {
    // Validate input
    const validLimit = Math.min(Math.max(limit, 1), 100); // Max 100 items per page
    const validOffset = Math.max(offset, 0);

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
    // Validate input
    if (!updates || updates.length === 0) {
      throw new Error('No updates provided');
    }

    if (updates.length > 500) {
      throw new Error('Maximum 500 users can be updated at once');
    }

    // Validate statuses
    const validStatuses = ['pending', 'active', 'blocked'];
    for (const update of updates) {
      if (!validStatuses.includes(update.status)) {
        throw new Error(`Invalid status: ${update.status}. Must be one of: ${validStatuses.join(', ')}`);
      }
    }

    const connection = await this.userRepository.getConnection();

    try {
      // Start transaction
      await connection.beginTransaction();

      // Update users statuses
      const updatedCount = await this.userRepository.updateUsersStatuses(updates, connection);

      // Commit transaction
      await connection.commit();

      return { updatedCount };
    } catch (error) {
      // Rollback on error
      try {
        await connection.rollback();
      } catch (rollbackError) {
        // Log rollback error but don't throw - we want to release the connection
        console.error('Rollback failed:', rollbackError);
      }
      throw error;
    } finally {
      connection.release();
    }
  }
}
