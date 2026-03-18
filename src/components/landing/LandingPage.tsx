import { useNavigate } from "react-router-dom"
import { motion } from "framer-motion"
import { ArrowRight, MapPin, Users, Map, MessageCircle, CalendarDays, Globe } from "lucide-react"
import { cities } from "@/data/cities"

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" as const } },
}

const features = [
  { icon: Map, title: "지도 기반 플래너", desc: "구글맵에서 장소를 검색하고 드래그로 일정을 완성하세요. 이동 시간까지 자동 계산됩니다.", link: "/planner?new=true" as const, cta: "플래너 시작" },
  { icon: Users, title: "여행 커뮤니티", desc: "다른 여행자가 만든 일정을 구경하고, 나만의 여행도 공유해보세요. 추천과 댓글로 소통할 수 있어요.", link: "/community" as const, cta: "커뮤니티 가기" },
  { icon: Globe, title: "일본 전역 커버", desc: "도쿄, 오사카는 물론 소도시까지. 구글맵 기반이라 일본 어디든 자유롭게 여행 계획을 세울 수 있어요.", link: "/planner?new=true" as const, cta: "도시 선택하기" },
]

const stats = [
  { value: "일본 전역", label: "커버리지" },
  { value: "구글맵", label: "지도 연동" },
  { value: "여행 공유", label: "커뮤니티" },
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
                구글맵 기반 일정 플래너부터
                <br className="hidden sm:block" />
                여행자 커뮤니티까지 한곳에서.
              </p>

              <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
                <motion.button
                  onClick={() => navigate("/planner?new=true")}
                  className="btn-gradient inline-flex w-full items-center justify-center gap-2 rounded-xl px-8 py-3.5 text-sm font-bold shadow-md sm:w-auto"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Map className="h-4 w-4" />
                  여행 일정 만들기
                  <ArrowRight className="h-4 w-4" />
                </motion.button>
                <motion.button
                  onClick={() => navigate("/community")}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-card px-8 py-3.5 text-sm font-semibold text-foreground shadow-sm transition-colors hover:bg-muted sm:w-auto"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Users className="h-4 w-4" />
                  다른 여행자 구경하기
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
              {features.map(({ icon: Icon, title, desc, cta, link }) => (
                <motion.button
                  key={title}
                  onClick={() => navigate(link)}
                  className="group flex flex-col items-start rounded-2xl border border-border bg-card p-6 text-left transition-all hover:border-primary/30 card-shadow"
                  whileHover={{ y: -2 }}
                >
                  <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-primary/8">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="mb-2 text-sm font-bold text-foreground">{title}</h3>
                  <p className="text-xs leading-relaxed text-muted-foreground">{desc}</p>
                  <span className="mt-3 text-xs font-semibold text-primary opacity-0 transition-opacity group-hover:opacity-100">
                    {cta} →
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
                <p className="text-sm text-muted-foreground">인기 도시를 선택하거나 검색으로 어디든 플래닝하세요</p>
              </div>
              <div className="hidden items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 sm:flex">
                <svg className="h-4 w-4" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" fill="#EA4335"/><circle cx="12" cy="9" r="2.5" fill="white"/></svg>
                <span className="text-[11px] font-medium text-muted-foreground">구글맵</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
              {cities.slice(0, 8).map((city) => (
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
              ].map(({ step, title, desc }) => (
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

          {/* ── Social Proof ── */}
          <motion.section className="mb-20" variants={fadeUp}>
            <h2 className="mb-2 text-center text-sm font-semibold uppercase tracking-widest text-primary">Travelers</h2>
            <p className="mb-8 text-center text-lg font-bold text-foreground">여행자들의 한마디</p>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              {[
                { name: "하늘", city: "도쿄", text: "구글맵에서 바로 검색하고 일정에 넣으니까 계획 시간이 확 줄었어요!" },
                { name: "민수", city: "오사카", text: "이동 시간 자동 계산이 진짜 편해요. 동선 짤 때 고민이 줄었습니다." },
                { name: "지연", city: "교토", text: "커뮤니티에서 다른 분 일정 참고하니까 처음 가는 곳도 두렵지 않았어요." },
              ].map(({ name, city, text }) => (
                <div key={name} className="flex flex-col rounded-2xl border border-border bg-card p-5 card-shadow">
                  <p className="mb-4 flex-1 text-xs leading-relaxed text-muted-foreground">"{text}"</p>
                  <div className="flex items-center gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">{name[0]}</div>
                    <div>
                      <p className="text-xs font-semibold">{name}</p>
                      <p className="text-[10px] text-muted-foreground">{city} 여행</p>
                    </div>
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
                  onClick={() => navigate("/planner?new=true")}
                  className="btn-gradient inline-flex items-center gap-2 rounded-xl px-8 py-3 text-sm font-bold shadow-sm"
                >
                  <Map className="h-4 w-4" />
                  일정 만들기
                </button>
                <button
                  onClick={() => navigate("/community")}
                  className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-8 py-3 text-sm font-semibold text-foreground shadow-sm hover:bg-muted"
                >
                  <Users className="h-4 w-4" />
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
