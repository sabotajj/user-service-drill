import { UserStatus } from '../entities/User';

export interface User {
  id: number;
  name: string;
  email: string;
  createdAt: Date;
}

export interface Group {
  id: number;
  name: string;
  description: string;
  status: string;
  createdAt: Date;
}

export interface PaginationQuery {
  limit?: string;
  offset?: string;
}

// Re-export UserStatus enum for convenience
export { UserStatus };

export interface UserStatusUpdate {
  userId: number;
  status: UserStatus;
}

export interface UpdateUserStatusRequest {
  updates: UserStatusUpdate[];
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    limit: number;
    offset: number;
    total: number;
  };
}

export interface DatabaseConfig {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
}
