import { Navigate } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useAuth, type UserRole } from '../context/AuthContext';

/**
 * DESIGN NOTES (ProtectedRoute)
 * -----------------------------
 * Hiding /dashboard in React is a UX convenience (don't show UI you can't use),
 * not real security. Anyone can still call the API directly — the real gate is
 * the backend authenticate/authorize middleware. This mirrors authorize(...roles)
 * for navigation only.
 */
interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: UserRole[];
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user, token } = useAuth();

  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
