import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
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
}

export function SortablePlaceCard({ id, place, index, onRemove, startTime, memo, onStartTimeChange, onMemoChange, isSelected, onClick }: SortablePlaceCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id })

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <PlaceCard
      ref={setNodeRef}
      place={place}
      index={index}
      onRemove={onRemove}
      startTime={startTime}
      memo={memo}
      onStartTimeChange={onStartTimeChange}
      onMemoChange={onMemoChange}
      isSelected={isSelected}
      onClick={onClick}
      dragHandleListeners={listeners}
      dragHandleAttributes={attributes}
      style={style}
      isDragging={isDragging}
    />
  )
}
