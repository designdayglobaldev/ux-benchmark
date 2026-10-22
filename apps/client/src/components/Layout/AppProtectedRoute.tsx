import { Navigate, useParams } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { useApps } from "../../hooks/useApps";

export function AppProtectedRoute({ children }: { children: React.ReactNode }) {
    const { slug } = useParams<{ slug: string }>();
    const { user, isLoading: isAuthLoading } = useAuth();
    const { data: apps, isLoading: isAppsLoading } = useApps();

    if (isAuthLoading || isAppsLoading) {
        return <div className="min-h-screen bg-black" />;
    }

    // If not logged in:
    if (!user) {
        // If route has an app slug, allow access to first 4 preview apps
        if (slug) {
            if (apps) {
                const allowedSlugs = apps.slice(0, 4).map(app => app.slug);
                if (!allowedSlugs.includes(slug)) {
                    return <Navigate to="/register" replace />;
                }
            }
        } else {
            // For general user-only routes (/workspaces, /collections, /boards/:boardId), require authentication
            return <Navigate to="/login" replace />;
        }
    }

    return <>{children}</>;
}
