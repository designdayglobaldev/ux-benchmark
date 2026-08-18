import { useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom"
import { Navbar } from "./components/Layout/Navbar"
import { Dashboard } from "./Pages/Dashboard"
import { Browse } from "./Pages/Browse"
import { AppPage } from "./Pages/AppPage"
import { AppFlows } from "./Pages/AppFlows"
import { AppScreens } from "./Pages/AppScreens"
import { InspectContext } from "./contexts/InspectContext"

function App() {
  const [isInspectMode, setIsInspectMode] = useState(false);

  return (
    <InspectContext.Provider value={{ isInspectMode, setIsInspectMode }}>
      <BrowserRouter>
        <div className="min-h-screen bg-black text-white relative font-sans flex flex-col">
          <Navbar />
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/browse" element={<Browse />} />
            <Route path="/app/:slug" element={<AppPage />} />
            <Route path="/app/:slug/flows" element={<AppFlows />} />
            <Route path="/app/:slug/screens" element={<AppScreens />} />
            <Route path="/app/:slug/screens/:screenSlug" element={<AppScreens />} />
          </Routes>
        </div>
      </BrowserRouter>
    </InspectContext.Provider>
  )
}

export default App
