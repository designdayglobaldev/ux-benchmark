import { useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom"
import { Navbar } from "./components/Layout/Navbar"
import { Footer } from "./components/Layout/Footer"
import { Dashboard } from "./Pages/Dashboard"
import { AppPage } from "./Pages/AppPage"
import { AppScreens } from "./Pages/AppScreens"
import floatIcon from './assets/floaticon.svg'
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
            <Route path="/app/:slug" element={<AppPage />} />
            <Route path="/app/:slug/screens" element={<AppScreens />} />
            <Route path="/app/:slug/screens/:screenSlug" element={<AppScreens />} />
          </Routes>
          <Footer />
          
          {/* Floating Toggle Button with Tooltip */}
          <div className="fixed bottom-6 right-6 z-40 flex items-center group">
            {/* Tooltip */}
            <div className="mr-3 bg-zinc-800 text-zinc-200 px-4 py-2.5 rounded-full text-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300 shadow-xl relative whitespace-nowrap pointer-events-none">
              Ask me about this screen
              {/* Right arrow triangle */}
              <div className="absolute top-1/2 -right-2 -translate-y-1/2 border-[6px] border-transparent border-l-zinc-800"></div>
            </div>
            
            <button
              onClick={() => setIsInspectMode(!isInspectMode)}
              className={`transition-transform hover:scale-110 active:scale-95 flex items-center justify-center p-2 rounded-full shadow-[0_0_20px_rgba(255,255,255,0.15)] bg-black/20 backdrop-blur-md border border-white/10 ${
                isInspectMode ? 'ring-4 ring-blue-500/50' : ''
              }`}
            >
              <img src={floatIcon} alt="Inspect Mode" className="h-16 w-16 drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]" />
            </button>
          </div>
        </div>
      </BrowserRouter>
    </InspectContext.Provider>
  )
}

export default App
