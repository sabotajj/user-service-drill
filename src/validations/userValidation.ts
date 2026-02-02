import { z } from 'zod';

// Validation for pagination query parameters
export const paginationQuerySchema = z.object({
  limit: z.string()
    .optional()
    .default('10')
    .transform(val => parseInt(val, 10))
    .refine(val => !isNaN(val) && val > 0 && val <= 100, {
      message: 'Limit must be a number between 1 and 100'
    }),
  offset: z.string()
    .optional()
    .default('0')
    .transform(val => parseInt(val, 10))
    .refine(val => !isNaN(val) && val >= 0, {
      message: 'Offset must be a non-negative number'
    })
});

// Validation for user status
export const userStatusSchema = z.enum(['pending', 'active', 'blocked'], {
  errorMap: () => ({ message: 'Status must be one of: pending, active, blocked' })
});

// Validation for single user status update
export const userStatusUpdateSchema = z.object({
  userId: z.number()
    .int('User ID must be an integer')
    .positive('User ID must be positive'),
  status: userStatusSchema
});

// Validation for bulk user status updates
export const bulkUserStatusUpdateSchema = z.object({
  updates: z.array(userStatusUpdateSchema)
    .min(1, 'Updates array must contain at least one item')
    .max(500, 'Maximum 500 users can be updated at once')
});

// Type exports
export type PaginationQuery = z.infer<typeof paginationQuerySchema>;
export type UserStatusUpdate = z.infer<typeof userStatusUpdateSchema>;
export type BulkUserStatusUpdate = z.infer<typeof bulkUserStatusUpdateSchema>;
