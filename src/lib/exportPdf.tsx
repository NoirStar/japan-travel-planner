/* eslint-disable react-refresh/only-export-components */
import { Document, Page, Text, View, StyleSheet, Font, pdf } from "@react-pdf/renderer"
import type { Trip, Reservation } from "@/types/schedule"
import type { Place } from "@/types/place"
import { CATEGORY_LABELS, type PlaceCategory } from "@/types/place"
import { RESERVATION_LABELS } from "@/types/schedule"
import { getAnyPlaceById } from "@/stores/dynamicPlaceStore"
import { getCityConfig } from "@/data/mapConfig"

// ── 폰트 등록 (Noto Sans KR) ──
// 절대 URL로 변환하여 경로 문제 방지
const FONT_BASE = `${window.location.origin}/fonts`

Font.register({
  family: "NotoSansKR",
  fonts: [
    { src: `${FONT_BASE}/NotoSansKR-Regular.ttf`, fontWeight: 400 },
    { src: `${FONT_BASE}/NotoSansKR-Bold.ttf`, fontWeight: 700 },
  ],
})

// 하이픈 비활성화 (단어 잘림/겹침 방지)
Font.registerHyphenationCallback((word) => [word])

// ── 폰트 프리로드 (한 번만 실행) ──
let _fontReady = false
let _fontPromise: Promise<void> | null = null

async function ensureFontsLoaded(): Promise<void> {
  if (_fontReady) return
  if (_fontPromise) return _fontPromise

  _fontPromise = (async () => {
    try {
      // 폰트 파일을 미리 fetch하여 브라우저 캐시에 적재
      const urls = [
        `${FONT_BASE}/NotoSansKR-Regular.ttf`,
        `${FONT_BASE}/NotoSansKR-Bold.ttf`,
      ]
      const results = await Promise.all(
        urls.map((url) =>
          fetch(url, { cache: "force-cache" }).then((r) => {
            if (!r.ok) throw new Error(`Font fetch failed: ${r.status} ${url}`)
            return r.arrayBuffer()
          }),
        ),
      )
      // 각 폰트가 정상적으로 로드되었는지 확인 (최소 100KB)
      for (let i = 0; i < results.length; i++) {
        if (results[i].byteLength < 100_000) {
          throw new Error(`Font file too small: ${urls[i]} (${results[i].byteLength} bytes)`)
        }
      }
      _fontReady = true
    } catch (e) {
      _fontPromise = null
      throw e
    }
  })()

  return _fontPromise
}

// ── 텍스트 sanitize (Noto Sans KR 미지원 글리프 제거) ──
// BMP 기본 라틴 + 한글 + CJK + 일본어 가나 + 일반 기호만 허용
const SAFE_RE = /[^\u0020-\u007E\u00A0-\u00FF\u2000-\u206F\u2100-\u214F\u2190-\u21FF\u2500-\u257F\u3000-\u303F\u3040-\u309F\u30A0-\u30FF\u3400-\u4DBF\u4E00-\u9FFF\uAC00-\uD7AF\uF900-\uFAFF\uFE30-\uFE4F\uFF00-\uFFEF\n\r\t]/g

function sanitize(text: string | undefined | null): string {
  if (!text) return ""
  return text.replace(SAFE_RE, "")
}

// ── 스타일 ──
const c = {
  primary: "#E8786A",
  primaryLight: "#FFF0EE",
  text: "#1A1A1A",
  muted: "#6B7280",
  border: "#E5E7EB",
  white: "#FFFFFF",
  bg: "#FAFAF8",
  badge: "#F3F4F6",
}

const s = StyleSheet.create({
  page: { fontFamily: "NotoSansKR", fontSize: 9, color: c.text, backgroundColor: c.bg, paddingTop: 36, paddingBottom: 48, paddingHorizontal: 36 },
  // Header
  header: { marginBottom: 20, borderBottom: `2 solid ${c.primary}`, paddingBottom: 12 },
  title: { fontSize: 20, fontWeight: 700, color: c.primary, marginBottom: 4 },
  subtitle: { fontSize: 10, color: c.muted },
  meta: { flexDirection: "row", gap: 16, marginTop: 6 },
  metaItem: { fontSize: 8, color: c.muted },
  // Day
  daySection: { marginBottom: 14 },
  dayHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8, paddingBottom: 4, borderBottom: `1 solid ${c.border}` },
  dayBadge: { backgroundColor: c.primary, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  dayBadgeText: { fontSize: 9, fontWeight: 700, color: c.white },
  dayDate: { fontSize: 8, color: c.muted },
  dayCount: { fontSize: 8, color: c.muted, marginLeft: "auto" },
  // Place row
  placeRow: { flexDirection: "row", alignItems: "flex-start", paddingVertical: 5, paddingHorizontal: 6, borderBottom: `0.5 solid ${c.border}` },
  placeIndex: { width: 16, fontSize: 8, fontWeight: 700, color: c.primary, paddingTop: 1 },
  placeTime: { width: 36, fontSize: 8, color: c.muted, paddingTop: 1 },
  placeBody: { flex: 1 },
  placeName: { fontSize: 10, fontWeight: 700, marginBottom: 1 },
  placeDetail: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  placeCategory: { fontSize: 7, color: c.primary, backgroundColor: c.primaryLight, borderRadius: 3, paddingHorizontal: 4, paddingVertical: 1 },
  placeRating: { fontSize: 7, color: c.muted },
  placeAddress: { fontSize: 7, color: c.muted, marginTop: 2 },
  placeMemo: { fontSize: 7, color: c.text, backgroundColor: c.badge, borderRadius: 3, paddingHorizontal: 4, paddingVertical: 2, marginTop: 3 },
  // Empty day
  emptyDay: { paddingVertical: 8, paddingHorizontal: 6 },
  emptyText: { fontSize: 8, color: c.muted, fontStyle: "italic" },
  // Footer
  footer: { position: "absolute", bottom: 20, left: 36, right: 36, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  footerText: { fontSize: 7, color: c.muted },
  // Summary
  summaryBox: { flexDirection: "row", gap: 12, marginBottom: 16, padding: 10, backgroundColor: c.white, borderRadius: 8, border: `1 solid ${c.border}` },
  summaryItem: { alignItems: "center" },
  summaryValue: { fontSize: 14, fontWeight: 700, color: c.primary },
  summaryLabel: { fontSize: 7, color: c.muted, marginTop: 2 },
  // Reservation
  rsvRow: { flexDirection: "row" as const, alignItems: "flex-start" as const, paddingVertical: 4, paddingHorizontal: 6, backgroundColor: "#F0F9FF", borderRadius: 4, marginBottom: 3 },
  rsvIcon: { width: 16, fontSize: 8, fontWeight: 700, color: "#0284C7", paddingTop: 1 },
  rsvBody: { flex: 1 },
  rsvTitle: { fontSize: 9, fontWeight: 700, marginBottom: 1 },
  rsvDetail: { fontSize: 7, color: c.muted },
  rsvBadge: { fontSize: 6, color: "#0284C7", backgroundColor: "#E0F2FE", borderRadius: 3, paddingHorizontal: 3, paddingVertical: 1 },
  rsvConfirmed: { fontSize: 6, color: "#059669", backgroundColor: "#D1FAE5", borderRadius: 3, paddingHorizontal: 3, paddingVertical: 1 },
})

// ── 포맷 헬퍼 ──
function formatDate(iso?: string) {
  if (!iso) return ""
  const d = new Date(iso)
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`
}

function getDayOfWeek(iso?: string) {
  if (!iso) return ""
  const days = ["일", "월", "화", "수", "목", "금", "토"]
  return days[new Date(iso).getDay()]
}

// ── PDF Document ──
interface TripPdfProps {
  trip: Trip
}

const RSV_ICONS: Record<string, string> = {
  flight: "AIR",
  train: "TRN",
  bus: "BUS",
  accommodation: "HTL",
}

function getDayDate(trip: Trip, dayNumber: number): string | undefined {
  if (!trip.startDate) return undefined
  const start = new Date(trip.startDate)
  start.setDate(start.getDate() + dayNumber - 1)
  return start.toISOString().slice(0, 10)
}

function getReservationsForDay(reservations: Reservation[], dayDate: string | undefined, type: "transport" | "accommodation"): Reservation[] {
  if (!dayDate) return []
  return reservations.filter((r) => {
    if (type === "transport") {
      return r.type !== "accommodation" && r.date === dayDate
    }
    // accommodation: 체크인 날 또는 숙박 기간 중
    if (r.type !== "accommodation") return false
    if (r.date === dayDate) return true
    if (r.endDate && r.date < dayDate && r.endDate > dayDate) return true
    return false
  })
}

function TripPdfDocument({ trip }: TripPdfProps) {
  const cityConfig = getCityConfig(trip.cityId)
  const totalPlaces = trip.days.reduce((sum, d) => sum + d.items.length, 0)
  const daysWithPlaces = trip.days.filter((d) => d.items.length > 0).length

  return (
    <Document title={sanitize(trip.title)} author="타비톡" subject="여행 일정표">
      <Page size="A4" style={s.page}>
        {/* Header */}
        <View style={s.header}>
          <Text style={s.title}>{sanitize(trip.title)}</Text>
          <Text style={s.subtitle}>{cityConfig.name} ({cityConfig.nameEn}) 여행 일정표</Text>
          <View style={s.meta}>
            {trip.startDate && trip.endDate && (
              <Text style={s.metaItem}>{formatDate(trip.startDate)} ~ {formatDate(trip.endDate)}</Text>
            )}
            <Text style={s.metaItem}>{totalPlaces}개 장소 | {trip.days.length}일</Text>
          </View>
        </View>

        {/* Summary */}
        <View style={s.summaryBox}>
          <View style={s.summaryItem}>
            <Text style={s.summaryValue}>{trip.days.length}</Text>
            <Text style={s.summaryLabel}>전체 일수</Text>
          </View>
          <View style={s.summaryItem}>
            <Text style={s.summaryValue}>{totalPlaces}</Text>
            <Text style={s.summaryLabel}>총 장소</Text>
          </View>
          <View style={s.summaryItem}>
            <Text style={s.summaryValue}>{daysWithPlaces}/{trip.days.length}</Text>
            <Text style={s.summaryLabel}>계획 완료</Text>
          </View>
        </View>

        {/* Days */}
        {trip.days.map((day) => {
          const places = day.items
            .map((item) => ({ item, place: getAnyPlaceById(item.placeId) }))
            .filter((r): r is { item: typeof r.item; place: Place } => !!r.place)

          const dayDate = day.date ?? getDayDate(trip, day.dayNumber)
          const reservations = trip.reservations ?? []
          const transportRsvs = getReservationsForDay(reservations, dayDate, "transport")
          const accomRsvs = getReservationsForDay(reservations, dayDate, "accommodation")

          return (
            <View key={day.id} style={s.daySection}>
              <View style={s.dayHeader}>
                <View style={s.dayBadge}>
                  <Text style={s.dayBadgeText}>Day {day.dayNumber}</Text>
                </View>
                {day.date && (
                  <Text style={s.dayDate}>{formatDate(day.date)} ({getDayOfWeek(day.date)})</Text>
                )}
                <Text style={s.dayCount}>{places.length}개 장소</Text>
              </View>

              {/* 교통 예약 */}
              {transportRsvs.map((r) => (
                <View key={r.id} style={s.rsvRow} wrap={false}>
                  <Text style={s.rsvIcon}>{RSV_ICONS[r.type] ?? "ETC"}</Text>
                  <View style={s.rsvBody}>
                    <Text style={s.rsvTitle}>{sanitize(r.title)}</Text>
                    <View style={{ flexDirection: "row", gap: 6, flexWrap: "wrap" }}>
                      <Text style={s.rsvBadge}>{RESERVATION_LABELS[r.type]}</Text>
                      {r.confirmed && <Text style={s.rsvConfirmed}>확정</Text>}
                    </View>
                    {(r.departureLocation || r.arrivalLocation) && (
                      <Text style={s.rsvDetail}>{sanitize(r.departureLocation)}{" -> "}{sanitize(r.arrivalLocation)}</Text>
                    )}
                    {(r.startTime || r.endTime) && (
                      <Text style={s.rsvDetail}>{r.startTime ?? ""}{r.endTime ? ` -> ${r.endTime}` : ""}</Text>
                    )}
                    {r.bookingReference && <Text style={s.rsvDetail}>예약번호: {sanitize(r.bookingReference)}</Text>}
                  </View>
                </View>
              ))}

              {places.length === 0 && transportRsvs.length === 0 && accomRsvs.length === 0 ? (
                <View style={s.emptyDay}>
                  <Text style={s.emptyText}>자유 일정</Text>
                </View>
              ) : (
                places.map(({ item, place }, idx) => (
                  <View key={item.id} style={s.placeRow} wrap={false}>
                    <Text style={s.placeIndex}>{idx + 1}</Text>
                    <Text style={s.placeTime}>{item.startTime ?? ""}</Text>
                    <View style={s.placeBody}>
                      <Text style={s.placeName}>{sanitize(place.name)}</Text>
                      <View style={s.placeDetail}>
                        <Text style={s.placeCategory}>{CATEGORY_LABELS[place.category as PlaceCategory] ?? sanitize(place.category)}</Text>
                        {place.rating && <Text style={s.placeRating}>{place.rating}</Text>}
                      </View>
                      {place.address && <Text style={s.placeAddress}>{sanitize(place.address)}</Text>}
                      {item.memo && <Text style={s.placeMemo}>{sanitize(item.memo)}</Text>}
                    </View>
                  </View>
                ))
              )}

              {/* 숙박 예약 */}
              {accomRsvs.map((r) => (
                <View key={r.id} style={{ ...s.rsvRow, backgroundColor: "#F5F3FF" }} wrap={false}>
                  <Text style={{ ...s.rsvIcon, color: "#7C3AED" }}>HTL</Text>
                  <View style={s.rsvBody}>
                    <Text style={s.rsvTitle}>{sanitize(r.title)}</Text>
                    <View style={{ flexDirection: "row", gap: 6, flexWrap: "wrap" }}>
                      <Text style={{ ...s.rsvBadge, color: "#7C3AED", backgroundColor: "#EDE9FE" }}>숙박</Text>
                      {r.confirmed && <Text style={s.rsvConfirmed}>확정</Text>}
                    </View>
                    {(r.startTime || r.endTime) && (
                      <Text style={s.rsvDetail}>
                        {r.startTime ? `체크인 ${r.startTime}` : ""}{r.endTime ? ` / 체크아웃 ${r.endTime}` : ""}
                      </Text>
                    )}
                    {r.endDate && (
                      <Text style={s.rsvDetail}>
                        {formatDate(r.date)} ~ {formatDate(r.endDate)}
                      </Text>
                    )}
                    {r.bookingReference && <Text style={s.rsvDetail}>예약번호: {sanitize(r.bookingReference)}</Text>}
                  </View>
                </View>
              ))}
            </View>
          )
        })}

        {/* Footer */}
        <View style={s.footer} fixed>
          <Text style={s.footerText}>tabittok - tabittok.vercel.app</Text>
          <Text style={s.footerText} render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} />
        </View>
      </Page>
    </Document>
  )
}

// ── 다운로드 함수 ──
export interface PdfResult {
  ok: boolean
  error?: string
}

export async function downloadTripPdf(trip: Trip): Promise<PdfResult> {
  // 0) 폰트 프리로드
  try {
    await ensureFontsLoaded()
  } catch (e) {
    console.error("PDF 폰트 프리로드 실패:", e)
    // 폰트 캐시 초기화 후 재시도
    Font.clear()
    Font.register({
      family: "NotoSansKR",
      fonts: [
        { src: `${FONT_BASE}/NotoSansKR-Regular.ttf`, fontWeight: 400 },
        { src: `${FONT_BASE}/NotoSansKR-Bold.ttf`, fontWeight: 700 },
      ],
    })
    _fontReady = false
    _fontPromise = null
    try {
      await ensureFontsLoaded()
    } catch {
      return { ok: false, error: "폰트 로드에 실패했습니다. 네트워크 연결을 확인하고 새로고침 후 다시 시도해 주세요." }
    }
  }

  // 1) PDF 렌더
  let blob: Blob
  try {
    blob = await pdf(<TripPdfDocument trip={trip} />).toBlob()
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    console.error("PDF 렌더 실패:", e)
    if (/font/i.test(msg) || /fetch/i.test(msg)) {
      // 폰트 관련 에러 시 캐시 무효화
      _fontReady = false
      _fontPromise = null
      return { ok: false, error: "폰트 로드에 실패했습니다. 새로고침 후 다시 시도해 주세요." }
    }
    return { ok: false, error: `PDF 렌더 실패: ${msg}` }
  }

  // 2) Blob → 다운로드
  try {
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${sanitize(trip.title).trim() || "여행일정"}.pdf`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    return { ok: true }
  } catch (e) {
    console.error("PDF 다운로드 실패:", e)
    return { ok: false, error: "파일 다운로드에 실패했습니다." }
  }
}
