import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { motion } from "framer-motion"
import { Sparkles, Pencil, Send } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
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
  visible: { opacity: 1, y: 0 },
}

export function LandingPage() {
  const [prompt, setPrompt] = useState("")
  const navigate = useNavigate()

  const handleAIRecommend = () => {
    if (prompt.trim()) {
      navigate(`/planner?ai=${encodeURIComponent(prompt.trim())}`)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && prompt.trim()) {
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
    <motion.div
      className="flex min-h-screen flex-col items-center justify-center px-4 pt-16"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Hero */}
      <motion.div className="mb-10 flex flex-col items-center text-center" variants={itemVariants}>
        <img
          src="/logo.png"
          alt="타비톡 로고"
          className="mb-4 h-48 w-48 rounded-2xl shadow-lg sm:h-56 sm:w-56"
        />
        <p className="text-lg text-muted-foreground">
          나만의 완벽한 일본 여행을 계획하세요
        </p>
      </motion.div>

      {/* AI 입력 */}
      <motion.div className="mb-6 w-full max-w-xl" variants={itemVariants}>
        <div className="relative flex items-center gap-2">
          <Sparkles className="pointer-events-none absolute left-3 h-5 w-5 text-muted-foreground" />
          <Input
            placeholder='"도쿄 2박3일 맛집 위주로 추천해줘"'
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={handleKeyDown}
            className="h-12 pl-10 pr-4 text-base"
            aria-label="AI 추천 입력"
          />
          <Button
            size="lg"
            onClick={handleAIRecommend}
            disabled={!prompt.trim()}
            className="h-12 gap-2 shrink-0"
          >
            <Send className="h-4 w-4" />
            추천받기
          </Button>
        </div>
      </motion.div>

      {/* 또는 */}
      <motion.div
        className="mb-6 flex items-center gap-4 text-muted-foreground"
        variants={itemVariants}
      >
        <div className="h-px w-16 bg-border" />
        <span className="text-sm">또는</span>
        <div className="h-px w-16 bg-border" />
      </motion.div>

      {/* 커스텀 만들기 */}
      <motion.div variants={itemVariants}>
        <Button
          variant="outline"
          size="lg"
          onClick={handleCustom}
          className="gap-2 text-base"
        >
          <Pencil className="h-4 w-4" />
          직접 커스텀으로 만들기
        </Button>
      </motion.div>

      {/* 인기 도시 */}
      <motion.div className="mt-16 w-full max-w-4xl" variants={itemVariants}>
        <h2 className="mb-6 text-center text-lg font-semibold text-muted-foreground">
          인기 여행지
        </h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {cities.map((city) => (
            <motion.div
              key={city.id}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
            >
              <Card
                className="cursor-pointer overflow-hidden transition-shadow hover:shadow-lg"
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
                <div className="relative h-32 overflow-hidden bg-muted sm:h-40">
                  <img
                    src={city.image}
                    alt={city.name}
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute bottom-2 left-3 text-white">
                    <p className="text-lg font-bold">{city.name}</p>
                    <p className="text-xs opacity-80">{city.nameEn}</p>
                  </div>
                </div>
                <CardContent className="p-3">
                  <p className="text-xs text-muted-foreground">{city.description}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Footer */}
      <motion.footer
        className="mt-16 mb-8 text-center text-sm text-muted-foreground"
        variants={itemVariants}
      >
        <p>© 2026 TabiTalk. 당신의 완벽한 여행을 응원합니다.</p>
      </motion.footer>
    </motion.div>
  )
}
