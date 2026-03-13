import { useState, useEffect, useMemo } from "react"
import { getAnyPlaceById } from "@/stores/dynamicPlaceStore"
import { estimateTravel } from "@/lib/utils"
import { getTravelTime } from "@/lib/travelTimes"
import type { TransportMode } from "@/lib/utils"
import type { ScheduleItem } from "@/types/schedule"

interface TravelData {
  minutes: number
  mode: TransportMode
  distanceKm: number
  source: "estimated" | "live"
}

export function useTravelTimes(items: ScheduleItem[]) {
  const [liveTravelDataMap, setLiveTravelDataMap] = useState<Map<number, TravelData>>(new Map())

  const estimatedTravelDataMap = useMemo(() => {
    const map = new Map<number, { minutes: number; mode: TransportMode; distanceKm: number }>()
    for (let i = 1; i < items.length; i++) {
      const prev = getAnyPlaceById(items[i - 1].placeId)
      const curr = getAnyPlaceById(items[i].placeId)
      if (prev && curr) {
        map.set(i, estimateTravel(prev.location.lat, prev.location.lng, curr.location.lat, curr.location.lng))
      }
    }
    return map
  }, [items])

  useEffect(() => {
    let cancelled = false

    async function hydrateTravelTimes() {
      if (items.length < 2) {
        setLiveTravelDataMap(new Map())
        return
      }

      const entries = await Promise.all(items.slice(1).map(async (item, offset) => {
        const index = offset + 1
        const prev = getAnyPlaceById(items[index - 1].placeId)
        const curr = getAnyPlaceById(item.placeId)
        if (!prev || !curr) return null

        const travel = await getTravelTime(
          prev.location.lat,
          prev.location.lng,
          curr.location.lat,
          curr.location.lng,
        )

        return [index, travel] as const
      }))

      if (cancelled) return

      setLiveTravelDataMap(new Map(entries.filter((entry): entry is readonly [number, TravelData] => entry !== null)))
    }

    void hydrateTravelTimes()

    return () => {
      cancelled = true
    }
  }, [items])

  const travelDataMap = useMemo(() => {
    if (liveTravelDataMap.size === 0) {
      return new Map(Array.from(estimatedTravelDataMap.entries()).map(([index, travel]) => [index, { ...travel, source: "estimated" as const }]))
    }

    const merged = new Map<number, TravelData>()
    for (const [index, travel] of estimatedTravelDataMap.entries()) {
      merged.set(index, { ...travel, source: "estimated" })
    }
    for (const [index, travel] of liveTravelDataMap.entries()) {
      merged.set(index, travel)
    }
    return merged
  }, [estimatedTravelDataMap, liveTravelDataMap])

  const totalTravelMinutes = useMemo(
    () => Array.from(travelDataMap.values()).reduce((sum, d) => sum + d.minutes, 0),
    [travelDataMap],
  )

  return { travelDataMap, totalTravelMinutes }
}
