import { useState } from "react"
import { Calendar, Save, Pencil, ImagePlus, AlertTriangle, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { CollaboratorsBadge } from "./CollaboratorsBadge"
import { InviteDialog } from "./InviteDialog"
import type { Trip } from "@/types/schedule"
import type { CollaborativeSyncResult } from "@/hooks/useCollaborativeSync"
import { isCollabAvailable } from "@/services/tripSyncService"

interface TripHeaderProps {
  trip: Trip
  isLoggedIn: boolean
  onUpdateTrip: (tripId: string, patch: Partial<Pick<Trip, "title" | "coverImage">>) => void
  onDateChange: (field: "startDate" | "endDate", value: string) => void
  collab?: CollaborativeSyncResult
}

export function TripHeader({ trip, isLoggedIn, onUpdateTrip, onDateChange, collab }: TripHeaderProps) {
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [editTitle, setEditTitle] = useState("")
  const [showCoverInput, setShowCoverInput] = useState(false)
  const [coverUrl, setCoverUrl] = useState("")
  const [isInviteOpen, setIsInviteOpen] = useState(false)

  return (
    <div className="border-b border-border p-4">
      {/* 커버 이미지 */}
      {trip.coverImage && (
        <div className="relative -mx-4 -mt-4 mb-3 h-28 overflow-hidden">
          <img src={trip.coverImage} alt="" className="h-full w-full object-cover" />
          <button
            onClick={() => { setShowCoverInput(true); setCoverUrl(trip.coverImage ?? "") }}
            className="absolute bottom-2 right-2 rounded-lg bg-black/50 p-1.5 text-white backdrop-blur-sm hover:bg-black/70 transition-colors"
          >
            <Pencil className="h-3 w-3" />
          </button>
        </div>
      )}

      {/* 여행 이름 (편집 가능) */}
      <div className="flex items-center gap-2">
        {isEditingTitle ? (
          <input
            type="text"
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            onBlur={() => {
              const trimmed = editTitle.trim()
              if (trimmed) onUpdateTrip(trip.id, { title: trimmed })
              setIsEditingTitle(false)
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                const trimmed = editTitle.trim()
                if (trimmed) onUpdateTrip(trip.id, { title: trimmed })
                setIsEditingTitle(false)
              } else if (e.key === "Escape") {
                setIsEditingTitle(false)
              }
            }}
            maxLength={30}
            autoFocus
            className="flex-1 rounded-lg border border-border bg-background px-2 py-1 text-base font-bold outline-none focus:ring-2 focus:ring-primary/40"
          />
        ) : (
          <button
            onClick={() => { setEditTitle(trip.title); setIsEditingTitle(true) }}
            className="group flex items-center gap-1.5 text-left"
          >
            <h2 className="text-base font-bold">{trip.title}</h2>
            <Pencil className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
          </button>
        )}
        {!trip.coverImage && !showCoverInput && (
          <button
            onClick={() => { setShowCoverInput(true); setCoverUrl("") }}
            className="shrink-0 rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            title="커버 사진 추가"
          >
            <ImagePlus className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* 커버 URL 입력 */}
      {showCoverInput && (
        <div className="mt-2 flex gap-2">
          <input
            type="url"
            value={coverUrl}
            onChange={(e) => setCoverUrl(e.target.value)}
            placeholder="커버 이미지 URL (https://...)"
            className="flex-1 rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs outline-none focus:ring-2 focus:ring-primary/40"
            autoFocus
          />
          <Button
            size="sm"
            className="h-7 rounded-lg text-xs"
            onClick={() => {
              onUpdateTrip(trip.id, { coverImage: coverUrl || undefined })
              setShowCoverInput(false)
            }}
          >
            저장
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-7 rounded-lg text-xs"
            onClick={() => setShowCoverInput(false)}
          >
            취소
          </Button>
        </div>
      )}
      <div className="mt-3 flex items-center gap-2 rounded-xl border border-border bg-muted/50 p-2.5 dark:bg-muted">
        <Calendar className="h-4 w-4 shrink-0 text-sakura-dark" />
        <input
          type="date"
          value={trip.startDate ?? ""}
          onChange={(e) => onDateChange("startDate", e.target.value)}
          className="h-8 w-full min-w-0 rounded-lg bg-card px-2.5 text-xs font-medium text-foreground outline-none border border-border shadow-sm focus:border-sakura-dark focus:ring-2 focus:ring-sakura/30"
          data-testid="trip-start-date"
        />
        <span className="shrink-0 text-xs font-bold text-muted-foreground">~</span>
        <input
          type="date"
          value={trip.endDate ?? ""}
          onChange={(e) => onDateChange("endDate", e.target.value)}
          className="h-8 w-full min-w-0 rounded-lg bg-card px-2.5 text-xs font-medium text-foreground outline-none border border-border shadow-sm focus:border-sakura-dark focus:ring-2 focus:ring-sakura/30"
          data-testid="trip-end-date"
        />
      </div>
      <div className="mt-1.5 flex items-center justify-between">
        {/* 공동 편집 */}
        <div className="flex items-center gap-2">
          {collab?.isShared ? (
            <>
              <CollaboratorsBadge
                onlineMembers={collab.onlineMembers}
                isConnected={collab.isConnected}
                isSyncing={collab.isSyncing}
              />
              <button
                onClick={() => setIsInviteOpen(true)}
                className="flex items-center gap-1 rounded-lg bg-sakura-dark/10 px-2 py-1 text-[10px] font-semibold text-sakura-dark hover:bg-sakura-dark/20 transition-colors"
              >
                <Users className="h-3 w-3" />
                멤버
              </button>
            </>
          ) : isLoggedIn && isCollabAvailable() ? (
            <button
              onClick={() => setIsInviteOpen(true)}
              className="flex items-center gap-1 rounded-lg border border-border px-2 py-1 text-[10px] font-semibold text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            >
              <Users className="h-3 w-3" />
              공동 편집
            </button>
          ) : null}
        </div>
        {isLoggedIn ? (
          <span className="flex items-center gap-1 text-[10px] text-emerald-500" data-testid="auto-save-indicator">
            <Save className="h-3 w-3" />
            자동 저장
          </span>
        ) : (
          <span className="flex items-center gap-1 text-[10px] text-amber-500" data-testid="auto-save-indicator">
            <AlertTriangle className="h-3 w-3" />
            로그인 후 저장 가능
          </span>
        )}
      </div>

      {/* 초대 다이얼로그 */}
      {collab && (
        <InviteDialog
          open={isInviteOpen}
          onOpenChange={setIsInviteOpen}
          inviteCode={collab.inviteCode}
          members={collab.members}
          myRole={collab.myRole}
          isShared={collab.isShared}
          sharedId={trip.sharedId}
          onShare={collab.shareTrip}
          onRefreshMembers={collab.refreshMembers}
        />
      )}
    </div>
  )
}
