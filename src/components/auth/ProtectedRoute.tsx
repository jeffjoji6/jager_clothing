import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Skeleton } from "@/components/ui/skeleton";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
  requireSuperAdmin?: boolean;
  requireFreelancer?: boolean;
}

export const ProtectedRoute = ({
  children,
  requireAdmin = false,
  requireSuperAdmin = false,
  requireFreelancer = false,
}: ProtectedRouteProps) => {
  const { user, profile, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="space-y-4 w-full max-w-md p-8">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      </div>
    );
  }

  if (!user) {
    // Redirect to login with return path
    return <Navigate to="/auth/login" state={{ from: location }} replace />;
  }

  if (requireSuperAdmin && !profile?.is_admin && profile?.role !== "super_admin") {
    return <Navigate to="/" replace />;
  }

  if (requireAdmin && !profile?.is_admin) {
    return <Navigate to="/" replace />;
  }

  if (requireFreelancer && profile?.role !== "freelancer" && !profile?.is_admin) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

