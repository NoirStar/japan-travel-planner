import { useState, useMemo } from "react"
import { useNavigate } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import { Trash2, MapPin, Calendar, Clock, ChevronRight, Plus, LogIn, Compass, ArrowUpDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ConfirmDialog } from "@/components/ui/ConfirmDialog"
import { useScheduleStore } from "@/stores/scheduleStore"
import { useAuthStore } from "@/stores/authStore"
import { getCityConfig } from "@/data/mapConfig"
import { cities } from "@/data/cities"
import { getAnyPlaceById } from "@/stores/dynamicPlaceStore"

export function TripListPage() {
  const navigate = useNavigate()
  const { trips, deleteTrip, setActiveTrip } = useScheduleStore()
  const { user, setShowLoginModal } = useAuthStore()
  const [deletingTripId, setDeletingTripId] = useState<string | null>(null)
  const [sortBy, setSortBy] = useState<"recent" | "name">("recent")

  const sortedTrips = useMemo(() => {
    const copy = [...trips]
    if (sortBy === "name") copy.sort((a, b) => a.title.localeCompare(b.title, "ko"))
    // "recent" = default store order (newest last), reverse for newest first
    else copy.reverse()
    return copy
  }, [trips, sortBy])

  const handleOpenTrip = (tripId: string, _cityId: string) => {
    setActiveTrip(tripId)
    navigate(`/planner?trip=${tripId}`)
  }

  const handleDelete = (e: React.MouseEvent, tripId: string) => {
    e.stopPropagation()
    setDeletingTripId(tripId)
  }

  const totalPlaces = (trip: (typeof trips)[0]) =>
    trip.days.reduce((sum, day) => sum + day.items.filter((item) => getAnyPlaceById(item.placeId)).length, 0)

  return (
    <div className="min-h-screen bg-sakura-pattern pt-24 pb-14" data-testid="trip-list-page">
      <div className="mx-auto max-w-4xl px-5 lg:px-8">
        {/* 헤더 */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="chip chip-primary mb-3">내 여행</div>
            <h1 className="text-headline font-bold">내 여행 목록</h1>
            <p className="mt-1 text-body-sm text-muted-foreground">저장된 여행 일정을 관리하고 바로 이어서 계획하세요</p>
          </div>
          {user && trips.length > 0 && (
            <Button
              onClick={() => navigate("/planner?new=true")}
              className="btn-gradient btn-base btn-md gap-2 rounded-xl"
              data-testid="create-new-trip"
            >
              <Plus className="h-4 w-4" />
              새 여행 만들기
            </Button>
          )}
        </div>

        {/* 로그인 필요 */}
        {!user ? (
          <div
            className="empty-state card-elevated rounded-2xl"
          >
            <div className="empty-state-icon">
              <LogIn className="h-8 w-8 text-muted-foreground/40" />
            </div>
            <p className="empty-state-title">로그인이 필요합니다</p>
            <p className="empty-state-desc">여행 일정을 저장하고 관리하려면 로그인하세요.</p>
            <Button
              onClick={() => setShowLoginModal(true)}
              className="btn-gradient btn-base btn-md mt-1 gap-2 rounded-xl"
            >
              <LogIn className="h-4 w-4" />
              로그인
            </Button>
          </div>
        ) : trips.length === 0 ? (
          <div
            className="empty-state card-elevated rounded-2xl"
          >
            <div className="empty-state-icon">
              <Compass className="h-8 w-8 text-primary/45" />
            </div>
            <p className="empty-state-title">아직 저장된 여행이 없습니다</p>
            <p className="empty-state-desc">첫 번째 여행을 만들어 일정과 장소를 하나씩 채워보세요.</p>
            <Button
              onClick={() => navigate("/planner?new=true")}
              className="btn-gradient btn-base btn-md mt-1 gap-2 rounded-xl"
            >
              <Plus className="h-4 w-4" />
              새 여행 만들기
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* 투바 */}
            <div className="flex justify-end">
              <div className="flex items-center gap-1 rounded-full bg-muted/90 p-1 text-muted-foreground">
                <span className="inline-flex items-center gap-1 px-2 text-caption font-medium">
                  <ArrowUpDown className="h-3.5 w-3.5" />
                  정렬
                </span>
                {(["recent", "name"] as const).map((opt) => (
                  <button
                    key={opt}
                    onClick={() => setSortBy(opt)}
                    className={`rounded-full px-3 py-1.5 text-caption font-semibold transition-all ${
                      sortBy === opt
                        ? "bg-card text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {{ recent: "최신순", name: "이름순" }[opt]}
                  </button>
                ))}
              </div>
            </div>

            <AnimatePresence mode="popLayout">
              {sortedTrips.map((trip) => {
                const cityConfig = getCityConfig(trip.cityId)
                const places = totalPlaces(trip)
                const daysWithPlaces = trip.days.filter((d) => d.items.length > 0).length
                return (
                  <motion.div
                    key={trip.id}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -100 }}
                    className="group card-elevated cursor-pointer overflow-hidden rounded-2xl transition-all hover:border-primary/20"
                    onClick={() => handleOpenTrip(trip.id, trip.cityId)}
                    data-testid={`trip-card-${trip.id}`}
                  >
                    <div className="flex items-center gap-4 p-4">
                      {/* 도시 썸네일 */}
                      {(() => {
                        const cityData = cities.find((c) => c.id === trip.cityId)
                        return cityData?.image ? (
                          <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-muted">
                            <img src={cityData.image} alt={cityConfig.name} className="h-full w-full object-cover" loading="lazy" />
                          </div>
                        ) : (
                          <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary/15 to-primary/5">
                            <MapPin className="h-6 w-6 text-primary" />
                          </div>
                        )
                      })()}

                      {/* 여행 정보 */}
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="truncate text-sm font-bold text-foreground">{trip.title}</h3>
                          <span className={`shrink-0 rounded-full px-2 py-0.5 text-caption font-semibold ${
                            daysWithPlaces === trip.days.length
                              ? "bg-success/10 text-success"
                              : "bg-muted text-muted-foreground"
                          }`}>{daysWithPlaces}/{trip.days.length}일</span>
                        </div>
                        <p className="text-body-sm text-muted-foreground">{cityConfig.name}</p>

                        <div className="mt-1.5 flex flex-wrap items-center gap-3 text-caption text-muted-foreground">
                          {(trip.startDate || trip.endDate) && (
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {trip.startDate ?? "??"} ~ {trip.endDate ?? "??"}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {trip.days.length}일 · 장소 {places}개
                          </span>
                        </div>
                      </div>

                      {/* 액션 */}
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-full transition-opacity hover:bg-destructive/10 sm:opacity-0 sm:group-hover:opacity-100"
                          onClick={(e) => handleDelete(e, trip.id)}
                          aria-label="여행 삭제"
                          data-testid={`trip-delete-${trip.id}`}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                        <ChevronRight className="h-5 w-5 text-muted-foreground/40" />
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </AnimatePresence>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={!!deletingTripId}
        onOpenChange={(open) => { if (!open) setDeletingTripId(null) }}
        title="이 여행을 삭제하시겠습니까?"
        description="삭제된 여행은 복구할 수 없습니다."
        confirmLabel="삭제"
        variant="destructive"
        onConfirm={() => { if (deletingTripId) deleteTrip(deletingTripId) }}
      />
    </div>
  )
}
