import { motion } from "framer-motion"

interface ChatBubbleProps {
  role: "ai" | "user"
  text: string
}

export function ChatBubble({ role, text }: ChatBubbleProps) {
  const isAI = role === "ai"

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`flex ${isAI ? "justify-start" : "justify-end"}`}
    >
      <div
        className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
          isAI
            ? "rounded-tl-sm bg-muted text-foreground"
            : "rounded-tr-sm bg-primary text-primary-foreground"
        }`}
        data-testid={isAI ? "ai-bubble" : "user-bubble"}
      >
        {isAI && <span className="mr-1.5">🤖</span>}
        {text}
      </div>
    </motion.div>
  )
}
