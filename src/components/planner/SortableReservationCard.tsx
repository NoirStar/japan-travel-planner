import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { ReservationCard } from "./ReservationCard"
import type { Reservation } from "@/types/schedule"

interface SortableReservationCardProps {
  id: string
  reservation: Reservation
  onEdit: () => void
  onRemove: () => void
}

export function SortableReservationCard({ id, reservation, onEdit, onRemove }: SortableReservationCardProps) {
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
    <ReservationCard
      ref={setNodeRef}
      reservation={reservation}
      onEdit={onEdit}
      onRemove={onRemove}
      dragHandleListeners={listeners}
      dragHandleAttributes={attributes}
      style={style}
      isDragging={isDragging}
    />
  )
}
