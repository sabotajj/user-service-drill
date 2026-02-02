import { z } from 'zod';
import {
  paginationQuerySchema,
  userStatusSchema,
  userStatusUpdateSchema,
  bulkUserStatusUpdateSchema
} from '../userValidation';

describe('User Validation Schemas', () => {
  describe('paginationQuerySchema', () => {
    it('should validate and transform valid pagination query', () => {
      const result = paginationQuerySchema.parse({ limit: '20', offset: '10' });
      expect(result.limit).toBe(20);
      expect(result.offset).toBe(10);
    });

    it('should use default values when not provided', () => {
      const result = paginationQuerySchema.parse({});
      expect(result.limit).toBe(10);
      expect(result.offset).toBe(0);
    });

    it('should reject limit greater than 100', () => {
      expect(() => paginationQuerySchema.parse({ limit: '101' })).toThrow();
    });

    it('should reject limit less than 1', () => {
      expect(() => paginationQuerySchema.parse({ limit: '0' })).toThrow();
      expect(() => paginationQuerySchema.parse({ limit: '-1' })).toThrow();
    });

    it('should reject negative offset', () => {
      expect(() => paginationQuerySchema.parse({ offset: '-1' })).toThrow();
    });

    it('should reject invalid number format', () => {
      expect(() => paginationQuerySchema.parse({ limit: 'abc' })).toThrow();
      expect(() => paginationQuerySchema.parse({ offset: 'xyz' })).toThrow();
    });

    it('should accept valid edge cases', () => {
      const result1 = paginationQuerySchema.parse({ limit: '1', offset: '0' });
      expect(result1.limit).toBe(1);
      expect(result1.offset).toBe(0);

      const result2 = paginationQuerySchema.parse({ limit: '100', offset: '1000' });
      expect(result2.limit).toBe(100);
      expect(result2.offset).toBe(1000);
    });
  });

  describe('userStatusSchema', () => {
    it('should accept valid statuses', () => {
      expect(userStatusSchema.parse('pending')).toBe('pending');
      expect(userStatusSchema.parse('active')).toBe('active');
      expect(userStatusSchema.parse('blocked')).toBe('blocked');
    });

    it('should reject invalid statuses', () => {
      expect(() => userStatusSchema.parse('invalid')).toThrow();
      expect(() => userStatusSchema.parse('ACTIVE')).toThrow();
      expect(() => userStatusSchema.parse('')).toThrow();
    });
  });

  describe('userStatusUpdateSchema', () => {
    it('should validate correct user status update', () => {
      const result = userStatusUpdateSchema.parse({ userId: 1, status: 'active' });
      expect(result.userId).toBe(1);
      expect(result.status).toBe('active');
    });

    it('should reject non-integer userId', () => {
      expect(() => userStatusUpdateSchema.parse({ userId: 1.5, status: 'active' })).toThrow();
    });

    it('should reject negative or zero userId', () => {
      expect(() => userStatusUpdateSchema.parse({ userId: 0, status: 'active' })).toThrow();
      expect(() => userStatusUpdateSchema.parse({ userId: -1, status: 'active' })).toThrow();
    });

    it('should reject invalid status', () => {
      expect(() => userStatusUpdateSchema.parse({ userId: 1, status: 'invalid' })).toThrow();
    });

    it('should reject missing fields', () => {
      expect(() => userStatusUpdateSchema.parse({ userId: 1 })).toThrow();
      expect(() => userStatusUpdateSchema.parse({ status: 'active' })).toThrow();
      expect(() => userStatusUpdateSchema.parse({})).toThrow();
    });
  });

  describe('bulkUserStatusUpdateSchema', () => {
    it('should validate correct bulk updates', () => {
      const input = {
        updates: [
          { userId: 1, status: 'active' },
          { userId: 2, status: 'blocked' }
        ]
      };
      const result = bulkUserStatusUpdateSchema.parse(input);
      expect(result.updates).toHaveLength(2);
    });

    it('should reject empty updates array', () => {
      expect(() => bulkUserStatusUpdateSchema.parse({ updates: [] })).toThrow('at least one');
    });

    it('should reject updates array exceeding 500 items', () => {
      const updates = Array.from({ length: 501 }, (_, i) => ({
        userId: i + 1,
        status: 'active' as const
      }));
      expect(() => bulkUserStatusUpdateSchema.parse({ updates })).toThrow('Maximum 500');
    });

    it('should accept exactly 500 updates', () => {
      const updates = Array.from({ length: 500 }, (_, i) => ({
        userId: i + 1,
        status: 'active' as const
      }));
      const result = bulkUserStatusUpdateSchema.parse({ updates });
      expect(result.updates).toHaveLength(500);
    });

    it('should reject if any update item is invalid', () => {
      const input = {
        updates: [
          { userId: 1, status: 'active' },
          { userId: -1, status: 'blocked' } // Invalid userId
        ]
      };
      expect(() => bulkUserStatusUpdateSchema.parse(input)).toThrow();
    });

    it('should reject missing updates field', () => {
      expect(() => bulkUserStatusUpdateSchema.parse({})).toThrow();
    });
  });
});
