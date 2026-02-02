import { Request, Response } from 'express';

export const getAllUsers = (req: Request, res: Response): void => {
  const { page = '1', limit = '10' } = req.query;
  
  // Dummy endpoint - returns HTTP 200
  res.status(200).json({
    success: true,
    message: 'Get all users with pagination',
    data: {
      users: [],
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total: 0,
        totalPages: 0
      }
    }
  });
};
