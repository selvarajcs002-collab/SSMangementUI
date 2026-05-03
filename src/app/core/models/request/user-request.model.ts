export interface UserRequest {
  mode: 'INSERT' | 'UPDATE';
  userId?: number;
  email: string;
  password: string;
}
