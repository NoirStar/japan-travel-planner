import { APIProvider, Map } from "@vis.gl/react-google-maps"
import { useUIStore } from "@/stores/uiStore"
import type { MapCenter } from "@/types/map"
import { MapPin } from "lucide-react"

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string

const darkMapId = "739af084373f96fe" // Google Maps 다크 스타일용 Map ID (Cloud Console에서 생성)
const lightMapId = "e8a1bc81a1a06fc" // Google Maps 라이트 스타일용 Map ID

interface MapViewProps {
  center: MapCenter
  zoom: number
  className?: string
}

function MapFallback() {
  return (
    <div
      className="flex h-full flex-col items-center justify-center gap-3 bg-muted/30 text-muted-foreground"
      data-testid="map-fallback"
    >
      <MapPin className="h-12 w-12 opacity-40" />
      <p className="text-sm font-medium">Google Maps API 키가 설정되지 않았습니다</p>
      <p className="max-w-xs text-center text-xs opacity-70">
        .env 파일에 VITE_GOOGLE_MAPS_API_KEY를 설정해주세요
      </p>
    </div>
  )
}

export function MapView({ center, zoom, className = "" }: MapViewProps) {
  const { isDarkMode } = useUIStore()

  if (!GOOGLE_MAPS_API_KEY) {
    return (
      <div className={`h-full w-full ${className}`}>
        <MapFallback />
      </div>
    )
  }

  return (
    <div className={`h-full w-full ${className}`} data-testid="map-container">
      <APIProvider apiKey={GOOGLE_MAPS_API_KEY}>
        <Map
          defaultCenter={center}
          defaultZoom={zoom}
          mapId={isDarkMode ? darkMapId : lightMapId}
          gestureHandling="greedy"
          disableDefaultUI={false}
          style={{ width: "100%", height: "100%" }}
        />
      </APIProvider>
    </div>
  )
}
