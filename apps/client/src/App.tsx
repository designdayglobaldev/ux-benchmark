import { useState } from "react"
import { Navbar } from "./components/Layout/Navbar"
import { Footer } from "./components/Layout/Footer"
import { Dashboard } from "./Pages/Dashboard"
import { Revolut1 } from "./Pages/Revolut1"
import { Revolut2 } from "./Pages/Revolut2"

function App() {
  const [currentPage, setCurrentPage] = useState("dashboard")

  return (
    <div className="min-h-screen bg-black text-white relative font-sans flex flex-col">
      <Navbar />
      {currentPage === "dashboard" && (
        <Dashboard onNavigate={(page) => setCurrentPage(page)} />
      )}
      {currentPage === "revolut1" && (
        <Revolut1 onBack={() => setCurrentPage("dashboard")} onNavigate={(page) => setCurrentPage(page)} />
      )}
      {currentPage === "revolut2" && (
        <Revolut2 onBack={() => setCurrentPage("revolut1")} />
      )}
      <Footer />
    </div>
  )
}

export default App
