import { ReservationCard } from "./ReservationCard"
import type { Reservation } from "@/types/schedule"

interface SortableReservationCardProps {
  id: string
  reservation: Reservation
  onEdit: () => void
  onRemove: () => void
}

export function SortableReservationCard({ id: _id, reservation, onEdit, onRemove }: SortableReservationCardProps) {
  return (
    <ReservationCard
      reservation={reservation}
      onEdit={onEdit}
      onRemove={onRemove}
    />
  )
}
