"use client";

import { useAuthContext } from "@/context/AuthContext";
import AccessDenied from "./AccessDenied";
import { useEffect } from "react";

export default function AccessGate({
  requiredPermission = "classes.update",
  fallbackTitle = "You don’t have access",
  fallbackDescription = "You need permission to view this resource.",
  children,
}: {
  requiredRole?: string; // Kept for backwards compatibility
  requiredPermission?: string;
  fallbackTitle?: string;
  fallbackDescription?: string;
  children: React.ReactNode;
}) {
  const { user, loading, openLoginModal, hasPermission } = useAuthContext();

  useEffect(() => {
    if (!loading && !user) {
      openLoginModal();
    }
  }, [loading, user, openLoginModal]);

  if (loading) {
    return (
      <div className="p-6">
        <div className="h-6 w-40 bg-gray-200/70 rounded animate-pulse" />
        <div className="mt-4 h-40 w-full bg-gray-100 rounded-xl animate-pulse" />
      </div>
    );
  }

  if (!user) {
    return (
      <AccessDenied
        title="Sign in required"
        description="Please log in with an authorized account to access this page."
        backHref="/login"
      />
    );
  }

  const allowed = hasPermission(requiredPermission);

  if (!allowed) {
    return (
      <AccessDenied
        title={fallbackTitle}
        description={fallbackDescription}
      />
    );
  }

  return <>{children}</>;
}
