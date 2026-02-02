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

  updateUsersStatuses = (req: Request, res: Response): void => {
    const { updates } = req.body as UpdateUserStatusRequest;
    
    // Dummy endpoint - returns HTTP 200
    res.status(200).json({
      success: true,
      message: `Updated statuses for ${updates?.length || 0} users`,
      data: {
        updatedCount: updates?.length || 0
      }
    });
  };
}
