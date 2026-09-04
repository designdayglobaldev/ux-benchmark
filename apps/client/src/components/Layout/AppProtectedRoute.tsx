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

    // If not logged in, restrict access to only the first 4 apps
    if (!user && apps) {
        const allowedSlugs = apps.slice(0, 4).map(app => app.slug);
        if (slug && !allowedSlugs.includes(slug)) {
            // Redirect to registration page if trying to access a locked app
            return <Navigate to="/register" replace />;
        }
    }

    return <>{children}</>;
}
