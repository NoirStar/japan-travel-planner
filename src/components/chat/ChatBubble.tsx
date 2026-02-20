import { motion } from "framer-motion"
import { Bot } from "lucide-react"

interface ChatBubbleProps {
  role: "ai" | "user"
  text: string
}

export function ChatBubble({ role, text }: ChatBubbleProps) {
  const isAI = role === "ai"

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className={`flex ${isAI ? "justify-start" : "justify-end"}`}
    >
      <div
        className={`max-w-[85%] text-sm leading-relaxed ${
          isAI
            ? "rounded-2xl rounded-tl-md bg-card border border-border/50 text-foreground px-4 py-3 shadow-sm"
            : "rounded-2xl rounded-tr-md bg-gradient-to-r from-sakura-dark to-indigo text-white px-4 py-3 shadow-md"
        }`}
        data-testid={isAI ? "ai-bubble" : "user-bubble"}
      >
        {isAI && <Bot className="mr-1.5 inline h-4 w-4 text-sakura-dark" />}
        {text}
      </div>
    </motion.div>
  )
}
