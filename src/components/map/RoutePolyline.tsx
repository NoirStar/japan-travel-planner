import { useMap, useMapsLibrary } from "@vis.gl/react-google-maps"
import { useEffect, useRef } from "react"
import type { Place } from "@/types/place"

/** Day별 경로 색상. Day 번호(0-based index)에 따라 색상을 순환 */
const DAY_COLORS = [
  "#2D5F7A", // indigo (theme)
  "#B55349", // primary (theme)
  "#5C8A6F", // success (theme)
  "#C08C3E", // warning (theme)
  "#4C7C95", // indigo-light (theme)
  "#C9857B", // sakura (theme)
  "#6C645D", // muted-foreground (theme)
]

interface RoutePolylineProps {
  places: Place[]
  /** Day 인덱스 (0-based) — 색상 결정용 */
  dayIndex?: number
  /** 직접 색상 지정 (dayIndex보다 우선) */
  color?: string
}

export function RoutePolyline({ places, dayIndex = 0, color }: RoutePolylineProps) {
  const map = useMap()
  const coreLib = useMapsLibrary("core")
  const polylineRef = useRef<google.maps.Polyline | null>(null)

  const strokeColor = color ?? DAY_COLORS[dayIndex % DAY_COLORS.length]

  useEffect(() => {
    if (!map || !coreLib || places.length < 2) {
      polylineRef.current?.setMap(null)
      polylineRef.current = null
      return
    }

    const path = places.map(
      (p) => new google.maps.LatLng(p.location.lat, p.location.lng),
    )

    if (polylineRef.current) {
      polylineRef.current.setPath(path)
      polylineRef.current.setOptions({ strokeColor })
    } else {
      polylineRef.current = new google.maps.Polyline({
        path,
        geodesic: true,
        strokeColor,
        strokeOpacity: 0.8,
        strokeWeight: 3,
        map,
      })
    }

    return () => {
      polylineRef.current?.setMap(null)
      polylineRef.current = null
    }
  }, [map, coreLib, places, strokeColor])

  return null
}
