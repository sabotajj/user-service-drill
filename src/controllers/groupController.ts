import { Request, Response } from 'express';
import { IGroupService } from '../services/groupService';

export class GroupController {
  constructor(private groupService: IGroupService) {}

  getAllGroups = async (req: Request, res: Response): Promise<void> => {
    try {
      const { limit = '10', offset = '0' } = req.query;
      
      const result = await this.groupService.getAllGroups(
        parseInt(limit as string),
        parseInt(offset as string)
      );

      res.status(200).json({
        success: true,
        message: 'Get all groups with pagination',
        data: result.data,
        pagination: result.pagination
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error fetching groups',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  removeUserFromGroup = async (req: Request, res: Response): Promise<void> => {
    try {
      const { groupId, userId } = req.params;
      
      const result = await this.groupService.removeUserFromGroup(
        parseInt(userId),
        parseInt(groupId)
      );

      if (!result.success) {
        res.status(404).json({
          success: false,
          message: result.message,
          data: null
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: result.message,
        data: null
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error removing user from group',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };
}
