import { useNavigate } from "react-router-dom"
import { motion } from "framer-motion"
import { ArrowRight, MapPin, Calendar, Route, Grip } from "lucide-react"
import { cities } from "@/data/cities"

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" as const } },
}

const FEATURES = [
  { icon: MapPin, label: "실시간 장소 검색", desc: "Google Places API로 맛집, 관광지를 지도에서 바로 검색" },
  { icon: Calendar, label: "일정 관리", desc: "날짜별로 장소를 정리하고 최적의 동선을 만들어보세요" },
  { icon: Grip, label: "드래그 앤 드롭", desc: "직관적인 드래그로 일정 순서를 자유롭게 변경" },
  { icon: Route, label: "경로 시각화", desc: "추가된 장소 간 이동시간과 거리를 자동 계산" },
]

/** 사쿠라 꽃잎 SVG */
function SakuraPetal({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg className={className} style={style} viewBox="0 0 20 20" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path d="M10 0C10 0 13 6 13 10C13 14 10 16 10 20C10 16 7 14 7 10C7 6 10 0 10 0Z" />
    </svg>
  )
}

/** 사쿠라 꽃잎 파티클 */
function SakuraPetals() {
  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden z-0">
      {Array.from({ length: 8 }).map((_, i) => (
        <SakuraPetal
          key={i}
          className="animate-sakura absolute text-sakura/60 dark:text-sakura/40"
          style={{
            left: `${8 + i * 11}%`,
            top: "-5%",
            width: `${11 + (i % 3) * 2}px`,
            height: `${11 + (i % 3) * 2}px`,
            animationDuration: `${12 + i * 2}s`,
            animationDelay: `${i * 2.5}s`,
            opacity: 0,
          }}
        />
      ))}
    </div>
  )
}

export function LandingPage() {
  const navigate = useNavigate()

  const handleCustom = () => {
    navigate("/planner")
  }

  const handleCityClick = (cityId: string) => {
    navigate(`/planner?city=${cityId}`)
  }

  return (
    <div className="relative min-h-screen bg-sakura-pattern">
      <SakuraPetals />

      <motion.div
        className="relative z-10 mx-auto max-w-6xl px-4 pt-20 pb-12 sm:px-6 lg:px-8"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* ── Hero ──────────────────────────────────── */}
        <motion.div className="mb-16 text-center" variants={itemVariants}>
          <h1 className="mb-4 text-5xl font-black tracking-tight sm:text-6xl">
            <span className="gradient-text">타비토크</span>
          </h1>
          <p className="mx-auto max-w-md text-lg leading-relaxed text-muted-foreground">
            지도에서 검색하고, 드래그로 일정을 만들고,<br className="hidden sm:block" />
            완벽한 일본 여행을 계획하세요
          </p>

          {/* CTA */}
          <motion.div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center" variants={itemVariants}>
            <button
              onClick={handleCustom}
              className="btn-gradient inline-flex items-center gap-2.5 rounded-2xl px-10 py-4 text-base font-bold shadow-xl"
            >
              여행 만들기
              <ArrowRight className="h-4.5 w-4.5" />
            </button>
          </motion.div>
        </motion.div>

        {/* ── 기능 소개 ─────────────────────────────── */}
        <motion.div
          className="mb-24 grid grid-cols-2 gap-4 sm:grid-cols-4 sm:gap-5"
          variants={itemVariants}
        >
          {FEATURES.map((feat) => (
            <div
              key={feat.label}
              className="group relative overflow-hidden rounded-2xl border border-border bg-card p-6 transition-all card-shadow"
            >
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-sakura/15 to-indigo/10 transition-colors group-hover:from-sakura/25 group-hover:to-indigo/15">
                <feat.icon className="h-5.5 w-5.5 text-sakura-dark dark:text-sakura" />
              </div>
              <h3 className="text-sm font-bold">{feat.label}</h3>
              <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{feat.desc}</p>
            </div>
          ))}
        </motion.div>

        {/* ── 인기 도시 ─────────────────────────────── */}
        <motion.div variants={itemVariants}>
          <div className="mb-8">
            <h2 className="text-2xl font-black">인기 여행지</h2>
            <p className="mt-1 text-sm text-muted-foreground">어디로 떠나볼까요?</p>
          </div>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {cities.map((city) => (
              <motion.div
                key={city.id}
                whileHover={{ y: -4 }}
                whileTap={{ scale: 0.98 }}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
              >
                <div
                  className="group cursor-pointer overflow-hidden rounded-2xl border border-border bg-card transition-all card-shadow"
                  onClick={() => handleCityClick(city.id)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault()
                      handleCityClick(city.id)
                    }
                  }}
                >
                  <div className="relative aspect-[4/3] overflow-hidden">
                    <img
                      src={city.image}
                      alt={city.name}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      loading="lazy"
                    />
                  </div>
                  <div className="p-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-base font-bold">{city.name}</h3>
                      <span className="text-xs text-muted-foreground">{city.nameEn}</span>
                    </div>
                    <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-muted-foreground">{city.description}</p>
                    <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-sakura/8 px-3 py-1 text-xs font-semibold text-sakura-dark dark:text-sakura transition-colors group-hover:bg-sakura/15">
                      여행 계획 시작
                      <ArrowRight className="h-3 w-3" />
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* ── Footer ─────────────────────────────────── */}
        <motion.footer
          className="mt-16 border-t border-border pt-6 pb-6 text-center"
          variants={itemVariants}
        >
          <p className="text-sm text-muted-foreground">© 2026 타비토크</p>
        </motion.footer>
      </motion.div>
    </div>
  )
}
