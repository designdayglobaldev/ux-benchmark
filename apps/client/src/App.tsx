import { BrowserRouter, Routes, Route } from "react-router-dom"
import { Navbar } from "./components/Layout/Navbar"
import { Footer } from "./components/Layout/Footer"
import { Dashboard } from "./Pages/Dashboard"
import { AppPage } from "./Pages/AppPage"
import { AppScreens } from "./Pages/AppScreens"

function App() {
  return (
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
      </div>
    </BrowserRouter>
  )
}

export default App
