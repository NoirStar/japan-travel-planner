import { motion } from "framer-motion"
import type { WizardOption } from "@/types/wizard"

interface CityStepProps {
  options: WizardOption[]
  onSelect: (id: string) => void
}

export function CityStep({ options, onSelect }: CityStepProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.15 }}
      className="grid grid-cols-2 gap-3"
      data-testid="city-step"
    >
      {options.map((opt) => (
        <button
          key={opt.id}
          onClick={() => onSelect(opt.id)}
          className="group overflow-hidden rounded-2xl bg-card text-left shadow-sm ring-1 ring-border/50 transition-all hover:shadow-lg hover:ring-sakura-dark/40 active:scale-[0.98]"
          data-testid={`city-option-${opt.id}`}
        >
          {opt.image && (
            <div className="aspect-[4/3] overflow-hidden">
              <img
                src={opt.image}
                alt={opt.label}
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                loading="lazy"
              />
            </div>
          )}
          <div className="p-3">
            <h3 className="text-sm font-bold">{opt.label}</h3>
            {opt.description && (
              <p className="mt-0.5 text-[11px] text-muted-foreground line-clamp-2">
                {opt.description}
              </p>
            )}
          </div>
        </button>
      ))}
    </motion.div>
  )
}
