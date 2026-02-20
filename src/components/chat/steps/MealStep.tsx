import { motion } from "framer-motion"
import { Star, UtensilsCrossed, SkipForward } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { WizardOption, MealType } from "@/types/wizard"

interface MealStepProps {
  options: WizardOption[]
  dayNumber: number
  mealType: MealType
  onSelect: (id: string) => void
  onSkip: () => void
}

export function MealStep({ options, dayNumber, mealType, onSelect, onSkip }: MealStepProps) {
  const mealLabel = mealType === "lunch" ? "점심" : "저녁"

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.15 }}
      className="flex flex-col gap-3"
      data-testid={`meal-step-${dayNumber}-${mealType}`}
    >
      <div className="grid grid-cols-2 gap-2">
        {options.map((opt) => (
          <button
            key={opt.id}
            onClick={() => onSelect(opt.id)}
            className="flex flex-col items-start gap-1 rounded-2xl bg-card p-3 text-left shadow-sm ring-1 ring-border/50 transition-all hover:shadow-md hover:ring-sakura-dark/40 active:scale-[0.98]"
            data-testid={`meal-option-${opt.id}`}
          >
            <UtensilsCrossed className="h-5 w-5 text-muted-foreground" />
            <h4 className="font-semibold text-sm leading-tight">{opt.label}</h4>
            {opt.rating && (
              <span className="flex items-center gap-0.5 text-[11px] text-muted-foreground">
                <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                {opt.rating}
              </span>
            )}
            {opt.description && (
              <p className="text-[11px] text-muted-foreground line-clamp-2">
                {opt.description}
              </p>
            )}
          </button>
        ))}
      </div>
      <Button
        variant="ghost"
        size="sm"
        className="self-start text-xs hover:bg-muted"
        onClick={onSkip}
        data-testid={`meal-skip-${dayNumber}-${mealType}`}
      >
        <SkipForward className="mr-1 inline h-3.5 w-3.5" /> {mealLabel} 건너뛰기
      </Button>
    </motion.div>
  )
}
