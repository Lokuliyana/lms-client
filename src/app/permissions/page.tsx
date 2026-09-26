"use client";

import React, { useState } from "react";
import { PermissionMatrix } from "@/components/permissions/PermissionMatrix";
import { PermissionGuard } from "@/components/permissions/PermissionGuard";
import { setCurrentUser, getCurrentUser } from "@/hooks/usePermissions";

export default function PermissionsPage() {
  const [user, setUser] = useState(getCurrentUser());

  const handleUserChange = (u: string) => {
    setCurrentUser(u);
    setUser(u);
    // Refresh page simply to apply new permissions everywhere, or rely on state.
    window.location.reload();
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-semibold text-slate-800 tracking-tight mb-4">Security Guards & Permissions</h2>
        <div className="flex gap-4 mb-6">
          <button onClick={() => handleUserChange("u1")} className={`px-4 py-2 text-sm font-medium rounded-xl border ${user === "u1" ? "bg-blue-50 border-blue-200 text-blue-700" : "bg-white border-slate-200 text-slate-600"}`}>
            Login as Admin (u1)
          </button>
          <button onClick={() => handleUserChange("u2")} className={`px-4 py-2 text-sm font-medium rounded-xl border ${user === "u2" ? "bg-blue-50 border-blue-200 text-blue-700" : "bg-white border-slate-200 text-slate-600"}`}>
            Login as Teacher (u2)
          </button>
          <button onClick={() => handleUserChange("u3")} className={`px-4 py-2 text-sm font-medium rounded-xl border ${user === "u3" ? "bg-blue-50 border-blue-200 text-blue-700" : "bg-white border-slate-200 text-slate-600"}`}>
            Login as Student (u3)
          </button>
        </div>
        
        <PermissionGuard 
          action="classes.create" 
          fallback={
            <div className="bg-rose-50/50 border border-rose-100 rounded-2xl p-4 text-sm text-rose-700 mb-6">
              You do not have 'classes.create' permission.
            </div>
          }
        >
          <div className="bg-emerald-50/50 border border-emerald-100 rounded-2xl p-4 text-sm text-emerald-700 mb-6">
            You have 'classes.create' permission! The 'Create Class' button would be visible here.
          </div>
        </PermissionGuard>

        <PermissionGuard action="cms.edit">
          <div className="bg-emerald-50/50 border border-emerald-100 rounded-2xl p-4 text-sm text-emerald-700 mb-6">
            You have 'cms.edit' permission! The CMS Editor toggle would be visible here.
          </div>
        </PermissionGuard>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-slate-800 tracking-tight mb-4">Role Matrix Grid</h3>
        <PermissionMatrix />
      </div>
    </div>
  );
}
