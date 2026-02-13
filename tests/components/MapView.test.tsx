import { describe, it, expect, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import { MapView } from "@/components/map/MapView"

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
  it("API 키 미설정 시 fallback이 표시된다", () => {
    // import.meta.env.VITE_GOOGLE_MAPS_API_KEY가 undefined이므로 fallback 렌더
    render(
      <MapView center={{ lat: 35.6762, lng: 139.6503 }} zoom={12} />,
    )
    expect(screen.getByTestId("map-fallback")).toBeInTheDocument()
    expect(screen.getByText(/API 키가 설정되지 않았습니다/)).toBeInTheDocument()
  })

  it("fallback에 안내 메시지가 표시된다", () => {
    render(
      <MapView center={{ lat: 35.6762, lng: 139.6503 }} zoom={12} />,
    )
    expect(
      screen.getByText(/VITE_GOOGLE_MAPS_API_KEY를 설정해주세요/),
    ).toBeInTheDocument()
  })
})
