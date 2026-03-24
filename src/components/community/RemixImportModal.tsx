import { useState, useMemo } from "react"
import { X, Download, Plus, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useScheduleStore } from "@/stores/scheduleStore"
import { useDynamicPlaceStore } from "@/stores/dynamicPlaceStore"
import { showToast } from "@/components/ui/CelebrationOverlay"
import { useNavigate } from "react-router-dom"
import type { CommunityPost } from "@/types/community"
import type { Place } from "@/types/place"
import { cities } from "@/data/cities"

type ImportMode = "full" | "days" | "places"
type TargetMode = "new" | "existing"

interface RemixImportModalProps {
  open: boolean
  onClose: () => void
  post: CommunityPost
}

export function RemixImportModal({ open, onClose, post }: RemixImportModalProps) {
  const navigate = useNavigate()
  const { trips, createTrip, addDay, addItem } = useScheduleStore()
  const [importMode, setImportMode] = useState<ImportMode>("full")
  const [targetMode, setTargetMode] = useState<TargetMode>("new")
  const [selectedDays, setSelectedDays] = useState<Set<number>>(new Set())
  const [selectedPlaces, setSelectedPlaces] = useState<Set<string>>(new Set())
  const [targetTripId, setTargetTripId] = useState("")
  const [targetDayId, setTargetDayId] = useState("")

  const tripData = post.trip_data

  const allPlaces = useMemo(() => {
    if (!tripData?.days) return []
    const seen = new Set<string>()
    const result: { placeId: string; placeName: string; dayNumber: number }[] = []
    for (const day of tripData.days) {
      for (const item of day.items ?? []) {
        if (!seen.has(item.placeId)) {
          seen.add(item.placeId)
          result.push({ placeId: item.placeId, placeName: item.placeName ?? item.placeId, dayNumber: day.dayNumber })
        }
      }
    }
    return result
  }, [tripData])

  const existingTrips = useMemo(() =>
    trips.map((t) => {
      const city = cities.find((c) => c.id === t.cityId)
      return { id: t.id, label: `${t.title} (${city?.name ?? t.cityId})`, days: t.days }
    }), [trips])

  const selectedTrip = existingTrips.find((t) => t.id === targetTripId)

  if (!open || !tripData) return null

  const toggleDay = (dayNum: number) => {
    setSelectedDays((prev) => {
      const next = new Set(prev)
      if (next.has(dayNum)) next.delete(dayNum)
      else next.add(dayNum)
      return next
    })
  }

  const togglePlace = (placeId: string) => {
    setSelectedPlaces((prev) => {
      const next = new Set(prev)
      if (next.has(placeId)) next.delete(placeId)
      else next.add(placeId)
      return next
    })
  }

  const restorePlaces = () => {
    const { addPlace } = useDynamicPlaceStore.getState()
    for (const day of tripData.days ?? []) {
      for (const item of day.items ?? []) {
        if ((item as unknown as { placeData?: Place }).placeData) {
          addPlace((item as unknown as { placeData: Place }).placeData)
        }
      }
    }
  }

  const handleImport = () => {
    restorePlaces()
    const store = useScheduleStore.getState()

    if (importMode === "full") {
      const newTrip = createTrip(tripData.cityId, `[가져옴] ${post.title}`)
      ;(tripData.days ?? []).forEach((day, i) => {
        const newDay = i === 0 ? newTrip.days[0] : addDay(newTrip.id)
        ;(day.items ?? []).forEach((item) => {
          addItem(newTrip.id, newDay.id, item.placeId)
        })
      })
      navigate(`/planner?trip=${newTrip.id}`)
      showToast("전체 일정을 가져왔습니다")
    } else if (importMode === "days") {
      const daysToImport = (tripData.days ?? []).filter((d) => selectedDays.has(d.dayNumber))
      if (daysToImport.length === 0) return

      if (targetMode === "new") {
        const newTrip = createTrip(tripData.cityId, `[리믹스] ${post.title}`)
        daysToImport.forEach((day, i) => {
          const newDay = i === 0 ? newTrip.days[0] : addDay(newTrip.id)
          ;(day.items ?? []).forEach((item) => {
            addItem(newTrip.id, newDay.id, item.placeId)
          })
        })
        navigate(`/planner?trip=${newTrip.id}`)
      } else {
        if (!targetTripId) return
        const trip = store.trips.find((t) => t.id === targetTripId)
        if (!trip) return
        for (const day of daysToImport) {
          const newDay = store.addDay(targetTripId)
          ;(day.items ?? []).forEach((item) => {
            store.addItem(targetTripId, newDay.id, item.placeId)
          })
        }
        navigate(`/planner?trip=${targetTripId}`)
      }
      showToast(`${daysToImport.length}일 일정을 가져왔습니다`)
    } else {
      // places mode
      const placeIds = Array.from(selectedPlaces)
      if (placeIds.length === 0) return

      if (targetMode === "new") {
        const newTrip = createTrip(tripData.cityId, `[리믹스] ${post.title}`)
        const day = newTrip.days[0]
        placeIds.forEach((pid) => addItem(newTrip.id, day.id, pid))
        navigate(`/planner?trip=${newTrip.id}`)
      } else {
        if (!targetTripId || !targetDayId) return
        placeIds.forEach((pid) => store.addItem(targetTripId, targetDayId, pid))
        navigate(`/planner?trip=${targetTripId}`)
      }
      showToast(`${placeIds.length}개 장소를 가져왔습니다`)
    }

    onClose()
  }

  const canSubmit = () => {
    if (importMode === "days" && selectedDays.size === 0) return false
    if (importMode === "places" && selectedPlaces.size === 0) return false
    if (targetMode === "existing" && !targetTripId) return false
    if (importMode === "places" && targetMode === "existing" && !targetDayId) return false
    return true
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg max-h-[85vh] overflow-y-auto rounded-2xl border border-border bg-card p-5 shadow-xl">
        <button onClick={onClose} className="absolute right-4 top-4 text-muted-foreground hover:text-foreground">
          <X className="h-5 w-5" />
        </button>

        <h2 className="mb-4 text-lg font-bold">일정 가져오기</h2>

        {/* Import mode */}
        <div className="mb-4">
          <label className="mb-1.5 block text-xs font-semibold text-muted-foreground">가져오기 방식</label>
          <div className="flex gap-2">
            {([["full", "전체 가져오기"], ["days", "선택 일차만"], ["places", "선택 장소만"]] as [ImportMode, string][]).map(([mode, label]) => (
              <button
                key={mode}
                onClick={() => setImportMode(mode)}
                className={`flex-1 rounded-xl border px-3 py-2 text-xs font-semibold transition-all ${
                  importMode === mode ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:bg-muted"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Day selection */}
        {importMode === "days" && (
          <div className="mb-4">
            <label className="mb-1.5 block text-xs font-semibold text-muted-foreground">가져올 일차 선택</label>
            <div className="flex flex-wrap gap-1.5">
              {(tripData.days ?? []).map((day) => (
                <button
                  key={day.dayNumber}
                  onClick={() => toggleDay(day.dayNumber)}
                  className={`flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                    selectedDays.has(day.dayNumber)
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}
                >
                  {selectedDays.has(day.dayNumber) && <Check className="h-3 w-3" />}
                  Day {day.dayNumber} ({(day.items ?? []).length}곳)
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Place selection */}
        {importMode === "places" && (
          <div className="mb-4">
            <label className="mb-1.5 block text-xs font-semibold text-muted-foreground">가져올 장소 선택</label>
            <div className="max-h-48 overflow-y-auto space-y-1">
              {allPlaces.map((p) => (
                <button
                  key={p.placeId}
                  onClick={() => togglePlace(p.placeId)}
                  className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs transition-all ${
                    selectedPlaces.has(p.placeId)
                      ? "bg-primary/10 text-primary"
                      : "bg-muted/50 text-muted-foreground hover:bg-muted"
                  }`}
                >
                  {selectedPlaces.has(p.placeId) ? <Check className="h-3 w-3 shrink-0" /> : <Plus className="h-3 w-3 shrink-0 opacity-30" />}
                  <span className="truncate">{p.placeName}</span>
                  <span className="ml-auto text-[10px] opacity-60">Day {p.dayNumber}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Target */}
        {importMode !== "full" && (
          <div className="mb-4">
            <label className="mb-1.5 block text-xs font-semibold text-muted-foreground">가져올 대상</label>
            <div className="flex gap-2 mb-2">
              <button
                onClick={() => setTargetMode("new")}
                className={`flex-1 rounded-xl border px-3 py-2 text-xs font-semibold transition-all ${
                  targetMode === "new" ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground"
                }`}
              >
                새 여행 만들기
              </button>
              <button
                onClick={() => setTargetMode("existing")}
                className={`flex-1 rounded-xl border px-3 py-2 text-xs font-semibold transition-all ${
                  targetMode === "existing" ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground"
                }`}
              >
                기존 여행에 추가
              </button>
            </div>

            {targetMode === "existing" && (
              <div className="space-y-2">
                <select
                  value={targetTripId}
                  onChange={(e) => { setTargetTripId(e.target.value); setTargetDayId("") }}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-primary/40"
                >
                  <option value="">여행을 선택하세요</option>
                  {existingTrips.map((t) => (
                    <option key={t.id} value={t.id}>{t.label}</option>
                  ))}
                </select>

                {importMode === "places" && selectedTrip && (
                  <select
                    value={targetDayId}
                    onChange={(e) => setTargetDayId(e.target.value)}
                    className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-primary/40"
                  >
                    <option value="">일차를 선택하세요</option>
                    {selectedTrip.days.map((d) => (
                      <option key={d.id} value={d.id}>Day {d.dayNumber}</option>
                    ))}
                  </select>
                )}
              </div>
            )}
          </div>
        )}

        <Button
          onClick={handleImport}
          disabled={!canSubmit()}
          className="w-full gap-2 rounded-xl"
        >
          <Download className="h-4 w-4" />
          가져오기
        </Button>
      </div>
    </div>
  )
}
