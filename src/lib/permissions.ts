import { useAuthContext } from "@/context/AuthContext";

export function usePermission(permissionKey: string): boolean {
  const { user } = useAuthContext();
  if (!user) return false;

  const rawRole = String(user.role || "").toLowerCase().trim();
  if (rawRole === "admin" || rawRole === "teacher") return true;

  const permissions: string[] = user.permissions || [];
  if (permissions.includes("*")) return true;

  const namespace = permissionKey.split(".")[0];
  if (namespace && permissions.includes(`${namespace}.*`)) return true;

  return permissions.includes(permissionKey);
}

