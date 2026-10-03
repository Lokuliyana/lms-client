import API from "@/lib/axios";

export type Role = {
  _id: string;
  name: string;
  description?: string;
};

export type Permission = {
  _id: string;
  key: string;
  module: string;
  action: string;
  label: string;
};

export const permissionService = {
  async getRoles(): Promise<Role[]> {
    const res = await API.get<{ success: boolean; data: Role[] }>("/permissions/roles");
    const d = res.data;
    if (Array.isArray(d)) return d;
    return d?.data ?? [];
  },

  async getPermissions(): Promise<Permission[]> {
    const res = await API.get<{ success: boolean; data: Permission[] }>("/permissions");
    const d = res.data;
    if (Array.isArray(d)) return d;
    return d?.data ?? [];
  },

  async getRolePermissions(roleId: string): Promise<string[]> {
    const res = await API.get<{ success: boolean; data: any[] }>(`/permissions/roles/${roleId}`);
    const d = res.data;
    const rawList = Array.isArray(d) ? d : d?.data ?? [];
    return rawList.map((item: any) =>
      typeof item === "string" ? item : (item?._id || item?.permission_id || String(item))
    );
  },

  async addRolePermission(roleId: string, permissionId: string): Promise<void> {
    await API.post(`/permissions/roles/${roleId}/permissions/${permissionId}`);
  },

  async removeRolePermission(roleId: string, permissionId: string): Promise<void> {
    await API.delete(`/permissions/roles/${roleId}/permissions/${permissionId}`);
  },
};
