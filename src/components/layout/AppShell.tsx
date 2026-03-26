import { useLocation } from "react-router-dom"
import { DesktopRail } from "./DesktopRail"
import { MobileDock } from "./MobileDock"

export function AppShell({ children }: { children: React.ReactNode }) {
  const location = useLocation()
  const isPlanner = location.pathname === "/planner" || location.pathname.startsWith("/share/")

  return (
    <>
      <DesktopRail />
      <main className={`min-h-screen ${isPlanner ? "lg:ml-[60px]" : "lg:ml-[60px]"} pb-14 lg:pb-0`}>
        {children}
      </main>
      <MobileDock />
    </>
  )
}
