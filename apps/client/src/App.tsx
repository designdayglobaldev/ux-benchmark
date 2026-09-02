import { useState } from "react";
import { BrowserRouter, Routes, Route, Outlet } from "react-router-dom"
import { Navbar } from "./components/Layout/Navbar"
import { Dashboard } from "./Pages/Dashboard"
import { Browse } from "./Pages/Browse"
import { Benchmark } from "./Pages/Benchmark"
import { AppPage } from "./Pages/AppPage"
import { AppFlows } from "./Pages/AppFlows"
import { AppScreens } from "./Pages/AppScreens"
import { InspectContext } from "./contexts/InspectContext"
import { AuthProvider } from "./contexts/AuthContext"
import { Login } from "./Pages/Login"
import { Register } from "./Pages/Register"

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
              <Route path="/browse" element={<Browse />} />
              <Route path="/app/:slug" element={<AppPage />} />
              <Route path="/app/:slug/flows" element={<AppFlows />} />
              <Route path="/app/:slug/screens" element={<AppScreens />} />
              <Route path="/app/:slug/screens/:screenSlug" element={<AppScreens />} />
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
