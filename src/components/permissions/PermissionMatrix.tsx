"use client";

import React, { useState } from "react";
import { usePermissions } from "@/hooks/usePermissions";
import { PermissionAction, Role } from "@/services/contracts/permissions";
import { cn } from "@/lib/utils";

const AVAILABLE_ACTIONS: { module: string; actions: PermissionAction[] }[] = [
  { module: "Classes", actions: ["classes.create", "classes.update", "classes.delete"] },
  { module: "Materials", actions: ["materials.create", "materials.delete"] },
  { module: "CMS", actions: ["cms.edit"] },
  { module: "Attendance", actions: ["attendance.override"] }
];

export function PermissionMatrix() {
  const { roles, loading, updatePermissions } = usePermissions();

  if (loading) {
    return (
      <div className="bg-white border border-slate-100 rounded-2xl p-6">
        <div className="bg-slate-100 animate-pulse rounded-lg h-64 w-full"></div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl shadow-soft overflow-hidden">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr>
            <th className="bg-slate-50/75 text-slate-600 font-semibold text-xs uppercase tracking-wider py-3.5 px-4 border-b border-slate-100 w-1/4">
              Module / Action
            </th>
            {roles.map(role => (
              <th key={role.id} className="bg-slate-50/75 text-slate-600 font-semibold text-xs uppercase tracking-wider py-3.5 px-4 border-b border-slate-100 text-center">
                {role.name}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {AVAILABLE_ACTIONS.map(group => (
            <React.Fragment key={group.module}>
              <tr className="bg-slate-50/40 border-b border-slate-100/80">
                <td className="py-2.5 px-4 font-semibold text-sm text-slate-800" colSpan={roles.length + 1}>
                  {group.module}
                </td>
              </tr>
              {group.actions.map(action => (
                <tr key={action} className="hover:bg-slate-50/60 transition-colors duration-150 border-b border-slate-100/80 last:border-none">
                  <td className="py-3 px-6 text-sm text-slate-600">
                    <span className="font-mono text-xs text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">{action}</span>
                  </td>
                  {roles.map(role => {
                    const hasPerm = role.permissions.includes(action);
                    return (
                      <td key={`${role.id}-${action}`} className="py-3 px-4 text-center">
                        <button
                          onClick={() => {
                            const newPerms = hasPerm 
                              ? role.permissions.filter(p => p !== action)
                              : [...role.permissions, action];
                            updatePermissions(role.id, newPerms);
                          }}
                          className={cn(
                            "w-12 h-6 rounded-full inline-flex items-center transition-colors border",
                            hasPerm 
                              ? "bg-blue-50/80 border-blue-200 justify-end" 
                              : "bg-slate-100 border-slate-200 justify-start"
                          )}
                        >
                          <span className={cn(
                            "w-4 h-4 rounded-full mx-1 shadow-soft-xs",
                            hasPerm ? "bg-blue-500" : "bg-white"
                          )} />
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </React.Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
}
