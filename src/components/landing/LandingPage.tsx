import { useNavigate } from "react-router-dom"
import { motion } from "framer-motion"
import { Sparkles, ArrowRight, MapPin, Calendar, Utensils, Camera, ChevronRight } from "lucide-react"
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
  { icon: MapPin, label: "경로 시각화", desc: "지도에 자동 경로 표시" },
  { icon: Calendar, label: "일정 관리", desc: "드래그 앤 드롭으로 편리하게" },
  { icon: Utensils, label: "맛집 탐색", desc: "Google 리뷰 기반 추천" },
  { icon: Camera, label: "관광지 검색", desc: "실시간 장소 검색" },
]

/** 사쿠라 꽃잎 파티클 */
function SakuraPetals() {
  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden z-0" style={{ background: "transparent" }}>
      {Array.from({ length: 8 }).map((_, i) => (
        <span
          key={i}
          className="animate-sakura absolute select-none"
          style={{
            left: `${8 + i * 11}%`,
            top: "-5%",
            animationDuration: `${12 + i * 2}s`,
            animationDelay: `${i * 2.5}s`,
            fontSize: `${11 + (i % 3) * 2}px`,
            lineHeight: 1,
            opacity: 0,
          }}
        >
          🌸
        </span>
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
          <motion.div
            className="mb-5 inline-flex items-center gap-2 rounded-full border border-sakura/30 bg-sakura/8 px-4 py-2 text-sm font-medium text-sakura-dark dark:text-sakura"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.4 }}
          >
            <Sparkles className="h-3.5 w-3.5" />
            나만의 일본 여행 플래너
          </motion.div>
          <h1 className="mb-4 text-5xl font-extrabold tracking-tight sm:text-6xl lg:text-7xl">
            <span className="gradient-text">タビトーク</span>
          </h1>
          <p className="mx-auto max-w-lg text-lg text-muted-foreground">
            나만의 완벽한 일본 여행을 계획하세요
          </p>
          <p className="mt-2 text-sm text-muted-foreground/50">
            旅(tabi, 여행) + Talk — 쉽고 직관적인 일본 여행 플래너
          </p>

          {/* CTA */}
          <motion.div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center" variants={itemVariants}>
            <button
              onClick={handleCustom}
              className="btn-gradient inline-flex items-center gap-2 rounded-xl px-8 py-3.5 text-base font-bold shadow-lg"
            >
              여행 만들기
              <ArrowRight className="h-4.5 w-4.5" />
            </button>
          </motion.div>
        </motion.div>

        {/* ── 기능 소개 ─────────────────────────────── */}
        <motion.div
          className="mb-20 grid grid-cols-2 gap-4 sm:grid-cols-4 sm:gap-6"
          variants={itemVariants}
        >
          {FEATURES.map((feat) => (
            <div
              key={feat.label}
              className="group rounded-2xl border border-border bg-card p-5 text-center transition-all card-shadow hover:border-sakura/30"
            >
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-sakura/8 transition-colors group-hover:bg-sakura/15">
                <feat.icon className="h-6 w-6 text-sakura-dark dark:text-sakura" />
              </div>
              <h3 className="text-sm font-bold">{feat.label}</h3>
              <p className="mt-1 text-xs text-muted-foreground">{feat.desc}</p>
            </div>
          ))}
        </motion.div>

        {/* ── 인기 도시 ─────────────────────────────── */}
        <motion.div variants={itemVariants}>
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-xl font-bold">인기 여행지</h2>
            <button
              onClick={handleCustom}
              className="flex items-center gap-1 text-sm font-semibold text-sakura-dark hover:underline dark:text-sakura"
            >
              모두 보기
              <ChevronRight className="h-4 w-4" />
            </button>
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
                    <div className="mt-3 flex items-center gap-1 text-sm font-medium text-sakura-dark dark:text-sakura">
                      여행 계획 시작
                      <ArrowRight className="h-3.5 w-3.5" />
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* ── AI 추천 (비활성화) ─────────────────────── */}
        <motion.div
          className="mt-16 rounded-2xl border border-border bg-card p-8 text-center card-shadow"
          variants={itemVariants}
        >
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <Sparkles className="h-5 w-5 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-bold">AI 추천 기능</h3>
          <p className="mt-2 text-sm text-muted-foreground">AI 추천 기능은 현재 준비 중입니다</p>
          <button
            disabled
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-muted px-6 py-2.5 text-sm font-medium text-muted-foreground"
            aria-label="추천받기"
          >
            <Sparkles className="h-4 w-4" />
            곧 만나요
          </button>
          <input type="hidden" aria-label="AI 추천 입력 (비활성화)" disabled />
        </motion.div>

        {/* ── Footer ─────────────────────────────────── */}
        <motion.footer
          className="mt-16 border-t border-border pt-8 pb-4 text-center text-sm text-muted-foreground"
          variants={itemVariants}
        >
          <p>© 2026 TabiTalk — 당신의 완벽한 여행을 응원합니다 🌸</p>
        </motion.footer>
      </motion.div>
    </div>
  )
}
