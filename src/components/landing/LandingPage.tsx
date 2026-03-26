import { useCallback } from "react"
import { useNavigate } from "react-router-dom"
import { ArrowRight, Map, CalendarDays, Globe } from "lucide-react"
import { cities } from "@/data/cities"
import { useScheduleStore } from "@/stores/scheduleStore"
import { Button } from "@/components/ui/button"

const features = [
  { icon: Map, title: "지도 기반 플래너", desc: "구글맵에서 장소를 검색하고 드래그로 일정 완성", link: "/planner?new=true" as const, cta: "플래너 시작" },
  { icon: Globe, title: "일본 전역 커버", desc: "도쿄, 오사카부터 소도시까지 어디든 계획 가능", link: "/planner?new=true" as const, cta: "도시 선택" },
  { icon: CalendarDays, title: "여행자 커뮤니티", desc: "다른 여행자의 일정을 구경하고 나만의 여행도 공유", link: "/community" as const, cta: "커뮤니티" },
]

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
    <div className="relative min-h-screen bg-cosmic-pattern">
      <div className="mx-auto max-w-6xl px-6 pt-14 pb-20 sm:px-8 lg:px-10">
        <div>
          {/* ── Hero ── */}
          <section className="relative pt-16 pb-10 sm:pt-20 sm:pb-14">
            {/* Hero glow background */}
            <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
              <div className="absolute left-1/2 top-1/3 -translate-x-1/2 -translate-y-1/2 h-[500px] w-[700px] rounded-full bg-gradient-to-br from-cosmic/6 via-nebula/4 to-transparent blur-3xl" />
            </div>

            <div className="relative mx-auto max-w-3xl text-center">
              <h1 className="text-display mb-5">
                <span className="gradient-text font-maple">일본 여행,</span>
                <br />
                <span className="text-foreground">타비톡으로 완성하세요</span>
              </h1>
              <p className="mx-auto mb-8 max-w-xl text-lg text-muted-foreground sm:text-xl leading-relaxed">
                구글맵 기반 일정 플래너부터
                <br className="hidden sm:block" />
                여행자 커뮤니티까지 한곳에서.
              </p>

              <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
                <Button
                  onClick={() => handleStartPlanning("/planner?new=true")}
                  size="lg"
                  className="w-full sm:w-auto"
                  variant="cta"
                >
                  <Map className="h-5 w-5" />
                  여행 일정 만들기
                  <ArrowRight className="h-5 w-5" />
                </Button>
              </div>

              <p className="mt-5 text-body-sm text-muted-foreground">
                또는{" "}
                <button onClick={() => navigate("/community")} className="text-primary font-medium hover:underline">
                  다른 여행자의 일정 구경하기 →
                </button>
              </p>
            </div>
          </section>

          {/* ── 핵심 기능 — 심플 인라인 ── */}
          <section className="section-gap-sm">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 sm:gap-5">
              {features.map(({ icon: Icon, title, desc, cta, link }) => (
                <button
                  key={title}
                  onClick={() => handleStartPlanning(link)}
                  className="group flex items-start gap-4 rounded-xl border border-border/50 bg-card/50 p-5 text-left transition-colors hover:border-primary/30 hover:bg-card"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="mb-1 text-sm font-bold text-foreground">{title}</h3>
                    <p className="text-body-sm leading-relaxed text-muted-foreground">{desc}</p>
                    <span className="mt-2 inline-block text-body-sm font-semibold text-primary">
                      {cta} →
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </section>

          {/* ── 도시 그리드 ── */}
          <section className="section-gap">
            <div className="mb-8 flex items-end justify-between">
              <div>
                <h2 className="text-headline text-foreground">어디로 떠나볼까요?</h2>
                <p className="mt-1 text-body-sm text-muted-foreground">인기 도시를 선택하거나 검색으로 어디든 플래닝하세요</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
              {cities.slice(0, 8).map((city) => (
                <button
                  key={city.id}
                  onClick={() => handleStartPlanning("/planner", city.id)}
                  className="group relative overflow-hidden rounded-xl text-left card-elevated border-0 transition-shadow duration-300 hover:shadow-[0_0_20px_rgba(99,102,241,0.12)]"
                >
                  <div className="aspect-[3/2] overflow-hidden">
                    <img
                      src={city.image}
                      alt={city.name}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      loading="lazy"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; (e.target as HTMLImageElement).parentElement!.classList.add('bg-muted') }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/25 to-transparent" />
                    <div className="absolute bottom-3 left-3">
                      <h3 className="text-sm font-bold text-white drop-shadow-sm">{city.name}</h3>
                      <span className="text-[10px] uppercase tracking-wider text-white/70">{city.nameEn}</span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </section>

          {/* ── 사용 흐름 — 미니멀 ── */}
          <section className="section-gap-sm">
            <h2 className="text-headline text-center text-foreground mb-8">3단계로 완성하는 여행</h2>
            <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
              {[
                { step: "01", title: "도시 & 일정 선택", desc: "여행할 도시와 날짜를 선택하세요" },
                { step: "02", title: "장소 추가", desc: "지도에서 장소를 검색하고 일정에 드래그" },
                { step: "03", title: "공유 & 소통", desc: "완성된 여행을 공유하고 후기를 남기세요" },
              ].map(({ step, title, desc }) => (
                <div key={step} className="flex flex-1 items-start gap-4 rounded-lg border border-border/50 bg-card/30 p-4">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-xs font-bold text-primary tabular-nums">{step}</span>
                  <div>
                    <h3 className="mb-1 text-sm font-bold">{title}</h3>
                    <p className="text-body-sm text-muted-foreground">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* ── Footer ── */}
          <footer className="mt-16 border-t border-border/30 pt-10 text-center">
            <p className="text-[11px] uppercase tracking-widest text-muted-foreground">© 2026 타비톡 · All rights reserved</p>
          </footer>
        </div>
      </div>
    </div>
  )
}
