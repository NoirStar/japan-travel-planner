import { useMap, useMapsLibrary } from "@vis.gl/react-google-maps"
import { useEffect, useRef } from "react"
import type { Place } from "@/types/place"

interface RoutePolylineProps {
  places: Place[]
}

export function RoutePolyline({ places }: RoutePolylineProps) {
  const map = useMap()
  const coreLib = useMapsLibrary("core")
  const polylineRef = useRef<google.maps.Polyline | null>(null)

  useEffect(() => {
    if (!map || !coreLib || places.length < 2) {
      // 장소 2개 미만이면 폴리라인 제거
      polylineRef.current?.setMap(null)
      polylineRef.current = null
      return
    }

    const path = places.map(
      (p) => new google.maps.LatLng(p.location.lat, p.location.lng),
    )

    if (polylineRef.current) {
      polylineRef.current.setPath(path)
    } else {
      polylineRef.current = new google.maps.Polyline({
        path,
        geodesic: true,
        strokeColor: "#6366f1", // indigo-500
        strokeOpacity: 0.8,
        strokeWeight: 3,
        map,
      })
    }

    return () => {
      polylineRef.current?.setMap(null)
      polylineRef.current = null
    }
  }, [map, coreLib, places])

  return null
}
