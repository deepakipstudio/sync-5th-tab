export type Role = 'admin' | 'customer';

export interface SessionPayload {
  id: string; // session id
  userId: string;
  tenantId: string;
  role: Role;
}
