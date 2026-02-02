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
  page?: string;
  limit?: string;
}
