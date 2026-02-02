/**
 * Application-wide constants
 */

// Pagination limits
export const PAGINATION = {
  MIN_LIMIT: 1,
  MAX_LIMIT: 100,
  DEFAULT_LIMIT: 10,
  MIN_OFFSET: 0,
  DEFAULT_OFFSET: 0,
} as const;

// Batch operation limits
export const BATCH_OPERATIONS = {
  MAX_BULK_STATUS_UPDATES: 500,
  MIN_BULK_STATUS_UPDATES: 1,
} as const;

// Database constants
export const DATABASE = {
  DEFAULT_PORT: 3306,
} as const;
