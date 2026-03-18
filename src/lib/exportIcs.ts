import type { Trip } from "@/types/schedule"
import { getAnyPlaceById } from "@/stores/dynamicPlaceStore"
import { RESERVATION_LABELS } from "@/types/schedule"

/** ICS에 필요한 UTC 타임스탬프 생성 (JST = UTC+9) */
function toIcsDate(dateStr: string, time?: string): string {
  // dateStr = "2026-03-15", time = "09:00"
  const [y, m, d] = dateStr.split("-").map(Number)
  if (time) {
    const [hh, mm] = time.split(":").map(Number)
    // JST → UTC: -9h
    const utc = new Date(Date.UTC(y, m - 1, d, hh - 9, mm))
    return formatIcsUtc(utc)
  }
  // 종일 이벤트
  return `${y}${String(m).padStart(2, "0")}${String(d).padStart(2, "0")}`
}

function formatIcsUtc(d: Date): string {
  const y = d.getUTCFullYear()
  const m = String(d.getUTCMonth() + 1).padStart(2, "0")
  const day = String(d.getUTCDate()).padStart(2, "0")
  const hh = String(d.getUTCHours()).padStart(2, "0")
  const mm = String(d.getUTCMinutes()).padStart(2, "0")
  return `${y}${m}${day}T${hh}${mm}00Z`
}

function escapeIcs(s: string): string {
  return s.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n")
}

function uid(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}@japan-travel-planner`
}

export function generateTripIcs(trip: Trip): string {
  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//JapanTravelPlanner//JP//EN",
    `X-WR-CALNAME:${escapeIcs(trip.title)}`,
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
  ]

  const now = formatIcsUtc(new Date())

  // 1. 일정 아이템 → VEVENT
  for (const day of trip.days) {
    if (!day.date) continue

    for (const item of day.items) {
      const place = getAnyPlaceById(item.placeId)
      const name = place?.name ?? item.placeName ?? item.placeId

      lines.push("BEGIN:VEVENT")
      lines.push(`UID:${uid()}`)
      lines.push(`DTSTAMP:${now}`)

      if (item.startTime) {
        const dtStart = toIcsDate(day.date, item.startTime)
        lines.push(`DTSTART:${dtStart}`)
        // 기본 1시간 체류
        const [hh, mm] = item.startTime.split(":").map(Number)
        const endD = new Date(Date.UTC(
          Number(day.date.split("-")[0]),
          Number(day.date.split("-")[1]) - 1,
          Number(day.date.split("-")[2]),
          hh - 9 + 1, mm,
        ))
        lines.push(`DTEND:${formatIcsUtc(endD)}`)
      } else {
        // 종일 이벤트
        lines.push(`DTSTART;VALUE=DATE:${toIcsDate(day.date)}`)
        const next = new Date(day.date + "T00:00:00")
        next.setDate(next.getDate() + 1)
        const ny = next.getFullYear()
        const nm = String(next.getMonth() + 1).padStart(2, "0")
        const nd = String(next.getDate()).padStart(2, "0")
        lines.push(`DTEND;VALUE=DATE:${ny}${nm}${nd}`)
      }

      lines.push(`SUMMARY:${escapeIcs(name)}`)
      if (place?.address) {
        lines.push(`LOCATION:${escapeIcs(place.address)}`)
      }
      if (item.memo) {
        lines.push(`DESCRIPTION:${escapeIcs(item.memo)}`)
      }
      lines.push("END:VEVENT")
    }
  }

  // 2. 예약 → VEVENT
  for (const rsv of trip.reservations ?? []) {
    const label = RESERVATION_LABELS[rsv.type]
    const summary = `[${label}] ${rsv.title}`

    lines.push("BEGIN:VEVENT")
    lines.push(`UID:${uid()}`)
    lines.push(`DTSTAMP:${now}`)

    if (rsv.startTime) {
      lines.push(`DTSTART:${toIcsDate(rsv.date, rsv.startTime)}`)
      if (rsv.endTime) {
        const endDate = rsv.endDate ?? rsv.date
        lines.push(`DTEND:${toIcsDate(endDate, rsv.endTime)}`)
      }
    } else {
      lines.push(`DTSTART;VALUE=DATE:${toIcsDate(rsv.date)}`)
      if (rsv.endDate) {
        const next = new Date(rsv.endDate + "T00:00:00")
        next.setDate(next.getDate() + 1)
        const ny = next.getFullYear()
        const nm = String(next.getMonth() + 1).padStart(2, "0")
        const nd = String(next.getDate()).padStart(2, "0")
        lines.push(`DTEND;VALUE=DATE:${ny}${nm}${nd}`)
      }
    }

    lines.push(`SUMMARY:${escapeIcs(summary)}`)

    const descParts: string[] = []
    if (rsv.departureLocation && rsv.arrivalLocation) {
      descParts.push(`${rsv.departureLocation} → ${rsv.arrivalLocation}`)
    }
    if (rsv.bookingReference) descParts.push(`예약번호: ${rsv.bookingReference}`)
    if (rsv.provider) descParts.push(`제공: ${rsv.provider}`)
    if (rsv.memo) descParts.push(rsv.memo)
    if (descParts.length > 0) {
      lines.push(`DESCRIPTION:${escapeIcs(descParts.join("\\n"))}`)
    }

    lines.push("END:VEVENT")
  }

  lines.push("END:VCALENDAR")
  return lines.join("\r\n")
}

export function downloadTripIcs(trip: Trip): void {
  const ics = generateTripIcs(trip)
  const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = `${trip.title.replace(/[^a-zA-Z0-9가-힣]/g, "_")}.ics`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
