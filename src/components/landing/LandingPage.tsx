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
      <div className="mx-auto max-w-6xl px-6 pt-16 pb-20 sm:px-8 lg:px-10">
        <motion.div
          initial="hidden"
          animate="visible"
          transition={{ staggerChildren: 0.12 }}
        >
          {/* ── Hero ── */}
          <motion.section className="hero-section" variants={fadeUp}>
            <div className="mx-auto max-w-3xl text-center">
              <h1 className="text-display mb-6">
                <span className="gradient-text font-maple">일본 여행,</span>
                <br />
                <span className="text-foreground">타비톡으로 완성하세요</span>
              </h1>
              <p className="mx-auto mb-10 max-w-xl text-body text-muted-foreground sm:text-lg leading-relaxed">
                구글맵 기반 일정 플래너부터
                <br className="hidden sm:block" />
                여행자 커뮤니티까지 한곳에서.
              </p>

              <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
                <motion.button
                  onClick={() => navigate("/planner?new=true")}
                  className="btn-gradient btn-base btn-lg w-full shadow-lg sm:w-auto"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Map className="h-5 w-5" />
                  여행 일정 만들기
                  <ArrowRight className="h-5 w-5" />
                </motion.button>
                <motion.button
                  onClick={() => navigate("/community")}
                  className="btn-base btn-lg w-full border border-border bg-card text-foreground shadow-sm hover:bg-muted sm:w-auto"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Users className="h-5 w-5" />
                  다른 여행자 구경하기
                </motion.button>
              </div>
            </div>

            {/* stat 스트립 */}
            <div className="mt-16 flex items-center justify-center gap-8 sm:gap-14">
              {stats.map((s) => (
                <div key={s.label} className="text-center">
                  <p className="text-xl font-extrabold text-foreground sm:text-2xl">{s.value}</p>
                  <p className="text-caption text-muted-foreground mt-1">{s.label}</p>
                </div>
              ))}
            </div>
          </motion.section>

          {/* ── 핵심 기능 ── */}
          <motion.section className="section-gap" variants={fadeUp}>
            <div className="mb-10 text-center">
              <span className="chip chip-primary mb-3 text-caption font-semibold tracking-widest">핵심 기능</span>
              <h2 className="text-headline text-foreground mt-2">여행 준비의 모든 것</h2>
            </div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-3 sm:gap-6">
              {features.map(({ icon: Icon, title, desc, cta, link }) => (
                <motion.button
                  key={title}
                  onClick={() => navigate(link)}
                  className="group card-elevated flex flex-col items-start p-7 text-left"
                  whileHover={{ y: -3 }}
                >
                  <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/8">
                    <Icon className="h-7 w-7 text-primary" />
                  </div>
                  <h3 className="mb-2 text-base font-bold text-foreground">{title}</h3>
                  <p className="text-body-sm leading-relaxed text-muted-foreground">{desc}</p>
                  <span className="mt-4 text-body-sm font-semibold text-primary opacity-0 transition-opacity group-hover:opacity-100">
                    {cta} →
                  </span>
                </motion.button>
              ))}
            </div>
          </motion.section>

          {/* ── 도시 그리드 — visual-heavy ── */}
          <motion.section className="section-gap" variants={fadeUp}>
            <div className="mb-10 flex items-end justify-between">
              <div>
                <h2 className="text-headline text-foreground">어디로 떠나볼까요?</h2>
                <p className="mt-1 text-body-sm text-muted-foreground">인기 도시를 선택하거나 검색으로 어디든 플래닝하세요</p>
              </div>
              <div className="hidden items-center gap-2 rounded-full bg-muted px-3.5 py-2 sm:flex">
                <svg className="h-4 w-4" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" fill="#EA4335"/><circle cx="12" cy="9" r="2.5" fill="white"/></svg>
                <span className="text-caption font-medium text-muted-foreground">구글맵 연동</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 sm:gap-5 lg:grid-cols-4">
              {cities.slice(0, 8).map((city) => (
                <motion.button
                  key={city.id}
                  onClick={() => navigate(`/planner?city=${city.id}&new=true`)}
                  className="group relative overflow-hidden rounded-2xl text-left card-elevated border-0"
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
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                    <div className="absolute bottom-3 left-4">
                      <h3 className="text-base font-bold text-white drop-shadow-sm">{city.name}</h3>
                      <span className="text-caption text-white/75">{city.nameEn}</span>
                    </div>
                  </div>
                </motion.button>
              ))}
            </div>
          </motion.section>

          {/* ── 사용 흐름 — rhythm change ── */}
          <motion.section className="section-gap" variants={fadeUp}>
            <h2 className="text-headline text-center text-foreground mb-10">3단계로 완성하는 여행</h2>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-3 sm:gap-6">
              {[
                { step: "01", icon: CalendarDays, title: "도시 & 일정 선택", desc: "여행할 도시와 날짜를 선택하세요" },
                { step: "02", icon: MapPin, title: "장소 추가", desc: "지도에서 장소를 검색하고 일정에 드래그" },
                { step: "03", icon: MessageCircle, title: "공유 & 소통", desc: "완성된 여행을 공유하고 후기를 남기세요" },
              ].map(({ step, title, desc }) => (
                <div key={step} className="flex items-start gap-5 rounded-2xl surface-section p-6">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-base font-extrabold text-primary">{step}</span>
                  <div>
                    <h3 className="mb-1.5 text-base font-bold">{title}</h3>
                    <p className="text-body-sm text-muted-foreground">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.section>

          {/* ── Social Proof — editorial quote style ── */}
          <motion.section className="section-gap" variants={fadeUp}>
            <div className="mb-10 text-center">
              <span className="chip chip-primary mb-3 text-caption font-semibold tracking-widest">여행자 후기</span>
              <h2 className="text-headline text-foreground mt-2">여행자들의 한마디</h2>
            </div>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-3 sm:gap-6">
              {[
                { name: "하늘", city: "도쿄", text: "구글맵에서 바로 검색하고 일정에 넣으니까 계획 시간이 확 줄었어요!" },
                { name: "민수", city: "오사카", text: "이동 시간 자동 계산이 진짜 편해요. 동선 짤 때 고민이 줄었습니다." },
                { name: "지연", city: "교토", text: "커뮤니티에서 다른 분 일정 참고하니까 처음 가는 곳도 두렵지 않았어요." },
              ].map(({ name, city, text }) => (
                <div key={name} className="relative flex flex-col rounded-2xl surface-section p-7">
                  <span className="absolute -top-2 left-6 text-5xl font-serif text-primary/15 select-none">"</span>
                  <p className="mb-6 flex-1 text-body-sm leading-relaxed text-muted-foreground italic">{text}</p>
                  <div className="flex items-center gap-3 border-t border-border/50 pt-4">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">{name[0]}</div>
                    <div>
                      <p className="text-body-sm font-semibold">{name}</p>
                      <p className="text-caption text-muted-foreground">{city} 여행</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.section>

          {/* ── CTA — premium campaign block ── */}
          <motion.section className="section-gap text-center" variants={fadeUp}>
            <div className="rounded-3xl bg-gradient-to-br from-primary/8 via-primary/4 to-indigo/6 px-8 py-14 sm:px-16 sm:py-16 border border-primary/10">
              <h2 className="text-headline text-foreground mb-3">지금 바로 여행 계획을 시작하세요</h2>
              <p className="text-body text-muted-foreground mb-8">회원가입 없이도 플래닝이 가능합니다</p>
              <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
                <button
                  onClick={() => navigate("/planner?new=true")}
                  className="btn-gradient btn-base btn-lg shadow-lg"
                >
                  <Map className="h-5 w-5" />
                  일정 만들기
                </button>
                <button
                  onClick={() => navigate("/community")}
                  className="btn-base btn-lg border border-border bg-card text-foreground shadow-sm hover:bg-muted"
                >
                  <Users className="h-5 w-5" />
                  다른 여행자 구경하기
                </button>
              </div>
            </div>
          </motion.section>

          {/* ── Footer ── */}
          <motion.footer className="border-t border-border/60 pt-10 text-center" variants={fadeUp}>
            <p className="text-caption text-muted-foreground">© 2026 타비톡 · All rights reserved</p>
          </motion.footer>
        </motion.div>
      </div>
    </div>
  )
}
