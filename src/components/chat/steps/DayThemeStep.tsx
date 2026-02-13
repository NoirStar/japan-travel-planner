import { motion } from "framer-motion"
import type { WizardOption } from "@/types/wizard"

interface DayThemeStepProps {
  options: WizardOption[]
  dayNumber: number
  onSelect: (id: string) => void
}

export function DayThemeStep({ options, dayNumber, onSelect }: DayThemeStepProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.15 }}
      className="flex flex-col gap-2"
      data-testid={`daytheme-step-${dayNumber}`}
    >
      {options.map((opt) => (
        <button
          key={opt.id}
          onClick={() => onSelect(opt.id)}
          className="flex items-center gap-3 rounded-xl border border-border bg-card p-3 text-left shadow-sm transition-all hover:shadow-md hover:ring-2 hover:ring-primary/50"
          data-testid={`daytheme-option-${opt.id}`}
        >
          <span className="text-2xl">{opt.emoji}</span>
          <div>
            <h4 className="font-semibold text-sm">{opt.label}</h4>
            {opt.description && (
              <p className="text-xs text-muted-foreground">{opt.description}</p>
            )}
          </div>
        </button>
      ))}
    </motion.div>
  )
}
