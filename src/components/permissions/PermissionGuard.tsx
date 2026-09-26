"use client";

import React, { useEffect, useState } from "react";
import { usePermissions } from "@/hooks/usePermissions";
import { PermissionAction } from "@/services/contracts/permissions";

interface PermissionGuardProps {
  action: PermissionAction;
  scopeId?: string;
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

export function PermissionGuard({ action, scopeId, fallback = null, children }: PermissionGuardProps) {
  const { hasPermissionSync, loading } = usePermissions();
  const [granted, setGranted] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!loading) {
      setGranted(hasPermissionSync(action, scopeId));
    }
  }, [loading, action, scopeId, hasPermissionSync]);

  if (!isMounted || loading) {
    // Optionally return a skeleton here if you prefer
    return null; 
  }

  return granted ? <>{children}</> : <>{fallback}</>;
}
