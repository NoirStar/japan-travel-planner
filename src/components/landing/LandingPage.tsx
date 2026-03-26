import { useCallback } from "react"
import { useNavigate } from "react-router-dom"
import { ArrowRight, Map, Users, Globe, ChevronDown } from "lucide-react"
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
      <section className="relative flex min-h-[100vh] lg:min-h-[92vh] items-center justify-center px-6 sm:px-8">
        {/* Atmospheric background */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
          <div className="absolute left-1/4 top-1/3 h-[500px] w-[500px] rounded-full bg-primary/[0.04] blur-[120px]" />
          <div className="absolute right-1/4 bottom-1/3 h-[400px] w-[400px] rounded-full bg-amber/[0.03] blur-[100px]" />
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[300px] w-[600px] rounded-full bg-nebula/[0.02] blur-[80px]" />
        </div>

        <div className="relative mx-auto max-w-3xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border/50 bg-card/50 px-4 py-1.5 text-xs font-medium text-muted-foreground backdrop-blur-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
            지도 기반 일본 여행 플래너
          </div>

          <h1 className="text-display mb-6">
            <span className="text-foreground">일본의 모든 순간을</span>
            <br />
            <span className="gradient-text font-maple">완벽하게 계획하세요</span>
          </h1>

          <p className="mx-auto mb-10 max-w-lg text-base text-muted-foreground leading-relaxed sm:text-lg">
            Google Maps 기반 플래너로 일정을 짜고, 친구와 실시간으로 함께 편집하고,
            다른 여행자의 일정을 탐색하세요.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
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

            <Button
              onClick={() => navigate("/community")}
              variant="outline"
              size="lg"
              className="w-full sm:w-auto h-12 px-6 text-base"
            >
              여행 일정 구경하기
            </Button>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 text-muted-foreground/40 animate-bounce">
          <ChevronDown className="h-5 w-5" />
        </div>
      </section>

      {/* ── Features ── */}
      <section className="mx-auto max-w-5xl px-6 sm:px-8 section-gap">
        <div className="text-center mb-12">
          <h2 className="text-headline text-foreground mb-3">여행 계획의 모든 것</h2>
          <p className="text-muted-foreground max-w-md mx-auto">계획부터 공유까지, 여행에 필요한 모든 기능을 하나의 플랫폼에서</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
          {[
            {
              icon: Map,
              title: "지도 기반 플래너",
              desc: "Google Maps에서 장소를 검색하고, 드래그로 일정을 구성하세요. 경로와 이동시간이 자동으로 표시됩니다."
            },
            {
              icon: Users,
              title: "실시간 공동편집",
              desc: "링크 하나로 친구를 초대하세요. 채팅하면서 함께 일정을 만들고 수정할 수 있습니다."
            },
            {
              icon: Globe,
              title: "여행 커뮤니티",
              desc: "다른 여행자의 검증된 일정을 탐색하고, 마음에 드는 일정을 복사해서 내 여행에 활용하세요."
            },
          ].map((feature) => (
            <div key={feature.title} className="card-elevated p-6 sm:p-8">
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10">
                <feature.icon className="h-5 w-5 text-primary" />
              </div>
              <h3 className="text-title mb-2">{feature.title}</h3>
              <p className="text-body-sm text-muted-foreground">{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── 도시 선택 ── */}
      <section className="mx-auto max-w-5xl px-6 sm:px-8 section-gap">
        <div className="mb-8">
          <h2 className="text-headline text-foreground">어디로 떠나볼까요?</h2>
          <p className="mt-2 text-muted-foreground">인기 도시를 선택해서 바로 일정을 시작하세요</p>
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

      {/* ── CTA ── */}
      <section className="mx-auto max-w-5xl px-6 sm:px-8 section-gap">
        <div className="card-elevated p-8 sm:p-12 text-center relative overflow-hidden">
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-amber/5" />
          <div className="relative">
            <h2 className="text-headline mb-3">지금 바로 시작하세요</h2>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              무료로 여행 일정을 만들고, 공유하고, 커뮤니티에서 영감을 얻으세요.
            </p>
            <Button
              onClick={() => handleStartPlanning("/planner?new=true")}
              size="lg"
              variant="cta"
              className="h-12 px-8 text-base"
            >
              무료로 시작하기
              <ArrowRight className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-border/20 py-8 text-center">
        <p className="text-xs text-muted-foreground/60">© 2026 타비톡 — 일본 여행 플래너</p>
      </footer>
    </div>
  )
}
