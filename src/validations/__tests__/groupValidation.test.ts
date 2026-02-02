import {
  removeUserFromGroupParamsSchema,
  groupIdParamSchema,
  userIdParamSchema
} from '../groupValidation';

describe('Group Validation Schemas', () => {
  describe('groupIdParamSchema', () => {
    it('should validate and transform valid group ID', () => {
      const result = groupIdParamSchema.parse({ groupId: '10' });
      expect(result.groupId).toBe(10);
    });

    it('should reject negative group ID', () => {
      expect(() => groupIdParamSchema.parse({ groupId: '-1' })).toThrow();
    });

    it('should reject zero as group ID', () => {
      expect(() => groupIdParamSchema.parse({ groupId: '0' })).toThrow();
    });

    it('should reject non-numeric group ID', () => {
      expect(() => groupIdParamSchema.parse({ groupId: 'abc' })).toThrow();
    });

    it('should reject decimal group ID', () => {
      expect(() => groupIdParamSchema.parse({ groupId: '10.5' })).toThrow();
    });
  });

  describe('userIdParamSchema', () => {
    it('should validate and transform valid user ID', () => {
      const result = userIdParamSchema.parse({ userId: '5' });
      expect(result.userId).toBe(5);
    });

    it('should reject negative user ID', () => {
      expect(() => userIdParamSchema.parse({ userId: '-1' })).toThrow();
    });

    it('should reject zero as user ID', () => {
      expect(() => userIdParamSchema.parse({ userId: '0' })).toThrow();
    });

    it('should reject non-numeric user ID', () => {
      expect(() => userIdParamSchema.parse({ userId: 'xyz' })).toThrow();
    });
  });

  describe('removeUserFromGroupParamsSchema', () => {
    it('should validate and transform valid params', () => {
      const result = removeUserFromGroupParamsSchema.parse({ groupId: '10', userId: '5' });
      expect(result.groupId).toBe(10);
      expect(result.userId).toBe(5);
    });

    it('should reject invalid group ID', () => {
      expect(() => removeUserFromGroupParamsSchema.parse({ groupId: '0', userId: '5' })).toThrow();
      expect(() => removeUserFromGroupParamsSchema.parse({ groupId: '-1', userId: '5' })).toThrow();
      expect(() => removeUserFromGroupParamsSchema.parse({ groupId: 'abc', userId: '5' })).toThrow();
    });

    it('should reject invalid user ID', () => {
      expect(() => removeUserFromGroupParamsSchema.parse({ groupId: '10', userId: '0' })).toThrow();
      expect(() => removeUserFromGroupParamsSchema.parse({ groupId: '10', userId: '-1' })).toThrow();
      expect(() => removeUserFromGroupParamsSchema.parse({ groupId: '10', userId: 'xyz' })).toThrow();
    });

    it('should reject missing fields', () => {
      expect(() => removeUserFromGroupParamsSchema.parse({ groupId: '10' })).toThrow();
      expect(() => removeUserFromGroupParamsSchema.parse({ userId: '5' })).toThrow();
      expect(() => removeUserFromGroupParamsSchema.parse({})).toThrow();
    });

    it('should accept large valid IDs', () => {
      const result = removeUserFromGroupParamsSchema.parse({ groupId: '999999', userId: '888888' });
      expect(result.groupId).toBe(999999);
      expect(result.userId).toBe(888888);
    });
  });
});
