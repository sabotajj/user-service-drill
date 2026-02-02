export interface User {
  id: number;
  name: string;
  email: string;
}

export interface Group {
  id: number;
  name: string;
  description: string;
}

export interface PaginationQuery {
  limit?: string;
  offset?: string;
}

export type UserStatus = 'pending' | 'active' | 'blocked';

export interface UserStatusUpdate {
  userId: number;
  status: UserStatus;
}

export interface UpdateUserStatusRequest {
  updates: UserStatusUpdate[];
}
