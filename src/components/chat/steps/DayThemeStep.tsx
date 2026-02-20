import { motion } from "framer-motion"
import type { WizardOption } from "@/types/wizard"
import { THEME_ICONS } from "@/lib/categoryIcons"

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
          className="flex items-center gap-3 rounded-2xl bg-card p-3 text-left shadow-sm ring-1 ring-border/50 transition-all hover:shadow-md hover:ring-sakura-dark/40 active:scale-[0.98]"
          data-testid={`daytheme-option-${opt.id}`}
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-sakura/20 to-indigo/10">
            {(() => { const Icon = THEME_ICONS[opt.id]; return Icon ? <Icon className="h-5 w-5 text-sakura-dark" /> : null })()}
          </div>
          <div>
            <h4 className="font-semibold text-sm">{opt.label}</h4>
            {opt.description && (
              <p className="text-[11px] text-muted-foreground">{opt.description}</p>
            )}
          </div>
        </button>
      ))}
    </motion.div>
  )
}
