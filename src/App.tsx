import { BrowserRouter, Routes, Route } from "react-router-dom"
import { Header } from "@/components/layout/Header"
import { LandingPage } from "@/components/landing/LandingPage"
import { PlannerPage } from "@/components/planner/PlannerPage"
import { AIChatWizard } from "@/components/chat/AIChatWizard"

function App() {
  return (
    <BrowserRouter>
      <Header />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/planner" element={<PlannerPage />} />
        <Route path="/wizard" element={<AIChatWizard />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
