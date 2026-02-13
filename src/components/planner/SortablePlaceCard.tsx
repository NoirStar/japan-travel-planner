import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { PlaceCard } from "./PlaceCard"
import type { Place } from "@/types/place"

interface SortablePlaceCardProps {
  id: string
  place: Place
  index: number
  onRemove: () => void
}

export function SortablePlaceCard({ id, place, index, onRemove }: SortablePlaceCardProps) {
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
      dragHandleListeners={listeners}
      dragHandleAttributes={attributes}
      style={style}
      isDragging={isDragging}
    />
  )
}
