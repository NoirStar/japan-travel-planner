import { PlaceCard } from "./PlaceCard"
import type { Place } from "@/types/place"

interface SortablePlaceCardProps {
  id: string
  place: Place
  index: number
  onRemove: () => void
  startTime?: string
  memo?: string
  onStartTimeChange?: (time: string) => void
  onMemoChange?: (memo: string) => void
  isSelected?: boolean
  onClick?: () => void
  onMoveUp?: () => void
  onMoveDown?: () => void
  onMoveToTop?: () => void
  onMoveToBottom?: () => void
  isFirst?: boolean
  isLast?: boolean
}

export function SortablePlaceCard({ id: _id, ...props }: SortablePlaceCardProps) {
  return <PlaceCard {...props} />
}
