import { useState } from "react";
import { BrowserRouter, Routes, Route, Outlet } from "react-router-dom"
import { Navbar } from "./components/Layout/Navbar"
import { Dashboard } from "./Pages/Dashboard"
import { Browse } from "./Pages/Browse"
import { Benchmark } from "./Pages/Benchmark"
import { Flows } from "./Pages/Flows"
import { FlowDetail } from "./Pages/FlowDetail"
import { AppPage } from "./Pages/AppPage"
import { AppFlows } from "./Pages/AppFlows"
import { AppScreens } from "./Pages/AppScreens"
import { AppAllScreens } from "./Pages/AppAllScreens"
import { Workspaces } from "./Pages/Workspaces"
import { SharedBoard } from "./Pages/SharedBoard"
import { InspectContext } from "./contexts/InspectContext"
import { AuthProvider } from "./contexts/AuthContext"
import { Login } from "./Pages/Login"
import { Register } from "./Pages/Register"
import { AppProtectedRoute } from "./components/Layout/AppProtectedRoute";
import { lazy, Suspense } from "react";
import { Pricing } from "./Pages/Pricing";
import { UpgradeProvider } from "./contexts/UpgradeContext";
import { UpgradeModal } from "./components/Pricing/UpgradeModal";
import { useFeatureFlag } from "./hooks/useFeatureFlag";
import { Navigate } from "react-router-dom";
import { FeaturePlaceholder } from "./components/FeaturePlaceholder";
import { StudioPageSkeleton } from "./components/StudioPageSkeleton";

// Lazy-load protected feature components so their code and subtrees NEVER mount/evaluate when disabled
const LazyDesignAgentStudio = lazy(() =>
  import("./Pages/DesignAgentStudio").then((m) => ({ default: m.DesignAgentStudio }))
);

function FeatureGuard({ 
  flagKey, 
  title, 
  defaultEnabled = false,
  children 
}: { 
  flagKey: string; 
  title?: string; 
  defaultEnabled?: boolean;
  children: React.ReactNode 
}) {
  const flag = useFeatureFlag(flagKey, defaultEnabled);

  // If status is not yet confirmed, render clean skeleton — NEVER leak real UI
  if (!flag.isLoaded) {
    return <StudioPageSkeleton />;
  }

  // If feature is active, render normal page
  if (flag.enabled) {
    return <>{children}</>;
  }

  // If feature is disabled and configured to hide:
  if (flag.behavior === 'hide') {
    return <Navigate to="/" replace />;
  }

  // Otherwise, render placeholder (Coming Soon or Maintenance)
  return (
    <FeaturePlaceholder
      title={title || 'Feature'}
      behavior={flag.behavior}
      customMessage={flag.customMessage}
    />
  );
}

function MainLayout() {
  return (
    <div className="min-h-screen bg-black text-white relative font-sans flex flex-col">
      <Navbar />
      <Outlet />
      <UpgradeModal />
    </div>
  );
}

function AuthLayout() {
  return (
    <div className="min-h-screen bg-black text-white relative font-sans flex flex-col">
      <Outlet />
    </div>
  );
}

function App() {
  const [isInspectMode, setIsInspectMode] = useState(false);

  return (
    <AuthProvider>
      <UpgradeProvider>
        <InspectContext.Provider value={{ isInspectMode, setIsInspectMode }}>
          <BrowserRouter>
            <Routes>
            {/* Routes with Navbar */}
            <Route element={<MainLayout />}>
              <Route path="/" element={<Dashboard />} />
              <Route 
                path="/benchmark" 
                element={
                  <FeatureGuard flagKey="ai-benchmark" title="AI Benchmark" defaultEnabled={true}>
                    <Benchmark />
                  </FeatureGuard>
                } 
              />
              <Route path="/flows" element={<Flows />} />
              <Route path="/flows/:slug" element={<FlowDetail />} />
              <Route path="/browse" element={<Browse />} />
              <Route path="/pricing" element={<Pricing />} />
              <Route 
                path="/design-agent" 
                element={
                  <FeatureGuard flagKey="design-agent-studio" title="Design Agent Studio">
                    <Suspense fallback={<StudioPageSkeleton />}>
                      <LazyDesignAgentStudio />
                    </Suspense>
                  </FeatureGuard>
                } 
              />
              <Route path="/app/:slug" element={<AppProtectedRoute><AppPage /></AppProtectedRoute>} />
              <Route path="/app/:slug/flows" element={<AppProtectedRoute><AppFlows /></AppProtectedRoute>} />
              <Route path="/app/:slug/screens" element={<AppProtectedRoute><AppScreens /></AppProtectedRoute>} />
              <Route path="/app/:slug/all-screens" element={<AppProtectedRoute><AppAllScreens /></AppProtectedRoute>} />
              <Route path="/app/:slug/screens/:screenSlug" element={<AppProtectedRoute><AppScreens /></AppProtectedRoute>} />
              <Route path="/workspaces" element={<AppProtectedRoute><Workspaces /></AppProtectedRoute>} />
              <Route path="/collections" element={<AppProtectedRoute><Workspaces /></AppProtectedRoute>} />
              <Route path="/boards/:boardId" element={<AppProtectedRoute><SharedBoard /></AppProtectedRoute>} />
            </Route>

            {/* Routes without Navbar */}
            <Route element={<AuthLayout />}>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
            </Route>
            </Routes>
          </BrowserRouter>
        </InspectContext.Provider>
      </UpgradeProvider>
    </AuthProvider>
  )
}

export default App
