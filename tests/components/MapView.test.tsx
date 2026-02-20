import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen } from "@testing-library/react"
import type { Place } from "@/types/place"
import { PlaceCategory } from "@/types/place"

// @vis.gl/react-google-maps 모킹
vi.mock("@vis.gl/react-google-maps", () => ({
  APIProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="api-provider">{children}</div>
  ),
  Map: ({ children, ...props }: { children?: React.ReactNode } & Record<string, unknown>) => (
    <div
      data-testid="google-map"
      data-center={JSON.stringify(props.defaultCenter)}
      data-zoom={props.defaultZoom}
    >
      {children}
    </div>
  ),
  Marker: ({ title, label }: { title?: string; label?: { text: string } }) => (
    <div data-testid={`map-marker-${title}`} data-label={label?.text}>{label?.text}</div>
  ),
  AdvancedMarker: ({ children, title }: { children?: React.ReactNode; title?: string }) => (
    <div data-testid={`advanced-marker-${title}`}>{children}</div>
  ),
  InfoWindow: ({ children }: { children?: React.ReactNode }) => (
    <div data-testid="info-window">{children}</div>
  ),
  useMarkerRef: () => [null, null],
  useAdvancedMarkerRef: () => [null, null],
  useMap: () => null,
  useMapsLibrary: () => null,
}))

const mockPlace = (id: string, name: string, lat: number, lng: number): Place => ({
  id,
  name,
  nameEn: name,
  category: PlaceCategory.ATTRACTION,
  cityId: "tokyo",
  location: { lat, lng },
  rating: 4.5,
  description: "test",
})

describe("MapView", () => {
  beforeEach(() => {
    vi.resetModules()
  })

  it("API 키 미설정 시 fallback이 표시된다", async () => {
    // env에서 API 키 제거하여 fallback 트리거
    const originalKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY
    import.meta.env.VITE_GOOGLE_MAPS_API_KEY = ""
    const { MapView } = await import("@/components/map/MapView")

    render(
      <MapView center={{ lat: 35.6762, lng: 139.6503 }} zoom={12} />,
    )
    expect(screen.getByTestId("map-fallback")).toBeInTheDocument()
    expect(screen.getByText(/API 키가 설정되지 않았습니다/)).toBeInTheDocument()

    import.meta.env.VITE_GOOGLE_MAPS_API_KEY = originalKey
  })

  it("fallback에 안내 메시지가 표시된다", async () => {
    const originalKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY
    import.meta.env.VITE_GOOGLE_MAPS_API_KEY = ""
    const { MapView } = await import("@/components/map/MapView")

    render(
      <MapView center={{ lat: 35.6762, lng: 139.6503 }} zoom={12} />,
    )
    expect(
      screen.getByText(/VITE_GOOGLE_MAPS_API_KEY를 설정해주세요/),
    ).toBeInTheDocument()

    import.meta.env.VITE_GOOGLE_MAPS_API_KEY = originalKey
  })

  it("API 키가 있으면 지도가 렌더링된다", async () => {
    const originalKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY
    import.meta.env.VITE_GOOGLE_MAPS_API_KEY = "test-api-key"
    const { MapView } = await import("@/components/map/MapView")

    render(
      <MapView center={{ lat: 35.6762, lng: 139.6503 }} zoom={12} />,
    )
    expect(screen.getByTestId("map-container")).toBeInTheDocument()
    expect(screen.getByTestId("google-map")).toBeInTheDocument()

    import.meta.env.VITE_GOOGLE_MAPS_API_KEY = originalKey
  })

  it("places가 전달되면 마커가 렌더링된다", async () => {
    const originalKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY
    import.meta.env.VITE_GOOGLE_MAPS_API_KEY = "test-api-key"
    const { MapView } = await import("@/components/map/MapView")
    const places = [
      mockPlace("p1", "센소지", 35.7148, 139.7967),
      mockPlace("p2", "스카이트리", 35.7101, 139.8107),
    ]

    render(
      <MapView center={{ lat: 35.6762, lng: 139.6503 }} zoom={12} places={places} />,
    )
    expect(screen.getByTestId("map-marker-센소지")).toBeInTheDocument()
    expect(screen.getByTestId("map-marker-스카이트리")).toBeInTheDocument()
    expect(screen.getByText("1")).toBeInTheDocument()
    expect(screen.getByText("2")).toBeInTheDocument()

    import.meta.env.VITE_GOOGLE_MAPS_API_KEY = originalKey
  })

  it("places가 비어있으면 마커가 없다", async () => {
    const originalKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY
    import.meta.env.VITE_GOOGLE_MAPS_API_KEY = "test-api-key"
    const { MapView } = await import("@/components/map/MapView")

    render(
      <MapView center={{ lat: 35.6762, lng: 139.6503 }} zoom={12} places={[]} />,
    )
    expect(screen.queryByTestId(/^map-marker-/)).not.toBeInTheDocument()

    import.meta.env.VITE_GOOGLE_MAPS_API_KEY = originalKey
  })
})
