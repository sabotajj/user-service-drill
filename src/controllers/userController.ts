import { Request, Response } from 'express';
import { IUserService } from '../services/userService';
import { UpdateUserStatusRequest } from '../types';

export class UserController {
  constructor(private userService: IUserService) {}

  getAllUsers = async (req: Request, res: Response): Promise<void> => {
    try {
      // Validation is handled by middleware, data is already validated and transformed
      const { limit, offset } = req.query as unknown as { limit: number; offset: number };
      
      const result = await this.userService.getAllUsers(limit, offset);

      res.status(200).json({
        success: true,
        message: 'Get all users with pagination',
        data: result.data,
        pagination: result.pagination
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error fetching users',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  updateUsersStatuses = async (req: Request, res: Response): Promise<void> => {
    try {
      // Validation is handled by middleware, data is already validated
      const { updates } = req.body;

      const result = await this.userService.updateUsersStatuses(updates);
      
      res.status(200).json({
        success: true,
        message: `Updated statuses for ${result.updatedCount} users`,
        data: {
          updatedCount: result.updatedCount
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error updating user statuses',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };
}
