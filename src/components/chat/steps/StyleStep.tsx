import { useState } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import type { WizardOption } from "@/types/wizard"
import { STYLE_ICONS } from "@/lib/categoryIcons"

interface StyleStepProps {
  options: WizardOption[]
  onSelect: (ids: string[]) => void
}

export function StyleStep({ options, onSelect }: StyleStepProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set())

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.15 }}
      className="flex flex-col gap-3"
      data-testid="style-step"
    >
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => {
          const isActive = selected.has(opt.id)
          return (
            <button
              key={opt.id}
              onClick={() => toggle(opt.id)}
              className={`rounded-full border px-4 py-2 text-sm font-medium transition-all ${
                isActive
                  ? "border-transparent bg-gradient-to-r from-sakura-dark to-indigo text-white shadow-md"
                  : "border-border/50 bg-card hover:border-sakura/50 hover:shadow-sm"
              }`}
              data-testid={`style-option-${opt.id}`}
            >
              {(() => { const Icon = STYLE_ICONS[opt.id]; return Icon ? <Icon className="mr-1 inline h-4 w-4" /> : null })()}
              {opt.label}
            </button>
          )
        })}
      </div>
      <Button
        onClick={() => onSelect([...selected])}
        disabled={selected.size === 0}
        size="sm"
        className="self-start btn-gradient rounded-full border-0 px-6"
        data-testid="style-confirm"
      >
        선택 완료 ({selected.size}개)
      </Button>
    </motion.div>
  )
}
