import { z } from 'zod';

// Validation for group ID parameter
export const groupIdParamSchema = z.object({
  groupId: z.string()
    .refine(val => /^\d+$/.test(val), {
      message: 'Group ID must be a positive integer'
    })
    .transform(val => parseInt(val, 10))
    .refine(val => val > 0, {
      message: 'Group ID must be a positive integer'
    })
});

// Validation for user ID parameter
export const userIdParamSchema = z.object({
  userId: z.string()
    .refine(val => /^\d+$/.test(val), {
      message: 'User ID must be a positive integer'
    })
    .transform(val => parseInt(val, 10))
    .refine(val => val > 0, {
      message: 'User ID must be a positive integer'
    })
});

// Validation for remove user from group parameters
export const removeUserFromGroupParamsSchema = z.object({
  groupId: z.string()
    .refine(val => /^\d+$/.test(val), {
      message: 'Group ID must be a positive integer'
    })
    .transform(val => parseInt(val, 10))
    .refine(val => val > 0, {
      message: 'Group ID must be a positive integer'
    }),
  userId: z.string()
    .refine(val => /^\d+$/.test(val), {
      message: 'User ID must be a positive integer'
    })
    .transform(val => parseInt(val, 10))
    .refine(val => val > 0, {
      message: 'User ID must be a positive integer'
    })
});

// Type exports
export type GroupIdParam = z.infer<typeof groupIdParamSchema>;
export type UserIdParam = z.infer<typeof userIdParamSchema>;
export type RemoveUserFromGroupParams = z.infer<typeof removeUserFromGroupParamsSchema>;
