import { useLocation } from "react-router-dom"
import { TopHeader } from "./TopHeader"
import { MobileDock } from "./MobileDock"

export function AppShell({ children }: { children: React.ReactNode }) {
  const location = useLocation()
  const isPlanner = location.pathname === "/planner" || location.pathname.startsWith("/share/")

  return (
    <>
      {!isPlanner && <TopHeader />}
      <main className={`min-h-screen ${isPlanner ? "" : "lg:mt-14"} ${isPlanner ? "" : "pb-14 lg:pb-0"}`}>
        {children}
      </main>
      {!isPlanner && <MobileDock />}
    </>
  )
}
