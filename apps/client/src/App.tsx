import { useState } from "react";
import { BrowserRouter, Routes, Route, Outlet } from "react-router-dom"
import { Navbar } from "./components/Layout/Navbar"
import { Dashboard } from "./Pages/Dashboard"
import { Browse } from "./Pages/Browse"
import { Benchmark } from "./Pages/Benchmark"
import { Flows } from "./Pages/Flows"
import { AppPage } from "./Pages/AppPage"
import { AppFlows } from "./Pages/AppFlows"
import { AppScreens } from "./Pages/AppScreens"
import { AppAllScreens } from "./Pages/AppAllScreens"
import { InspectContext } from "./contexts/InspectContext"
import { AuthProvider } from "./contexts/AuthContext"
import { Login } from "./Pages/Login"
import { Register } from "./Pages/Register"
import { AppProtectedRoute } from "./components/Layout/AppProtectedRoute"

function MainLayout() {
  return (
    <div className="min-h-screen bg-black text-white relative font-sans flex flex-col">
      <Navbar />
      <Outlet />
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
      <InspectContext.Provider value={{ isInspectMode, setIsInspectMode }}>
        <BrowserRouter>
          <Routes>
            {/* Routes with Navbar */}
            <Route element={<MainLayout />}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/benchmark" element={<Benchmark />} />
              <Route path="/flows" element={<Flows />} />
              <Route path="/browse" element={<Browse />} />
              <Route path="/app/:slug" element={<AppProtectedRoute><AppPage /></AppProtectedRoute>} />
              <Route path="/app/:slug/flows" element={<AppProtectedRoute><AppFlows /></AppProtectedRoute>} />
              <Route path="/app/:slug/screens" element={<AppProtectedRoute><AppScreens /></AppProtectedRoute>} />
              <Route path="/app/:slug/all-screens" element={<AppProtectedRoute><AppAllScreens /></AppProtectedRoute>} />
              <Route path="/app/:slug/screens/:screenSlug" element={<AppProtectedRoute><AppScreens /></AppProtectedRoute>} />
            </Route>

            {/* Routes without Navbar */}
            <Route element={<AuthLayout />}>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </InspectContext.Provider>
    </AuthProvider>
  )
}

export default App
