export interface UserProfile {
  id: number;
  username: string;
  email: string;
  fullName: string;
  role: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface UserListResponse {
  items: UserProfile[];
  total: number;
}
