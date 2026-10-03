'use client';

import React, { useEffect, useState } from 'react';
import { permissionService, type Permission } from '@/services/permissionService';

export default function PermissionMatrix({ roleId }: { roleId: string }) {
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [rolePermissions, setRolePermissions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = React.useCallback(async () => {
    setLoading(true);
    try {
      const [perms, rolePerms] = await Promise.all([
        permissionService.getPermissions(),
        permissionService.getRolePermissions(roleId),
      ]);
      setPermissions(perms);
      setRolePermissions(rolePerms);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  }, [roleId]);

  useEffect(() => {
    if (roleId) {
      fetchData();
    }
  }, [roleId, fetchData]);

  const handleToggle = async (permissionId: string, hasPermission: boolean) => {
    // Optimistic UI update
    setRolePermissions(prev => 
      hasPermission ? prev.filter(id => id !== permissionId) : [...prev, permissionId]
    );

    try {
      if (hasPermission) {
        await permissionService.removeRolePermission(roleId, permissionId);
      } else {
        await permissionService.addRolePermission(roleId, permissionId);
      }
    } catch (err) {
      console.error(err);
      alert('Error updating permission');
      fetchData();
    }
  };

  const actions = React.useMemo(() => {
    const preferredOrder = ['create', 'read', 'update', 'delete', 'manage'];
    const actionsSet = new Set(permissions.map(p => p.action).filter(Boolean));
    const sortedPreferred = preferredOrder.filter(a => actionsSet.has(a));
    const otherActions = Array.from(actionsSet).filter(a => !preferredOrder.includes(a)).sort();
    return [...sortedPreferred, ...otherActions];
  }, [permissions]);

  const modules = React.useMemo(() => {
    return Array.from(new Set(permissions.map(p => p.module).filter(Boolean))).sort();
  }, [permissions]);

  if (loading) {
    return (
      <div className="space-y-4 py-4 w-full">
        <div className="h-10 w-full bg-slate-100 rounded-lg animate-pulse" />
        <div className="h-12 w-full bg-slate-100 rounded-lg animate-pulse" />
        <div className="h-12 w-full bg-slate-100 rounded-lg animate-pulse" />
        <div className="h-12 w-full bg-slate-100 rounded-lg animate-pulse" />
      </div>
    );
  }
  if (!permissions.length) return <div>No permissions found.</div>;

  return (
    <div className="overflow-x-auto w-full">
      <table className="min-w-full bg-white border border-gray-200 text-sm">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-200">
            <th className="text-left py-3 px-4 font-semibold text-gray-700">Module</th>
            {actions.map(action => (
              <th key={action} className="text-center py-3 px-4 font-semibold text-gray-700 capitalize">
                {action}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {modules.map(mod => {
            const modPerms = permissions.filter(p => p.module === mod);
            return (
              <tr key={mod} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="py-3 px-4 font-medium text-gray-800 capitalize">
                  {mod}
                </td>
                {actions.map(action => {
                  const perm = modPerms.find(p => p.action === action);
                  if (!perm) return <td key={action} className="text-center py-3 px-4 text-gray-300">-</td>;
                  
                  const hasPermission = rolePermissions.includes(perm._id);
                  return (
                    <td key={action} className="text-center py-3 px-4">
                      <input 
                        type="checkbox" 
                        className="w-4 h-4 text-blue-600 cursor-pointer"
                        title={perm.label || `${perm.module}.${perm.action}`}
                        checked={hasPermission}
                        onChange={() => handleToggle(perm._id, hasPermission)}
                      />
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
