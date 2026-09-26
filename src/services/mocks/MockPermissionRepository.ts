import { 
  IPermissionRepository, 
  Role, 
  UserRoleAssignment, 
  UserPermissionOverride,
  PermissionAction
} from "../contracts/permissions";

const defaultRoles: Role[] = [
  {
    id: "admin",
    name: "Administrator",
    permissions: ["classes.create", "classes.update", "classes.delete", "materials.create", "materials.delete", "cms.edit", "attendance.override"]
  },
  {
    id: "teacher",
    name: "Teacher",
    permissions: ["classes.update", "materials.create", "materials.delete"]
  },
  {
    id: "moderator",
    name: "Moderator",
    permissions: ["classes.update", "attendance.override"]
  },
  {
    id: "student",
    name: "Student",
    permissions: []
  }
];

export class MockPermissionRepository implements IPermissionRepository {
  private roles = [...defaultRoles];
  private userRoles: UserRoleAssignment[] = [
    { userId: "u1", roleId: "admin" },
    { userId: "u2", roleId: "teacher" },
    { userId: "u3", roleId: "student" },
  ];
  private overrides: UserPermissionOverride[] = [
    { userId: "u2", action: "materials.delete", scopeId: "class-101", granted: true },
    { userId: "u2", action: "materials.delete", scopeId: "class-202", granted: false }
  ];

  async getUserRoles(userId: string): Promise<UserRoleAssignment[]> {
    return this.userRoles.filter(ur => ur.userId === userId);
  }

  async getRole(roleId: string): Promise<Role | null> {
    return this.roles.find(r => r.id === roleId) || null;
  }

  async getUserOverrides(userId: string): Promise<UserPermissionOverride[]> {
    return this.overrides.filter(o => o.userId === userId);
  }

  async getAllRoles(): Promise<Role[]> {
    return this.roles;
  }

  async updateRolePermissions(roleId: string, permissions: PermissionAction[]): Promise<void> {
    const role = this.roles.find(r => r.id === roleId);
    if (role) {
      role.permissions = permissions;
    }
  }
}

export const permissionRepo = new MockPermissionRepository();
