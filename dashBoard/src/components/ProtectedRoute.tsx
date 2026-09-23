import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import type { AppPagePermission, UserRole } from "@/types";

type ProtectedRouteProps = {
  children: React.ReactNode;
  pageKey?: AppPagePermission;
  allowedRoles?: UserRole[];
};

export default function ProtectedRoute({
  children,
  pageKey,
  allowedRoles,
}: ProtectedRouteProps) {
  const { user, isAdmin, hasPageAccess } = useAuth();

  if (!user) {
    return <Navigate to="/" replace />;
  }

  // Admins have universal access across the entire platform
  if (isAdmin) {
    return <>{children}</>;
  }

  // Check page-level access (for managers, internal, and external users)
  if (pageKey && !hasPageAccess(pageKey)) {
    return <Navigate to="/" replace />;
  }

  // Check role-level permission if explicitly constrained
  if (allowedRoles && allowedRoles.length > 0) {
    const userRoles = Array.isArray(user.roles)
      ? user.roles.map((r) => r.toUpperCase())
      : [];
    const hasAllowedRole = allowedRoles.some((r) =>
      userRoles.includes(r.toUpperCase())
    );

    if (!hasAllowedRole) {
      return <Navigate to="/" replace />;
    }
  }

  return <>{children}</>;
}
