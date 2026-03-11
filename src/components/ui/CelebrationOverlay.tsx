import { useEffect, useState, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { getLevelInfo } from "@/types/community"

// ─── Sakura Confetti ───────────────────────────────────────
interface Petal {
  id: number
  x: number
  delay: number
  duration: number
  size: number
  rotation: number
}

function SakuraConfetti({ count = 30 }: { count?: number }) {
  const [petals] = useState<Petal[]>(() =>
    Array.from({ length: count }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      delay: Math.random() * 1.5,
      duration: 2.5 + Math.random() * 2,
      size: 8 + Math.random() * 12,
      rotation: Math.random() * 360,
    }))
  )

  return (
    <div className="pointer-events-none fixed inset-0 z-[9999] overflow-hidden">
      {petals.map((p) => (
        <motion.div
          key={p.id}
          className="absolute"
          style={{ left: `${p.x}%`, top: -20, fontSize: p.size }}
          initial={{ y: -30, rotate: p.rotation, opacity: 0 }}
          animate={{
            y: "110vh",
            rotate: p.rotation + 360,
            x: [0, 15, -10, 20, 5],
            opacity: [0, 0.9, 0.9, 0.7, 0],
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            ease: "easeIn",
          }}
        >
          🌸
        </motion.div>
      ))}
    </div>
  )
}

// ─── Level Up Overlay ──────────────────────────────────────
function LevelUpOverlay({ level, onDone }: { level: number; onDone: () => void }) {
  const info = getLevelInfo(level)

  useEffect(() => {
    const timer = setTimeout(onDone, 3500)
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
        className="flex flex-col items-center gap-3 rounded-3xl border border-primary/20 bg-card/90 px-10 py-8 shadow-2xl backdrop-blur-md"
        initial={{ scale: 0.5, y: 40 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.8, opacity: 0 }}
        transition={{ type: "spring", damping: 15, stiffness: 200 }}
      >
        <motion.span
          className="text-5xl"
          animate={{ scale: [1, 1.3, 1], rotate: [0, 10, -10, 0] }}
          transition={{ duration: 0.8, delay: 0.3 }}
        >
          {info.emoji}
        </motion.span>
        <motion.p
          className="text-xs font-semibold text-primary"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          LEVEL UP!
        </motion.p>
        <motion.p
          className="text-lg font-bold"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          Lv.{level} {info.label}
        </motion.p>
      </motion.div>
    </motion.div>
  )
}

// ─── Toast ─────────────────────────────────────────────────
interface ToastItem {
  id: number
  message: string
  emoji?: string
  type?: "success" | "info"
}

// ─── Global event bus ──────────────────────────────────────
type CelebrationEvent =
  | { type: "confetti"; count?: number }
  | { type: "levelup"; level: number }
  | { type: "toast"; message: string; emoji?: string; toastType?: "success" | "info" }

const listeners = new Set<(e: CelebrationEvent) => void>()

export function celebrate(event: CelebrationEvent) {
  listeners.forEach((fn) => fn(event))
}

export function showToast(message: string, emoji?: string) {
  celebrate({ type: "toast", message, emoji })
}

export function showConfetti(count?: number) {
  celebrate({ type: "confetti", count })
}

export function showLevelUp(level: number) {
  celebrate({ type: "levelup", level })
  celebrate({ type: "confetti", count: 40 })
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
        setConfetti({ key: Date.now(), count: e.count ?? 30 })
        setTimeout(() => setConfetti(null), 5000)
        break
      case "levelup":
        setLevelUp(e.level)
        break
      case "toast": {
        const id = ++toastId
        setToasts((prev) => [...prev.slice(-3), { id, message: e.message, emoji: e.emoji, type: e.toastType }])
        setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3000)
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
              initial={{ opacity: 0, y: 20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              className="pointer-events-auto flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-medium shadow-lg"
            >
              {t.emoji && <span className="text-base">{t.emoji}</span>}
              {t.message}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </>
  )
}
