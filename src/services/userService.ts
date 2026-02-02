import { IUserRepository } from '../repositories/userRepository';
import { User, PaginatedResponse } from '../types';

export interface IUserService {
  getAllUsers(limit: number, offset: number): Promise<PaginatedResponse<User>>;
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
}
