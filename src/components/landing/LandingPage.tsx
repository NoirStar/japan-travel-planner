import { useNavigate } from "react-router-dom"
import { motion } from "framer-motion"
import { ArrowRight, Sparkles } from "lucide-react"
import { cities } from "@/data/cities"

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" as const } },
}

export function LandingPage() {
  const navigate = useNavigate()

  return (
    <div className="relative min-h-screen bg-background">
      <motion.div
        className="mx-auto max-w-5xl px-5 pt-24 pb-16 sm:px-8"
        initial="hidden"
        animate="visible"
        transition={{ staggerChildren: 0.08 }}
      >
        {/* ── Hero ──────────────────────────────────── */}
        <motion.div className="mb-16 text-center" variants={fadeUp}>
          <div className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/50 px-3 py-1 text-xs font-medium text-muted-foreground">
            <Sparkles className="h-3 w-3 text-sakura-dark" />
            지도에서 검색하고 추가로 일정 완성
          </div>

          <h1 className="mb-3 text-4xl font-black tracking-tight sm:text-5xl">
            <span className="gradient-text font-maple">타비톡</span>
          </h1>
          <p className="mx-auto max-w-sm text-base text-muted-foreground">
            일본 여행, 쉽고 빠르게 계획하고<br />커뮤니티와 채팅으로 함께 소통하세요
          </p>

          <motion.button
            onClick={() => navigate("/planner")}
            className="btn-gradient mt-8 inline-flex items-center gap-2 rounded-2xl px-8 py-3.5 text-sm font-bold shadow-lg font-maple"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
          >
            여행 만들기
            <ArrowRight className="h-4 w-4" />
          </motion.button>
        </motion.div>

        {/* ── 도시 그리드 ────────────────────────────── */}
        <motion.div variants={fadeUp}>
          <h2 className="mb-6 text-lg font-bold">어디로 떠나볼까요?</h2>
          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            {cities.map((city) => (
              <motion.button
                key={city.id}
                onClick={() => navigate(`/planner?city=${city.id}`)}
                className="group relative overflow-hidden rounded-2xl border border-border bg-card text-left transition-shadow card-shadow"
                whileHover={{ y: -3 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="aspect-[4/3] overflow-hidden">
                  <img
                    src={city.image}
                    alt={city.name}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    loading="lazy"
                  />
                </div>
                <div className="p-3 sm:p-4">
                  <div className="flex items-baseline justify-between">
                    <h3 className="text-sm font-bold sm:text-base">{city.name}</h3>
                    <span className="text-[11px] text-muted-foreground">{city.nameEn}</span>
                  </div>
                  <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">{city.description}</p>
                </div>
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* ── Footer ──────────────────────────────────── */}
        <motion.footer className="mt-20 text-center" variants={fadeUp}>
          <p className="text-xs text-muted-foreground">© 2026 타비톡. All rights reserved.</p>
        </motion.footer>
      </motion.div>
    </div>
  )
}
