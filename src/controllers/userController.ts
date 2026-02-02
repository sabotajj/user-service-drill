import { Request, Response } from 'express';

export const getAllUsers = (req: Request, res: Response): void => {
  const { limit = '10', offset = '0' } = req.query;
  
  // Dummy endpoint - returns HTTP 200
  res.status(200).json({
    success: true,
    message: 'Get all users with pagination',
    data: {
      users: [],
      pagination: {
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
        total: 0
      }
    }
  });
};
