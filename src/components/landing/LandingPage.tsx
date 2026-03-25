import { useCallback } from "react"
import { useNavigate } from "react-router-dom"
import { ArrowRight, Map, CalendarDays, Globe, Users } from "lucide-react"
import { cities } from "@/data/cities"
import { useScheduleStore } from "@/stores/scheduleStore"
import { Button } from "@/components/ui/button"

const features = [
  { icon: Map, title: "지도 기반 플래너", desc: "구글맵에서 장소를 검색하고 드래그로 일정을 완성하세요. 이동 시간까지 자동 계산됩니다.", link: "/planner?new=true" as const, cta: "플래너 시작", accent: "border-t-4 border-t-primary" },
  { icon: Globe, title: "일본 전역 커버", desc: "도쿄, 오사카는 물론 소도시까지. 구글맵 기반이라 일본 어디든 자유롭게 여행 계획을 세울 수 있어요.", link: "/planner?new=true" as const, cta: "도시 선택하기", accent: "border-t-4 border-t-indigo-light" },
  { icon: CalendarDays, title: "여행자 커뮤니티", desc: "다른 여행자가 만든 일정을 구경하고, 나만의 여행도 공유해보세요. 추천과 댓글로 소통할 수 있어요.", link: "/community" as const, cta: "커뮤니티 가기", accent: "border-t-4 border-t-sakura" },
]

// stats 섹션 제거 — 추상적 통계는 의사결정을 돕지 않음

export function LandingPage() {
  const navigate = useNavigate()
  const trips = useScheduleStore((s) => s.trips)
  const hasTrips = trips.length > 0

  /** 기존 여행이 있으면 내 여행 목록으로, 없으면 바로 플래너 생성 */
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
    <div className="relative min-h-screen bg-sakura-pattern">
      <div className="mx-auto max-w-6xl px-6 pt-16 pb-20 sm:px-8 lg:px-10">
        <div>
          {/* ── Hero ── */}
          <section className="pt-12 pb-10 sm:pt-16 sm:pb-14">
            <div className="mx-auto max-w-3xl text-center">
              <h1 className="text-display mb-5">
                <span className="gradient-text font-maple">일본 여행,</span>
                <br />
                <span className="text-foreground">타비톡으로 완성하세요</span>
              </h1>
              <p className="mx-auto mb-6 max-w-xl text-lg text-muted-foreground sm:text-xl leading-relaxed">
                구글맵 기반 일정 플래너부터
                <br className="hidden sm:block" />
                여행자 커뮤니티까지 한곳에서.
              </p>
              <div className="mb-8 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5"><Map className="h-4 w-4 text-primary" />지도 기반 플래닝</span>
                <span className="flex items-center gap-1.5"><CalendarDays className="h-4 w-4 text-primary" />자동 이동시간 계산</span>
                <span className="flex items-center gap-1.5"><Users className="h-4 w-4 text-primary" />여행자 커뮤니티</span>
              </div>

              <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
                <Button
                  onClick={() => handleStartPlanning("/planner?new=true")}
                  size="lg"
                  className="w-full sm:w-auto"
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

          {/* ── 핵심 기능 ── */}
          <section className="section-gap">
            <div className="mb-10 text-center">
              <span className="chip chip-primary mb-3 text-caption font-semibold tracking-widest">핵심 기능</span>
              <h2 className="text-headline text-foreground mt-2">여행 준비의 모든 것</h2>
            </div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-3 sm:gap-6">
              {features.map(({ icon: Icon, title, desc, cta, link, accent }) => (
                <button
                  key={title}
                  onClick={() => handleStartPlanning(link)}
                  className={`group card-elevated flex flex-col items-start p-7 text-left ${accent}`}
                >
                  <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/8">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="mb-2 text-base font-bold text-foreground">{title}</h3>
                  <p className="text-body-sm leading-relaxed text-muted-foreground">{desc}</p>
                  <span className="mt-4 text-body-sm font-semibold text-primary">
                    {cta} →
                  </span>
                </button>
              ))}
            </div>
          </section>

          {/* ── 도시 그리드 ── */}
          <section className="section-gap">
            <div className="mb-10 flex items-end justify-between">
              <div>
                <h2 className="text-headline text-foreground">어디로 떠나볼까요?</h2>
                <p className="mt-1 text-body-sm text-muted-foreground">인기 도시를 선택하거나 검색으로 어디든 플래닝하세요</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 sm:gap-5 lg:grid-cols-4">
              {cities.slice(0, 8).map((city) => (
                <button
                  key={city.id}
                  onClick={() => handleStartPlanning("/planner", city.id)}
                  className="group relative overflow-hidden rounded-2xl text-left card-elevated border-0"
                >
                  <div className="aspect-[4/3] overflow-hidden">
                    <img
                      src={city.image}
                      alt={city.name}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      loading="lazy"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; (e.target as HTMLImageElement).parentElement!.classList.add('bg-muted') }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                    <div className="absolute bottom-3 left-4">
                      <h3 className="text-base font-bold text-white drop-shadow-sm">{city.name}</h3>
                      <span className="text-caption text-white/75">{city.nameEn}</span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </section>

          {/* ── 사용 흐름 ── */}
          <section className="section-gap">
            <h2 className="text-headline text-center text-foreground mb-10">3단계로 완성하는 여행</h2>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-3 sm:gap-6">
              {[
                { step: "01", title: "도시 & 일정 선택", desc: "여행할 도시와 날짜를 선택하세요" },
                { step: "02", title: "장소 추가", desc: "지도에서 장소를 검색하고 일정에 드래그" },
                { step: "03", title: "공유 & 소통", desc: "완성된 여행을 공유하고 후기를 남기세요" },
              ].map(({ step, title, desc }) => (
                <div key={step} className="flex items-start gap-5 rounded-xl surface-section p-6">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-sm font-bold text-primary">{step}</span>
                  <div>
                    <h3 className="mb-1.5 text-base font-bold">{title}</h3>
                    <p className="text-body-sm text-muted-foreground">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* ── 여행자 후기 ── */}
          <section className="section-gap">
            <div className="mb-10 text-center">
              <h2 className="text-headline text-foreground">여행자들의 한마디</h2>
            </div>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-3 sm:gap-6">
              {[
                { name: "하늘", city: "도쿄", text: "구글맵에서 바로 검색하고 일정에 넣으니까 계획 시간이 확 줄었어요!" },
                { name: "민수", city: "오사카", text: "이동 시간 자동 계산이 진짜 편해요. 동선 짤 때 고민이 줄었습니다." },
                { name: "지연", city: "교토", text: "커뮤니티에서 다른 분 일정 참고하니까 처음 가는 곳도 두렵지 않았어요." },
              ].map(({ name, city, text }) => (
                <div key={name} className="flex flex-col rounded-xl surface-section p-6">
                  <p className="mb-5 flex-1 text-body-sm leading-relaxed text-muted-foreground">{text}</p>
                  <div className="flex items-center gap-3 border-t border-border/50 pt-4">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">{name[0]}</div>
                    <div>
                      <p className="text-body-sm font-semibold">{name}</p>
                      <p className="text-caption text-muted-foreground">{city} 여행</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* ── CTA ── */}
          <section className="section-gap text-center">
            <div className="rounded-2xl bg-gradient-to-br from-primary/5 via-primary/8 to-indigo/5 border border-border/50 px-8 py-14 sm:px-16 sm:py-16">
              <h2 className="text-headline text-foreground mb-3">지금 바로 여행 계획을 시작하세요</h2>
              <p className="text-body text-muted-foreground mb-8">회원가입 없이도 플래닝이 가능합니다</p>
              <Button
                onClick={() => handleStartPlanning("/planner?new=true")}
                size="lg"
              >
                <Map className="h-5 w-5" />
                일정 만들기
              </Button>
            </div>
          </section>

          {/* ── Footer ── */}
          <footer className="border-t border-border/60 pt-10 text-center">
            <p className="text-caption text-muted-foreground">© 2026 타비톡 · All rights reserved</p>
          </footer>
        </div>
      </div>
    </div>
  )
}
