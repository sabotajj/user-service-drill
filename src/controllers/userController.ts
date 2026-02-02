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

      // Validate request
      const validationError = this.validateUpdateRequest(updates);
      if (validationError) {
        res.status(validationError.status).json({
          success: false,
          message: validationError.message,
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

  private validateUpdateRequest(updates: any): { status: number; message: string } | null {
    // Validate updates array exists and is an array
    if (!updates || !Array.isArray(updates)) {
      return {
        status: 400,
        message: 'Invalid request body. Expected updates array'
      };
    }

    // Validate array is not empty
    if (updates.length === 0) {
      return {
        status: 400,
        message: 'Updates array cannot be empty'
      };
    }

    // Validate maximum 500 users limit
    if (updates.length > 500) {
      return {
        status: 400,
        message: 'Maximum 500 users can be updated at once'
      };
    }

    // Validate each update object
    const validStatuses = ['pending', 'active', 'blocked'];
    for (let i = 0; i < updates.length; i++) {
      const update = updates[i];

      // Check if update has required fields
      if (!update.userId || !update.status) {
        return {
          status: 400,
          message: `Invalid update at index ${i}: userId and status are required`
        };
      }

      // Validate userId is a positive number
      if (typeof update.userId !== 'number' || update.userId <= 0 || !Number.isInteger(update.userId)) {
        return {
          status: 400,
          message: `Invalid update at index ${i}: userId must be a positive integer`
        };
      }

      // Validate status is one of allowed values
      if (!validStatuses.includes(update.status)) {
        return {
          status: 400,
          message: `Invalid update at index ${i}: status must be one of: ${validStatuses.join(', ')}`
        };
      }
    }

    return null; // No validation errors
  }
}
