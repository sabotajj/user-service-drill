import { Request, Response } from 'express';
import { IUserService } from '../services/userService';
import { UpdateUserStatusRequest } from '../types';

export class UserController {
  constructor(private userService: IUserService) {}

  getAllUsers = async (req: Request, res: Response): Promise<void> => {
    try {
      const { limit = '10', offset = '0' } = req.query;
      
      const result = await this.userService.getAllUsers(
        parseInt(limit as string),
        parseInt(offset as string)
      );

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
      const { updates } = req.body as UpdateUserStatusRequest;

      if (!updates || !Array.isArray(updates)) {
        res.status(400).json({
          success: false,
          message: 'Invalid request body. Expected updates array',
          data: null
        });
        return;
      }

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
