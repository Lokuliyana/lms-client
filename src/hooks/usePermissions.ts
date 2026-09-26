"use client";

import { useState, useEffect, useCallback } from "react";
import { permissionRepo } from "../services/mocks/MockPermissionRepository";
import { PermissionAction, Role } from "../services/contracts/permissions";

// For demo purposes, we'll hardcode the current user as Admin (u1) or Teacher (u2) based on needs.
// Let's use a global store or simple export to swap users if needed.
let currentUser = "u1"; // admin by default

export function setCurrentUser(userId: string) {
  currentUser = userId;
}
export function getCurrentUser() {
  return currentUser;
}

export function usePermissions() {
  const [loading, setLoading] = useState(true);
  const [roles, setRoles] = useState<Role[]>([]);
  const [updateTrigger, setUpdateTrigger] = useState(0);

  useEffect(() => {
    async function loadRoles() {
      const allRoles = await permissionRepo.getAllRoles();
      setRoles(allRoles);
      setLoading(false);
    }
    loadRoles();
  }, [updateTrigger]);

  const hasPermission = useCallback(async (action: PermissionAction, scopeId?: string): Promise<boolean> => {
    const userRoles = await permissionRepo.getUserRoles(currentUser);
    const overrides = await permissionRepo.getUserOverrides(currentUser);

    // check overrides first
    const override = overrides.find(o => o.action === action && (!o.scopeId || o.scopeId === scopeId));
    if (override) {
      return override.granted;
    }

    // check roles
    for (const ur of userRoles) {
      if (ur.scopeId && ur.scopeId !== scopeId) continue;
      
      const role = await permissionRepo.getRole(ur.roleId);
      if (role && role.permissions.includes(action)) {
        return true;
      }
    }
    return false;
  }, []);

  const hasPermissionSync = (action: PermissionAction, scopeId?: string): boolean => {
    // Note: this is a mock sync check since the repo is local in this phase.
    // In a real app this would use a pre-fetched context.
    const allOverrides = (permissionRepo as any).overrides || [];
    const override = allOverrides.find((o: any) => o.userId === currentUser && o.action === action && (!o.scopeId || o.scopeId === scopeId));
    if (override) return override.granted;

    const userRoles = (permissionRepo as any).userRoles.filter((ur: any) => ur.userId === currentUser);
    for (const ur of userRoles) {
      if (ur.scopeId && ur.scopeId !== scopeId) continue;
      const role = (permissionRepo as any).roles.find((r: any) => r.id === ur.roleId);
      if (role && role.permissions.includes(action)) return true;
    }
    return false;
  }

  const updatePermissions = async (roleId: string, actions: PermissionAction[]) => {
    await permissionRepo.updateRolePermissions(roleId, actions);
    setUpdateTrigger(prev => prev + 1);
  };

  return {
    loading,
    roles,
    hasPermission,
    hasPermissionSync, // convenient for synchronous rendering
    updatePermissions
  };
}
