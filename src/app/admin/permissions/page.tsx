'use client';

import React, { useEffect, useState } from 'react';
import PermissionMatrix from '@/components/PermissionMatrix';
import { permissionService, type Role } from '@/services/permissionService';
import { SectionHeader } from '@/components/reusable/section-header';
import { CLAY_ASSETS } from '@/constants/clayAssets';
import { ShieldCheck } from 'lucide-react';

export default function PermissionMatrixPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRoles();
  }, []);

  const fetchRoles = async () => {
    try {
      const data = await permissionService.getRoles();
      setRoles(data);
      if (data.length > 0) {
        setSelectedRole(data[0]._id);
      }
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="p-4 sm:p-8 max-w-6xl mx-auto space-y-6">
        <div className="h-28 w-full bg-slate-100 rounded-3xl animate-pulse" />
        <div className="h-16 w-full bg-slate-100 rounded-2xl animate-pulse" />
        <div className="h-80 w-full bg-slate-100 rounded-2xl animate-pulse" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-8 max-w-6xl mx-auto space-y-6">
      <SectionHeader
        title="Permission Matrix"
        breadcrumbs={[
          { label: "Home", href: "/admin/dashboard" },
          { label: "Administration" },
          { label: "Permissions" },
        ]}
        description="Configure role-based access control, security privileges, and granular matrix permissions across administrative staff."
        illustration={CLAY_ASSETS.authLockShield}
        variant="indigo"
        icon={ShieldCheck}
      />
      
      <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-xs flex flex-wrap items-center gap-4">
        <label htmlFor="roleSelect" className="text-xs sm:text-sm font-semibold text-slate-700">Select Role:</label>
        <select 
          id="roleSelect"
          className="border border-slate-300 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300 transition-all font-medium"
          value={selectedRole}
          onChange={(e) => setSelectedRole(e.target.value)}
        >
          {roles.map(r => (
            <option key={r._id} value={r._id}>{r.name}</option>
          ))}
        </select>
      </div>

      {selectedRole ? (
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-5 sm:p-6">
          <h2 className="text-base font-bold mb-4 text-slate-800">
            Permissions for {roles.find(r => r._id === selectedRole)?.name}
          </h2>
          <PermissionMatrix roleId={selectedRole} />
        </div>
      ) : (
        <div className="text-slate-500 text-sm">No roles available.</div>
      )}
    </div>
  );
}
