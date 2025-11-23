import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useAdmin } from "@/hooks/useAdmin";
import { Loader2 } from "lucide-react";

interface AdminProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'admin' | 'staff' | 'designer';
}

export const AdminProtectedRoute = ({ children, requiredRole = 'admin' }: AdminProtectedRouteProps) => {
  const { user, loading: authLoading } = useAuth();
  const { data: admin, isLoading: adminLoading } = useAdmin();
  const location = useLocation();

  if (authLoading || adminLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!admin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-heading font-bold uppercase">Access Denied</h1>
          <p className="text-grey-text">You don't have permission to access the admin panel.</p>
          <a href="/" className="text-jager-red underline">Return to Home</a>
        </div>
      </div>
    );
  }

  // Check role permissions
  const roleHierarchy: Record<string, number> = {
    admin: 3,
    staff: 2,
    designer: 1,
  };

  if (roleHierarchy[admin.role] < roleHierarchy[requiredRole]) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-heading font-bold uppercase">Insufficient Permissions</h1>
          <p className="text-grey-text">You need {requiredRole} role to access this page.</p>
          <a href="/admin" className="text-jager-red underline">Return to Admin</a>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

