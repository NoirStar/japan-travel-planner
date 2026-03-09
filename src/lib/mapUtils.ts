/** 지도 중심에서 가시 영역 반경 계산 (Haversine) */
export function getVisibleRadius(map: google.maps.Map): { lat: number; lng: number; radius: number } | null {
  const center = map.getCenter()
  if (!center) return null
  const bounds = map.getBounds()
  let radius = 5000
  if (bounds) {
    const ne = bounds.getNorthEast()
    const toRad = (d: number) => d * Math.PI / 180
    const lat1 = toRad(center.lat())
    const lat2 = toRad(ne.lat())
    const dLat = toRad(ne.lat() - center.lat())
    const dLng = toRad(ne.lng() - center.lng())
    const a = Math.sin(dLat/2)**2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng/2)**2
    const dist = 6371000 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
    radius = Math.max(300, Math.min(Math.round(dist * 0.5), 50000))
  }
  return { lat: center.lat(), lng: center.lng(), radius }
}
