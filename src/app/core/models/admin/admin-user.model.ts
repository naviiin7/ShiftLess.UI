export interface AdminUserModel {

  userId: number;

  fullName: string;

  email: string;

  phone: string;

  role: string;

  isActive: boolean;

  /** True when the user has tasks, applications or messages (can be blocked but not deleted). */
  hasActivity: boolean;

}