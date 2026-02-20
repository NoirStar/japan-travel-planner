import { useEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { useMap } from "@vis.gl/react-google-maps"

interface CustomOverlayProps {
  position: { lat: number; lng: number }
  children: React.ReactNode
  zIndex?: number
  /** 마커 꼬리 끝이 위치에 맞도록 오프셋 (px) - 기본: 컨텐츠 중앙 하단 */
  offsetY?: number
}

/**
 * Google Maps OverlayView를 React 컴포넌트로 구현.
 * AdvancedMarker 없이 커스텀 HTML을 지도 위에 렌더링.
 */
export function CustomOverlay({ position, children, zIndex = 100, offsetY = 0 }: CustomOverlayProps) {
  const map = useMap()
  const overlayRef = useRef<google.maps.OverlayView | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (!map) return

    // 컨테이너 div 생성
    const container = document.createElement("div")
    container.style.position = "absolute"
    container.style.zIndex = String(zIndex)
    containerRef.current = container

    // OverlayView 생성
    const overlay = new google.maps.OverlayView()

    overlay.onAdd = function () {
      const panes = this.getPanes()
      panes?.overlayMouseTarget.appendChild(container)
      setReady(true)
    }

    overlay.draw = function () {
      const projection = this.getProjection()
      if (!projection) return

      const pos = projection.fromLatLngToDivPixel(
        new google.maps.LatLng(position.lat, position.lng),
      )

      if (pos) {
        container.style.left = `${pos.x}px`
        container.style.top = `${pos.y + offsetY}px`
        container.style.transform = "translate(-50%, -100%)"
      }
    }

    overlay.onRemove = function () {
      container.remove()
      setReady(false)
    }

    overlay.setMap(map)
    overlayRef.current = overlay

    return () => {
      overlay.setMap(null)
      overlayRef.current = null
      containerRef.current = null
    }
  }, [map, position.lat, position.lng, zIndex, offsetY])

  // position 변경 시 redraw
  useEffect(() => {
    overlayRef.current?.draw()
  }, [position])

  if (!ready || !containerRef.current) return null
  return createPortal(children, containerRef.current)
}
