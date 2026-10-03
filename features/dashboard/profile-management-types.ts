export const MANAGED_PROFILE_ROLE_IDS = {
  user: 2,
  admin: 3,
} as const;

export const PROFILES_PER_PAGE = 20;

export type ManagedProfileRoleId =
  (typeof MANAGED_PROFILE_ROLE_IDS)[keyof typeof MANAGED_PROFILE_ROLE_IDS];

export type ManagedProfile = {
  id: number;
  roleId: ManagedProfileRoleId;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  isActive: boolean;
  createdAt: string | null;
  lastSignInAt: string | null;
};

export type ManagedProfilePage = {
  profiles: ManagedProfile[];
  page: number;
  totalPages: number;
  totalProfiles: number;
};

export type InitialManagedProfiles = {
  users: ManagedProfilePage;
  admins: ManagedProfilePage;
};
