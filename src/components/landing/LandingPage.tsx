import { useNavigate } from "react-router-dom"
import { motion } from "framer-motion"
import { ArrowRight, MapPin, Users, Sparkles } from "lucide-react"
import { cities } from "@/data/cities"

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" as const } },
}

const features = [
  { icon: MapPin, title: "지도 기반 플래너", desc: "지도에서 장소를 검색하고 드래그로 일정을 완성하세요" },
  { icon: Users, title: "여행 커뮤니티", desc: "다른 여행자들의 일정을 참고하고 함께 소통하세요" },
  { icon: Sparkles, title: "AI 추천", desc: "AI가 맞춤 여행 코스와 맛집을 추천해드려요" },
]

export function LandingPage() {
  const navigate = useNavigate()

  return (
    <div className="relative min-h-screen bg-background">
      <motion.div
        className="mx-auto max-w-5xl px-5 pt-28 pb-16 sm:px-8"
        initial="hidden"
        animate="visible"
        transition={{ staggerChildren: 0.1 }}
      >
        {/* ── Hero ── */}
        <motion.div className="mb-20 text-center" variants={fadeUp}>
          <div className="mb-5 inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/50 px-3.5 py-1.5 text-xs font-medium text-muted-foreground">
            <Sparkles className="h-3 w-3 text-sakura-dark" />
            일본 여행 플래너 &amp; 커뮤니티
          </div>

          <h1 className="mb-4 text-4xl font-black tracking-tight sm:text-5xl lg:text-6xl">
            <span className="gradient-text font-maple">타비톡</span>
          </h1>
          <p className="mx-auto max-w-md text-base leading-relaxed text-muted-foreground sm:text-lg">
            지도에서 장소를 검색하고, 나만의 일정을 만들고,
            <br className="hidden sm:block" />
            다른 여행자들과 함께 소통하세요
          </p>

          <div className="mt-10 flex items-center justify-center gap-3">
            <motion.button
              onClick={() => navigate("/planner")}
              className="btn-gradient inline-flex items-center gap-2 rounded-xl px-7 py-3 text-sm font-semibold shadow-sm"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              여행 만들기
              <ArrowRight className="h-4 w-4" />
            </motion.button>
            <motion.button
              onClick={() => navigate("/community")}
              className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-7 py-3 text-sm font-semibold text-foreground shadow-sm transition-colors hover:bg-muted"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              둘러보기
            </motion.button>
          </div>
        </motion.div>

        {/* ── 핵심 기능 ── */}
        <motion.div className="mb-20 grid grid-cols-1 gap-4 sm:grid-cols-3" variants={fadeUp}>
          {features.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="flex flex-col items-center rounded-2xl border border-border bg-card p-6 text-center card-shadow">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                <Icon className="h-5 w-5 text-primary" />
              </div>
              <h3 className="mb-1.5 text-sm font-bold">{title}</h3>
              <p className="text-xs leading-relaxed text-muted-foreground">{desc}</p>
            </div>
          ))}
        </motion.div>

        {/* ── 도시 그리드 ── */}
        <motion.div variants={fadeUp}>
          <h2 className="mb-6 text-lg font-bold">어디로 떠나볼까요?</h2>
          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            {cities.map((city) => (
              <motion.button
                key={city.id}
                onClick={() => navigate(`/planner?city=${city.id}`)}
                className="group relative overflow-hidden rounded-2xl border border-border bg-card text-left card-shadow"
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

        {/* ── Footer ── */}
        <motion.footer className="mt-24 border-t border-border pt-8 text-center" variants={fadeUp}>
          <p className="text-xs text-muted-foreground">© 2026 타비톡 · All rights reserved</p>
        </motion.footer>
      </motion.div>
    </div>
  )
}
