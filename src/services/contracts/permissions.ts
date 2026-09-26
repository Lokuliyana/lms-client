export type PermissionAction = 
  | "classes.create"
  | "classes.update"
  | "classes.delete"
  | "materials.create"
  | "materials.delete"
  | "cms.edit"
  | "attendance.override";

export interface Role {
  id: string;
  name: string;
  permissions: PermissionAction[];
}

export interface Permission {
  action: PermissionAction;
  description: string;
}

export interface UserRoleAssignment {
  userId: string;
  roleId: string;
  scopeId?: string; // e.g. classId
}

export interface UserPermissionOverride {
  userId: string;
  action: PermissionAction;
  scopeId?: string;
  granted: boolean;
}

export interface IPermissionRepository {
  getUserRoles(userId: string): Promise<UserRoleAssignment[]>;
  getRole(roleId: string): Promise<Role | null>;
  getUserOverrides(userId: string): Promise<UserPermissionOverride[]>;
  getAllRoles(): Promise<Role[]>;
  updateRolePermissions(roleId: string, permissions: PermissionAction[]): Promise<void>;
}
