import { useNavigate } from "react-router-dom"
import { motion } from "framer-motion"
import { ArrowRight, MapPin, Users, Sparkles, Map, MessageCircle, CalendarDays } from "lucide-react"
import { cities } from "@/data/cities"

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" as const } },
}

const features = [
  { icon: Map, title: "지도 기반 플래너", desc: "구글맵에서 장소를 검색하고 드래그로 일정을 완성하세요. 이동 시간까지 자동 계산됩니다." },
  { icon: Sparkles, title: "AI 여행 추천", desc: "여행 스타일과 관심사를 알려주면, AI가 맞춤 코스를 추천해드려요." },
  { icon: Users, title: "여행 커뮤니티", desc: "다른 여행자의 일정을 구경하고, 후기를 나누고, 실시간 채팅으로 소통하세요." },
]

const stats = [
  { value: "8", label: "지원 도시" },
  { value: "Google", label: "지도 연동" },
  { value: "실시간", label: "채팅" },
]

export function LandingPage() {
  const navigate = useNavigate()

  return (
    <div className="relative min-h-screen bg-sakura-pattern">
      <div className="mx-auto max-w-5xl px-5 pt-20 pb-16 sm:px-8">
        <motion.div
          initial="hidden"
          animate="visible"
          transition={{ staggerChildren: 0.12 }}
        >
          {/* ── Hero ── */}
          <motion.section className="pb-16 pt-8 sm:pt-12" variants={fadeUp}>
            <div className="mx-auto max-w-2xl text-center">
              <h1 className="mb-4 text-4xl font-black tracking-tight sm:text-5xl lg:text-6xl leading-[1.15]">
                <span className="gradient-text font-maple">일본 여행,</span>
                <br />
                <span className="text-foreground">타비톡으로 완성하세요</span>
              </h1>
              <p className="mx-auto mb-8 max-w-lg text-base leading-relaxed text-muted-foreground sm:text-lg">
                AI가 추천하는 맞춤 코스부터 지도 기반 플래닝,
                <br className="hidden sm:block" />
                여행자 커뮤니티까지 한곳에서.
              </p>

              <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
                <motion.button
                  onClick={() => navigate("/wizard")}
                  className="btn-gradient inline-flex w-full items-center justify-center gap-2 rounded-xl px-8 py-3.5 text-sm font-bold shadow-md sm:w-auto"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Sparkles className="h-4 w-4" />
                  AI 맞춤 추천 받기
                  <ArrowRight className="h-4 w-4" />
                </motion.button>
                <motion.button
                  onClick={() => navigate("/planner?new=true")}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-card px-8 py-3.5 text-sm font-semibold text-foreground shadow-sm transition-colors hover:bg-muted sm:w-auto"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <MapPin className="h-4 w-4" />
                  직접 일정 만들기
                </motion.button>
              </div>
            </div>

            {/* 미니 stat 스트립 */}
            <div className="mt-12 flex items-center justify-center gap-6 sm:gap-10">
              {stats.map((s) => (
                <div key={s.label} className="text-center">
                  <p className="text-lg font-extrabold text-foreground sm:text-xl">{s.value}</p>
                  <p className="text-[11px] text-muted-foreground">{s.label}</p>
                </div>
              ))}
            </div>
          </motion.section>

          {/* ── 핵심 기능 ── */}
          <motion.section className="mb-20" variants={fadeUp}>
            <h2 className="mb-2 text-center text-sm font-semibold uppercase tracking-widest text-primary">Features</h2>
            <p className="mb-8 text-center text-lg font-bold text-foreground">여행 준비의 모든 것</p>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              {features.map(({ icon: Icon, title, desc }, i) => (
                <motion.button
                  key={title}
                  onClick={() => i === 0 ? navigate("/planner?new=true") : i === 1 ? navigate("/wizard") : navigate("/community")}
                  className="group flex flex-col items-start rounded-2xl border border-border bg-card p-6 text-left transition-all hover:border-primary/30 card-shadow"
                  whileHover={{ y: -2 }}
                >
                  <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-primary/8">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="mb-2 text-sm font-bold text-foreground">{title}</h3>
                  <p className="text-xs leading-relaxed text-muted-foreground">{desc}</p>
                  <span className="mt-3 text-xs font-semibold text-primary opacity-0 transition-opacity group-hover:opacity-100">
                    {i === 0 ? "플래너 시작" : i === 1 ? "AI 추천 받기" : "커뮤니티 가기"} →
                  </span>
                </motion.button>
              ))}
            </div>
          </motion.section>

          {/* ── 도시 그리드 ── */}
          <motion.section className="mb-20" variants={fadeUp}>
            <div className="mb-8 flex items-end justify-between">
              <div>
                <h2 className="text-lg font-bold text-foreground">어디로 떠나볼까요?</h2>
                <p className="text-sm text-muted-foreground">도시를 선택하면 바로 플래닝이 시작됩니다</p>
              </div>
              <button
                onClick={() => navigate("/planner?new=true")}
                className="hidden text-xs font-semibold text-primary hover:underline sm:block"
              >
                전체 보기
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
              {cities.map((city) => (
                <motion.button
                  key={city.id}
                  onClick={() => navigate(`/planner?city=${city.id}&new=true`)}
                  className="group relative overflow-hidden rounded-2xl border border-border bg-card text-left card-shadow"
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="aspect-[4/3] overflow-hidden">
                    <img
                      src={city.image}
                      alt={city.name}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                    <div className="absolute bottom-2 left-3">
                      <h3 className="text-sm font-bold text-white sm:text-base drop-shadow-sm">{city.name}</h3>
                      <span className="text-[11px] text-white/80">{city.nameEn}</span>
                    </div>
                  </div>
                </motion.button>
              ))}
            </div>
          </motion.section>

          {/* ── 사용 흐름 ── */}
          <motion.section className="mb-20" variants={fadeUp}>
            <h2 className="mb-8 text-center text-lg font-bold text-foreground">3단계로 완성하는 여행</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              {[
                { step: "01", icon: CalendarDays, title: "도시 & 일정 선택", desc: "여행할 도시와 날짜를 선택하세요" },
                { step: "02", icon: MapPin, title: "장소 추가", desc: "지도에서 장소를 검색하고 일정에 드래그" },
                { step: "03", icon: MessageCircle, title: "공유 & 소통", desc: "완성된 여행을 공유하고 후기를 남기세요" },
              ].map(({ step, icon: Icon, title, desc }) => (
                <div key={step} className="flex items-start gap-4 rounded-2xl border border-border bg-card p-5">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-sm font-extrabold text-primary">{step}</span>
                  <div>
                    <h3 className="mb-1 text-sm font-bold">{title}</h3>
                    <p className="text-xs text-muted-foreground">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.section>

          {/* ── CTA ── */}
          <motion.section className="mb-20 text-center" variants={fadeUp}>
            <div className="rounded-2xl border border-primary/20 bg-primary/5 px-6 py-10 sm:px-12">
              <h2 className="mb-2 text-xl font-bold text-foreground">지금 바로 여행 계획을 시작하세요</h2>
              <p className="mb-6 text-sm text-muted-foreground">회원가입 없이도 플래닝이 가능합니다</p>
              <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
                <button
                  onClick={() => navigate("/wizard")}
                  className="btn-gradient inline-flex items-center gap-2 rounded-xl px-8 py-3 text-sm font-bold shadow-sm"
                >
                  <Sparkles className="h-4 w-4" />
                  AI 추천으로 시작
                </button>
                <button
                  onClick={() => navigate("/community")}
                  className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-8 py-3 text-sm font-semibold text-foreground shadow-sm hover:bg-muted"
                >
                  다른 여행자 구경하기
                </button>
              </div>
            </div>
          </motion.section>

          {/* ── Footer ── */}
          <motion.footer className="border-t border-border pt-8 text-center" variants={fadeUp}>
            <p className="text-xs text-muted-foreground">© 2026 타비톡 · All rights reserved</p>
          </motion.footer>
        </motion.div>
      </div>
    </div>
  )
}
