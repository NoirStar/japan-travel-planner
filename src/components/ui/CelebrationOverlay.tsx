import { useEffect, useState, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { getLevelInfo } from "@/types/community"
import { LEVEL_ICONS } from "@/components/community/levelIconMap"

// ─── Sakura Confetti (CSS petals) ──────────────────────────
interface Petal {
  id: number
  x: number
  delay: number
  duration: number
  size: number
}

function SakuraConfetti({ count = 10 }: { count?: number }) {
  const [petals] = useState<Petal[]>(() =>
    Array.from({ length: count }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      delay: Math.random() * 0.8,
      duration: 2 + Math.random() * 1,
      size: 6 + Math.random() * 4,
    }))
  )

  return (
    <div className="pointer-events-none fixed inset-0 z-[9999] overflow-hidden">
      {petals.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full"
          style={{
            left: `${p.x}%`,
            top: -8,
            width: p.size,
            height: p.size * 0.6,
            backgroundColor: p.id % 3 === 0 ? "#06B6D4" : p.id % 3 === 1 ? "#8B5CF6" : "#EC4899",
            opacity: 0.6,
          }}
          animate={{
            y: ["0vh", "100vh"],
            opacity: [0, 0.5, 0],
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            ease: "easeIn",
          }}
        />
      ))}
    </div>
  )
}

// ─── Level Up Overlay ──────────────────────────────────────
function LevelUpOverlay({ level, onDone }: { level: number; onDone: () => void }) {
  const info = getLevelInfo(level)
  const icon = LEVEL_ICONS[info.level] ?? LEVEL_ICONS[1]

  useEffect(() => {
    const timer = setTimeout(onDone, 3000)
    return () => clearTimeout(timer)
  }, [onDone])

  return (
    <motion.div
      className="pointer-events-none fixed inset-0 z-[9998] flex items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="flex flex-col items-center gap-2 rounded-xl border border-border bg-card px-8 py-6 shadow-lg"
        initial={{ scale: 0.95, y: 10 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
      >
        <motion.span
          className="flex items-center justify-center"
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.1 }}
        >
          {icon(40)}
        </motion.span>
        <p className="text-[11px] font-medium tracking-widest text-muted-foreground">
          LEVEL UP
        </p>
        <p className="text-base font-bold">
          Lv.{level} {info.label}
        </p>
      </motion.div>
    </motion.div>
  )
}

// ─── Toast (text only) ─────────────────────────────────────
interface ToastItem {
  id: number
  message: string
}

// ─── Global event bus ──────────────────────────────────────
type CelebrationEvent =
  | { type: "confetti"; count?: number }
  | { type: "levelup"; level: number }
  | { type: "toast"; message: string }

const listeners = new Set<(e: CelebrationEvent) => void>()

export function celebrate(event: CelebrationEvent) {
  listeners.forEach((fn) => fn(event))
}

export function showToast(message: string) {
  celebrate({ type: "toast", message })
}

export function showConfetti(count?: number) {
  celebrate({ type: "confetti", count })
}

export function showLevelUp(level: number) {
  celebrate({ type: "levelup", level })
  celebrate({ type: "confetti", count: 20 })
}

// ─── Provider Component ────────────────────────────────────
let toastId = 0

export function CelebrationProvider() {
  const [confetti, setConfetti] = useState<{ key: number; count: number } | null>(null)
  const [levelUp, setLevelUp] = useState<number | null>(null)
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const handler = useCallback((e: CelebrationEvent) => {
    switch (e.type) {
      case "confetti":
        setConfetti({ key: Date.now(), count: e.count ?? 22 })
        setTimeout(() => setConfetti(null), 5000)
        break
      case "levelup":
        setLevelUp(e.level)
        break
      case "toast": {
        const id = ++toastId
        setToasts((prev) => [...prev.slice(-2), { id, message: e.message }])
        setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 2500)
        break
      }
    }
  }, [])

  useEffect(() => {
    listeners.add(handler)
    return () => { listeners.delete(handler) }
  }, [handler])

  return (
    <>
      {/* Sakura confetti */}
      {confetti && <SakuraConfetti key={confetti.key} count={confetti.count} />}

      {/* Level up */}
      <AnimatePresence>
        {levelUp !== null && (
          <LevelUpOverlay level={levelUp} onDone={() => setLevelUp(null)} />
        )}
      </AnimatePresence>

      {/* Toasts */}
      <div className="pointer-events-none fixed bottom-6 left-1/2 z-[9997] flex -translate-x-1/2 flex-col items-center gap-2">
        <AnimatePresence mode="popLayout">
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              layout
              initial={{ opacity: 0, y: 16, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.95 }}
              className="pointer-events-auto rounded-lg border border-border bg-card px-4 py-2 text-sm shadow-md"
            >
              {t.message}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </>
  )
}
