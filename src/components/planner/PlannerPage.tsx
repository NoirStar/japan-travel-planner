import { useSearchParams } from "react-router-dom"
import { MapView } from "@/components/map/MapView"
import { SchedulePanel } from "@/components/planner/SchedulePanel"
import { getCityMapConfig } from "@/data/mapConfig"

export function PlannerPage() {
  const [searchParams] = useSearchParams()
  const cityId = searchParams.get("city")
  const cityConfig = getCityMapConfig(cityId)

  return (
    <div className="flex h-screen flex-col pt-16" data-testid="planner-page">
      {/* 데스크탑: 좌우 분할 / 모바일: 상하 스택 */}
      <div className="flex flex-1 flex-col overflow-hidden lg:flex-row">
        {/* 좌측 일정 패널 */}
        <aside className="h-[40vh] w-full shrink-0 overflow-y-auto border-b border-border lg:h-full lg:w-[380px] lg:border-b-0 lg:border-r">
          <SchedulePanel cityName={cityConfig.name} />
        </aside>

        {/* 우측 지도 */}
        <main className="flex-1">
          <MapView center={cityConfig.center} zoom={cityConfig.zoom} />
        </main>
      </div>
    </div>
  )
}
