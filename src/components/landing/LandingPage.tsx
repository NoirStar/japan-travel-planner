import { useCallback } from "react"
import { useNavigate } from "react-router-dom"
import { Map, Users, Globe } from "lucide-react"
import { motion } from "framer-motion"
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
      <section className="aurora-bg relative flex min-h-[100vh] lg:min-h-[92vh] items-center justify-center px-6 sm:px-8">
        {/* SVG route lines — decorative travel paths */}
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none z-0"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <path
            d="M-50,200 Q200,150 400,280 T800,200 T1200,300 T1600,180"
            fill="none"
            stroke="var(--color-primary)"
            strokeWidth="1"
            opacity="0.08"
            className="route-line"
          />
          <path
            d="M-50,400 Q300,350 500,450 T900,380 T1300,480 T1700,350"
            fill="none"
            stroke="var(--color-primary-light)"
            strokeWidth="0.8"
            opacity="0.06"
            className="route-line-reverse"
          />
          <path
            d="M-50,600 Q150,550 350,620 T750,560 T1150,650 T1550,530"
            fill="none"
            stroke="var(--color-primary)"
            strokeWidth="0.6"
            opacity="0.05"
            className="route-line"
          />
        </svg>

        <div className="relative z-10 mx-auto max-w-3xl text-center">
          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="mb-6 flex justify-center"
          >
            <img src="/logo/logo.png" alt="타비톡" className="h-16 w-16 rounded-2xl shadow-lg" />
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-display text-foreground mb-6"
          >
            일본 여행,
            <br />
            완벽하게 계획하세요
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.25 }}
            className="mx-auto mb-10 max-w-lg text-muted-foreground text-body leading-relaxed"
          >
            Google Maps 기반 플래너로 일정을 짜고, 친구와 실시간으로 함께 편집하고,
            다른 여행자의 일정을 탐색하세요.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="flex flex-col items-center gap-4"
          >
            <Button
              onClick={() => handleStartPlanning("/planner?new=true")}
              variant="default"
              size="lg"
              className="h-12 px-8"
            >
              여행 일정 만들기
            </Button>

            <Button
              onClick={() => navigate("/community")}
              variant="link"
            >
              여행 일정 구경하기 →
            </Button>
          </motion.div>
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
          ].map((feature, idx) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.4, delay: idx * 0.1 }}
              className="bg-card border border-border rounded-xl p-6 hover:-translate-y-1 hover:border-primary/20 hover:shadow-lg transition-all duration-300"
            >
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10">
                <feature.icon className="h-5 w-5 text-primary" />
              </div>
              <h3 className="text-title text-foreground mb-2">{feature.title}</h3>
              <p className="text-body-sm text-muted-foreground">{feature.desc}</p>
            </motion.div>
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
          {cities.slice(0, 8).map((city, idx) => (
            <motion.button
              key={city.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-30px" }}
              transition={{ duration: 0.35, delay: idx * 0.05 }}
              onClick={() => handleStartPlanning("/planner", city.id)}
              className="group relative overflow-hidden rounded-xl text-left"
            >
              <div className="aspect-[4/3] overflow-hidden rounded-xl">
                <img
                  src={city.image}
                  alt={city.name}
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  loading="lazy"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; (e.target as HTMLImageElement).parentElement!.classList.add('bg-muted') }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                <div className="absolute bottom-3 left-3">
                  <h3 className="text-sm font-bold text-white drop-shadow-sm">{city.name}</h3>
                  <span className="text-[10px] uppercase tracking-wider text-white/60">{city.nameEn}</span>
                </div>
              </div>
            </motion.button>
          ))}
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="mx-auto max-w-5xl px-6 sm:px-8 section-gap">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="card-elevated p-8 sm:p-12 text-center"
        >
          <h2 className="text-headline mb-3">지금 바로 시작하세요</h2>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            무료로 여행 일정을 만들고, 공유하고, 커뮤니티에서 영감을 얻으세요.
          </p>
          <Button
            onClick={() => handleStartPlanning("/planner?new=true")}
            variant="default"
            size="lg"
            className="h-12 px-8"
          >
            여행 일정 만들기
          </Button>
        </motion.div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-border/20 py-8 text-center">
        <p className="text-xs text-muted-foreground/60">© 2026 타비톡 — 일본 여행 플래너</p>
      </footer>
    </div>
  )
}
