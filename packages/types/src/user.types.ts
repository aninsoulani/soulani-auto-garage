export type UserRole = 'SUPER_ADMIN' | 'SALES_STAFF' | 'RENTAL_STAFF';

export interface AuthUser {
  id: number;
  uuid: string;
  name: string;
  email: string;
  role: UserRole;
}
