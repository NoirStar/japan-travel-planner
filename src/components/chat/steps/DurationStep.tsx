import { motion } from "framer-motion"
import type { WizardOption } from "@/types/wizard"

interface DurationStepProps {
  options: WizardOption[]
  onSelect: (id: string) => void
}

export function DurationStep({ options, onSelect }: DurationStepProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.15 }}
      className="flex flex-wrap gap-2"
      data-testid="duration-step"
    >
      {options.map((opt) => (
        <button
          key={opt.id}
          onClick={() => onSelect(opt.id)}
          className="rounded-full border border-border bg-card px-5 py-2.5 text-sm font-medium shadow-sm transition-all hover:bg-primary hover:text-primary-foreground hover:shadow-md"
          data-testid={`duration-option-${opt.id}`}
        >
          {opt.emoji && <span className="mr-1.5">{opt.emoji}</span>}
          {opt.label}
        </button>
      ))}
    </motion.div>
  )
}
