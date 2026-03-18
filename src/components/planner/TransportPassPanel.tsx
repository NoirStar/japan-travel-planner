import { useMemo } from "react"
import { X, TrainFront, Check, Minus, TrendingDown } from "lucide-react"
import { useScheduleStore } from "@/stores/scheduleStore"
import { TRANSPORT_PASSES, getIntercityCost, type TransportPass } from "@/data/transportPasses"

interface TransportPassPanelProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  tripId: string
}

interface PassRecommendation {
  pass: TransportPass
  /** 해당 패스 없이 예상 교통비 */
  estimatedCostWithout: number
  /** 패스 가격 */
  passCost: number
  /** 절약 금액 (양수면 이득) */
  savings: number
  /** 패스가 유리한지 */
  recommended: boolean
}

export function TransportPassPanel({ open, onOpenChange, tripId }: TransportPassPanelProps) {
  const trip = useScheduleStore((s) => s.trips.find((t) => t.id === tripId))

  const { transportTotal, reservationTransport, recommendations, tripCities, tripDays } = useMemo(() => {
    if (!trip) return { transportTotal: 0, reservationTransport: 0, recommendations: [], tripCities: [], tripDays: 0 }

    // 여행 일수
    const days = trip.days.length

    // 여행 도시 목록
    const cities = [trip.cityId, ...(trip.cities ?? [])].filter(Boolean)

    // 일정 아이템의 교통비 합산
    let itemTransport = 0
    for (const day of trip.days) {
      for (const item of day.items) {
        if (item.costCategory === "transport" && item.cost && item.cost > 0) {
          itemTransport += item.cost
        }
      }
    }

    // 예약(기차/버스)의 교통비 합산
    let rsvTransport = 0
    for (const rsv of trip.reservations ?? []) {
      if ((rsv.type === "train" || rsv.type === "bus") && rsv.cost && rsv.cost > 0) {
        rsvTransport += rsv.cost
      }
    }

    const total = itemTransport + rsvTransport

    // 도시 간 이동비 추정
    let intercityTotal = 0
    for (let i = 0; i < cities.length - 1; i++) {
      const cost = getIntercityCost(cities[i], cities[i + 1])
      if (cost) intercityTotal += cost * 2 // 왕복 추정
    }

    // 패스 추천
    const recs: PassRecommendation[] = []
    for (const pass of TRANSPORT_PASSES) {
      // 도시 필터: 전국 패스이거나 여행 도시에 해당하는 패스
      const isRelevant =
        pass.cityIds.length === 0
          ? cities.length >= 2 // 전국 패스는 다중 도시일 때만
          : pass.cityIds.some((c) => cities.includes(c))

      if (!isRelevant) continue

      // 패스 기간이 여행 일수 이하
      if (pass.days > days) continue

      let estimated: number
      if (pass.cityIds.length === 0) {
        // 전국 패스: 도시 간 이동비 기반
        estimated = intercityTotal
      } else {
        // 도시별 패스: 해당 도시 일수 × 일일 교통비 추정
        const cityDays = Math.min(days, pass.days)
        const dailyTransport = days > 0 ? total / days : 0
        // 일일 교통비가 없으면 도시별 기본값 추정 (1일 ¥1000)
        estimated = cityDays * (dailyTransport > 0 ? dailyTransport : 1000)
      }

      const savings = estimated - pass.price

      recs.push({
        pass,
        estimatedCostWithout: Math.round(estimated),
        passCost: pass.price,
        savings: Math.round(savings),
        recommended: savings > 0,
      })
    }

    // 추천순 정렬: 절약 금액 큰 것 우선
    recs.sort((a, b) => b.savings - a.savings)

    return {
      transportTotal: total,
      reservationTransport: rsvTransport,
      recommendations: recs,
      tripCities: cities,
      tripDays: days,
    }
  }, [trip])

  if (!open || !trip) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <div className="absolute inset-0 bg-black/40" onClick={() => onOpenChange(false)} />
      <div className="relative flex max-h-[80vh] w-full max-w-md flex-col rounded-t-2xl bg-background shadow-xl sm:rounded-2xl">
        {/* 헤더 */}
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <div className="flex items-center gap-2">
            <TrainFront className="h-4 w-4 text-emerald-500" />
            <span className="text-sm font-bold">교통 패스 계산기</span>
          </div>
          <button
            onClick={() => onOpenChange(false)}
            aria-label="닫기"
            className="rounded-full p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* 요약 */}
        <div className="border-b border-border px-4 py-3">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">현재 교통비 합계</span>
            <span className="font-bold text-foreground">¥{transportTotal.toLocaleString()}</span>
          </div>
          <div className="mt-1 flex items-center justify-between text-[10px] text-muted-foreground">
            <span>여행 기간 {tripDays}일 · 도시 {tripCities.length}곳</span>
            {reservationTransport > 0 && (
              <span>예약 교통비 ¥{reservationTransport.toLocaleString()} 포함</span>
            )}
          </div>
        </div>

        {/* 패스 추천 목록 */}
        <div className="flex-1 overflow-y-auto px-4 py-3">
          <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
            <TrendingDown className="h-3.5 w-3.5" />
            패스 추천
          </div>

          {recommendations.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-10 text-center">
              <TrainFront className="h-8 w-8 text-muted-foreground/30" />
              <p className="text-xs text-muted-foreground">
                여행 일정에 맞는 교통 패스가 없습니다<br />
                도시나 일수를 추가하면 추천이 나타납니다
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {recommendations.map(({ pass, estimatedCostWithout, passCost, savings, recommended }) => (
                <div
                  key={pass.id}
                  className={`rounded-xl border p-3 transition-colors ${
                    recommended ? "border-emerald-500/30 bg-emerald-50/50 dark:bg-emerald-950/20" : "border-border bg-card"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-1.5">
                        {recommended ? (
                          <Check className="h-3.5 w-3.5 text-emerald-500" />
                        ) : (
                          <Minus className="h-3.5 w-3.5 text-muted-foreground" />
                        )}
                        <span className="text-xs font-bold">{pass.name}</span>
                      </div>
                      <p className="mt-0.5 pl-5 text-[10px] text-muted-foreground">{pass.description}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-bold">¥{passCost.toLocaleString()}</div>
                      <div className="text-[10px] text-muted-foreground">{pass.days}일</div>
                    </div>
                  </div>
                  <div className="mt-2 flex items-center justify-between border-t border-border/50 pt-2 text-[10px]">
                    <span className="text-muted-foreground">
                      패스 없이 예상 ¥{estimatedCostWithout.toLocaleString()}
                    </span>
                    <span className={recommended ? "font-bold text-emerald-600 dark:text-emerald-400" : "text-muted-foreground"}>
                      {savings > 0 ? `¥${savings.toLocaleString()} 절약` : `¥${Math.abs(savings).toLocaleString()} 손해`}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          <p className="mt-3 text-[10px] text-muted-foreground/60">
            ※ 추정치는 입력된 교통비와 도시 간 평균 요금을 기반으로 합니다. 실제 비용과 다를 수 있습니다.
          </p>
        </div>
      </div>
    </div>
  )
}
