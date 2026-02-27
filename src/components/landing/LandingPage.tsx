import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { motion } from "framer-motion"
import { Sparkles, Pencil, Send, MapPin, Calendar, Utensils, Camera } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cities } from "@/data/cities"

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.12 },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" as const } },
}

const FEATURES = [
  { icon: MapPin, label: "경로 시각화", desc: "지도에 자동 경로 표시" },
  { icon: Calendar, label: "일정 관리", desc: "Day별 드래그 앤 드롭" },
  { icon: Utensils, label: "맛집 큐레이션", desc: "현지인 추천 핫플" },
  { icon: Camera, label: "관광지 추천", desc: "인기 명소 총집합" },
]

/** 사쿠라 꽃잎 파티클 */
function SakuraPetals() {
  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden z-0" style={{ background: "transparent" }}>
      {Array.from({ length: 10 }).map((_, i) => (
        <span
          key={i}
          className="animate-sakura absolute select-none"
          style={{
            left: `${5 + i * 9.5}%`,
            top: "-5%",
            animationDuration: `${10 + i * 1.8}s`,
            animationDelay: `${i * 2.2}s`,
            fontSize: `${12 + (i % 4) * 3}px`,
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
  const [prompt, setPrompt] = useState("")
  const navigate = useNavigate()

  const handleAIRecommend = () => {
    if (prompt.trim()) {
      navigate(`/wizard?prompt=${encodeURIComponent(prompt.trim())}`)
    } else {
      navigate("/wizard")
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleAIRecommend()
    }
  }

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
        className="relative z-10 flex min-h-screen flex-col items-center justify-center px-4 pt-14 pb-8"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Hero */}
        <motion.div className="mb-10 text-center" variants={itemVariants}>
          <motion.div
            className="mb-4 inline-flex items-center gap-2 rounded-full bg-sakura/20 px-4 py-1.5 text-sm font-medium text-sakura-dark dark:bg-sakura/10 dark:text-sakura"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            <Sparkles className="h-3.5 w-3.5" />
            AI와 대화하며 만드는 여행
          </motion.div>
          <h1 className="mb-3 text-5xl font-extrabold tracking-tight sm:text-6xl lg:text-7xl">
            <span className="gradient-text">タビトーク</span>
          </h1>
          <p className="mx-auto max-w-md text-base text-muted-foreground sm:text-lg">
            나만의 완벽한 일본 여행을 계획하세요
          </p>
          <p className="mt-1 text-sm text-muted-foreground/60">
            旅(tabi, 여행) + Talk — AI와 대화하며 만드는 일본 여행 플래너
          </p>
        </motion.div>

        {/* AI 입력 */}
        <motion.div className="mb-5 w-full max-w-xl" variants={itemVariants}>
          <div className="glass relative flex items-center gap-2 rounded-2xl p-2 shadow-lg shadow-sakura/10">
            <Sparkles className="pointer-events-none ml-3 h-5 w-5 shrink-0 text-sakura-dark dark:text-sakura" />
            <Input
              placeholder='"도쿄 2박3일 맛집 위주로 추천해줘"'
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={handleKeyDown}
              className="h-12 border-0 bg-transparent text-base shadow-none focus-visible:ring-0 placeholder:text-muted-foreground/50"
              aria-label="AI 추천 입력"
            />
            <button
              onClick={handleAIRecommend}
              className="btn-gradient flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
              aria-label="추천받기"
            >
              <Send className="h-4 w-4 text-white" />
            </button>
          </div>
        </motion.div>

        {/* 또는 */}
        <motion.div
          className="mb-5 flex items-center gap-4 text-muted-foreground"
          variants={itemVariants}
        >
          <div className="h-px w-12 bg-gradient-to-r from-transparent to-border" />
          <span className="text-xs font-medium">또는</span>
          <div className="h-px w-12 bg-gradient-to-l from-transparent to-border" />
        </motion.div>

        {/* 커스텀 만들기 */}
        <motion.div variants={itemVariants}>
          <Button
            variant="outline"
            size="lg"
            onClick={handleCustom}
            className="gap-2 rounded-full border-border/60 px-8 text-sm font-semibold shadow-sm transition-all hover:border-sakura-dark/40 hover:bg-sakura/10 hover:shadow-md"
          >
            <Pencil className="h-4 w-4" />
            직접 커스텀으로 만들기
          </Button>
        </motion.div>

        {/* 기능 소개 */}
        <motion.div
          className="mt-14 grid w-full max-w-2xl grid-cols-2 gap-3 sm:grid-cols-4"
          variants={itemVariants}
        >
          {FEATURES.map((feat) => (
            <div
              key={feat.label}
              className="glass flex flex-col items-center gap-2 rounded-2xl p-4 text-center transition-all hover:shadow-md hover:ring-1 hover:ring-sakura-dark/20"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-sakura/30 to-indigo/20 dark:from-sakura/20 dark:to-indigo/10">
                <feat.icon className="h-5 w-5 text-sakura-dark dark:text-sakura" />
              </div>
              <h3 className="text-xs font-bold">{feat.label}</h3>
              <p className="text-[10px] leading-tight text-muted-foreground">{feat.desc}</p>
            </div>
          ))}
        </motion.div>

        {/* 인기 도시 */}
        <motion.div className="mt-14 w-full max-w-4xl" variants={itemVariants}>
          <h2 className="mb-6 text-center text-sm font-bold uppercase tracking-widest text-muted-foreground/70">
            인기 여행지
          </h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
            {cities.map((city, idx) => (
              <motion.div
                key={city.id}
                whileHover={{ y: -6, scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
              >
                <div
                  className="group cursor-pointer overflow-hidden rounded-2xl glass shadow-sm transition-all hover:shadow-xl hover:ring-1 hover:ring-sakura-dark/30"
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
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                    <div className="absolute bottom-0 left-0 p-3">
                      <p className="text-lg font-bold text-white drop-shadow-lg">{city.name}</p>
                      <p className="text-[11px] font-medium text-white/70">{city.nameEn}</p>
                    </div>
                    {/* 인덱스 배지 */}
                    <div className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-white/20 text-[10px] font-bold text-white backdrop-blur-sm">
                      {String(idx + 1).padStart(2, "0")}
                    </div>
                  </div>
                  <div className="p-3">
                    <p className="text-xs leading-relaxed text-muted-foreground">{city.description}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Footer */}
        <motion.footer
          className="mt-16 mb-4 text-center text-xs text-muted-foreground/50"
          variants={itemVariants}
        >
          <p>© 2026 TabiTalk — 당신의 완벽한 여행을 응원합니다 🌸</p>
        </motion.footer>
      </motion.div>
    </div>
  )
}
