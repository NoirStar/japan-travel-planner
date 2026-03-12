import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import { Trash2, MapPin, Calendar, Clock, ChevronRight, Plane, Plus, LogIn, Compass } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ConfirmDialog } from "@/components/ui/ConfirmDialog"
import { useScheduleStore } from "@/stores/scheduleStore"
import { useAuthStore } from "@/stores/authStore"
import { getCityConfig } from "@/data/mapConfig"
import { getAnyPlaceById } from "@/stores/dynamicPlaceStore"

export function TripListPage() {
  const navigate = useNavigate()
  const { trips, deleteTrip, setActiveTrip } = useScheduleStore()
  const { user, setShowLoginModal } = useAuthStore()
  const [deletingTripId, setDeletingTripId] = useState<string | null>(null)

  const handleOpenTrip = (tripId: string, cityId: string) => {
    setActiveTrip(tripId)
    navigate(`/planner?city=${cityId}`)
  }

  const handleDelete = (e: React.MouseEvent, tripId: string) => {
    e.stopPropagation()
    setDeletingTripId(tripId)
  }

  const totalPlaces = (trip: (typeof trips)[0]) =>
    trip.days.reduce((sum, day) => sum + day.items.filter((item) => getAnyPlaceById(item.placeId)).length, 0)

  return (
    <div className="min-h-screen bg-background pt-14" data-testid="trip-list-page">
      <div className="mx-auto max-w-3xl px-4 py-10">
        {/* 헤더 */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-sakura/10">
            <Plane className="h-8 w-8 text-sakura-dark" />
          </div>
          <h1 className="text-2xl font-bold">내 여행 목록</h1>
          <p className="mt-1 text-sm text-muted-foreground">저장된 여행 일정을 관리하세요</p>
        </div>

        {/* 로그인 필요 */}
        {!user ? (
          <motion.div
            className="flex flex-col items-center gap-4 py-20 text-center text-muted-foreground"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <motion.div
              className="flex h-20 w-20 items-center justify-center rounded-3xl bg-muted"
              animate={{ y: [0, -6, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            >
              <LogIn className="h-10 w-10 text-muted-foreground/30" />
            </motion.div>
            <p className="text-sm font-medium">로그인이 필요합니다</p>
            <p className="text-xs opacity-60">여행 일정을 저장하고 관리하려면 로그인하세요</p>
            <Button
              onClick={() => setShowLoginModal(true)}
              className="btn-gradient mt-2 gap-2 rounded-xl"
            >
              <LogIn className="h-4 w-4" />
              로그인
            </Button>
          </motion.div>
        ) : trips.length === 0 ? (
          <motion.div
            className="flex flex-col items-center gap-4 py-20 text-center text-muted-foreground"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <motion.div
              className="flex h-20 w-20 items-center justify-center rounded-3xl bg-primary/10"
              animate={{ y: [0, -8, 0], rotate: [0, 5, -5, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            >
              <Compass className="h-10 w-10 text-primary/40" />
            </motion.div>
            <p className="text-sm font-medium">아직 저장된 여행이 없습니다</p>
            <p className="text-xs opacity-60">첫 번째 여행을 만들어볼까요?</p>
            <Button
              onClick={() => navigate("/")}
              className="btn-gradient mt-2 gap-2 rounded-xl"
            >
              <Plus className="h-4 w-4" />
              새 여행 만들기
            </Button>
          </motion.div>
        ) : (
          <div className="space-y-3">
            {/* 새 여행 만들기 버튼 */}
            <Button
              onClick={() => navigate("/")}
              className="btn-gradient w-full gap-2 rounded-xl"
              data-testid="create-new-trip"
            >
              <Plus className="h-4 w-4" />
              새 여행 만들기
            </Button>

            <AnimatePresence mode="popLayout">
              {trips.map((trip) => {
                const cityConfig = getCityConfig(trip.cityId)
                const places = totalPlaces(trip)
                return (
                  <motion.div
                    key={trip.id}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -100 }}
                    className="group cursor-pointer overflow-hidden rounded-2xl border border-border bg-card transition-all card-shadow"
                    onClick={() => handleOpenTrip(trip.id, trip.cityId)}
                    data-testid={`trip-card-${trip.id}`}
                  >
                    <div className="flex items-center gap-4 p-4">
                      {/* 도시 아이콘 */}
                      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-sakura/10">
                        <MapPin className="h-6 w-6 text-sakura-dark" />
                      </div>

                      {/* 여행 정보 */}
                      <div className="min-w-0 flex-1">
                        <h3 className="text-sm font-bold">{trip.title}</h3>
                        <p className="text-xs text-muted-foreground">{cityConfig.name}</p>

                        <div className="mt-1.5 flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
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
