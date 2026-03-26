import { useCallback } from "react"
import { useNavigate } from "react-router-dom"
import { ArrowRight, Map } from "lucide-react"
import { cities } from "@/data/cities"
import { useScheduleStore } from "@/stores/scheduleStore"
import { Button } from "@/components/ui/button"

export function LandingPage() {
  const navigate = useNavigate()
  const trips = useScheduleStore((s) => s.trips)
  const hasTrips = trips.length > 0

  const handleStartPlanning = useCallback((link: string, cityId?: string) => {
    if (!link.includes("/planner")) {
      navigate(link)
      return
    }
    if (hasTrips) {
      navigate("/trips")
    } else if (cityId) {
      navigate(`/planner?city=${cityId}&new=true`)
    } else {
      navigate(link)
    }
  }, [hasTrips, navigate])

  return (
    <div className="relative min-h-screen bg-background">
      {/* ── Hero ── */}
      <section className="relative flex min-h-[65vh] items-center justify-center px-6 sm:px-8">
        {/* Subtle background glow */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[600px] w-[800px] rounded-full bg-gradient-to-br from-cosmic/5 via-nebula/3 to-transparent blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-2xl text-center">
          <h1 className="text-display mb-4">
            <span className="gradient-text font-maple">일본 여행,</span>
            <br />
            <span className="text-foreground">타비톡으로 완성하세요</span>
          </h1>
          <p className="mx-auto mb-8 max-w-md text-base text-muted-foreground leading-relaxed sm:text-lg">
            지도 기반 플래너 · 실시간 공동편집 · 여행 커뮤니티
          </p>

          <Button
            onClick={() => handleStartPlanning("/planner?new=true")}
            size="lg"
            variant="cta"
            className="w-full sm:w-auto h-12 px-8 text-base"
          >
            <Map className="h-5 w-5" />
            여행 일정 만들기
            <ArrowRight className="h-5 w-5" />
          </Button>

          <p className="mt-4 text-sm text-muted-foreground">
            또는{" "}
            <button onClick={() => navigate("/community")} className="text-primary font-medium hover:underline">
              다른 여행자의 일정 구경하기 →
            </button>
          </p>
        </div>
      </section>

      {/* ── 도시 선택 ── */}
      <section className="mx-auto max-w-5xl px-6 pb-16 sm:px-8">
        <div className="mb-6">
          <h2 className="text-headline text-foreground">어디로 떠나볼까요?</h2>
          <p className="mt-1 text-sm text-muted-foreground">인기 도시를 선택해서 바로 일정을 시작하세요</p>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          {cities.slice(0, 8).map((city) => (
            <button
              key={city.id}
              onClick={() => handleStartPlanning("/planner", city.id)}
              className="group relative overflow-hidden rounded-xl text-left transition-all duration-200 hover:ring-1 hover:ring-primary/30"
            >
              <div className="aspect-[4/3] overflow-hidden rounded-xl">
                <img
                  src={city.image}
                  alt={city.name}
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  loading="lazy"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; (e.target as HTMLImageElement).parentElement!.classList.add('bg-muted') }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                <div className="absolute bottom-3 left-3">
                  <h3 className="text-sm font-bold text-white drop-shadow-sm">{city.name}</h3>
                  <span className="text-[10px] uppercase tracking-wider text-white/60">{city.nameEn}</span>
                </div>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-border/20 py-6 text-center">
        <p className="text-[11px] uppercase tracking-widest text-muted-foreground/60">© 2026 타비톡</p>
      </footer>
    </div>
  )
}
