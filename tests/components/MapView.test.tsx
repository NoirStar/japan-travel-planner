import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen } from "@testing-library/react"

// @vis.gl/react-google-maps 모킹
vi.mock("@vis.gl/react-google-maps", () => ({
  APIProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="api-provider">{children}</div>
  ),
  Map: (props: Record<string, unknown>) => (
    <div
      data-testid="google-map"
      data-center={JSON.stringify(props.defaultCenter)}
      data-zoom={props.defaultZoom}
    />
  ),
}))

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
})
