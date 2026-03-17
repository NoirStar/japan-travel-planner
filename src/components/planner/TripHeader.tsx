import { useState } from "react"
import { Calendar, Save, Pencil, ImagePlus, AlertTriangle, Users, MoreHorizontal } from "lucide-react"
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

/** 날짜를 'M/D' 포맷으로 */
function formatShortDate(dateStr: string): string {
  const d = new Date(dateStr)
  return `${d.getMonth() + 1}/${d.getDate()}`
}

/** 여행 기간 요약 */
function getTripDateSummary(trip: Trip): string {
  if (!trip.startDate) return "날짜 미정"
  const start = formatShortDate(trip.startDate)
  if (!trip.endDate) return start
  const end = formatShortDate(trip.endDate)
  const s = new Date(trip.startDate)
  const e = new Date(trip.endDate)
  const nights = Math.round((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24))
  return `${start} ~ ${end} (${nights}박${nights + 1}일)`
}

export function TripHeader({ trip, isLoggedIn, onUpdateTrip, onDateChange, collab }: TripHeaderProps) {
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [editTitle, setEditTitle] = useState("")
  const [showCoverInput, setShowCoverInput] = useState(false)
  const [coverUrl, setCoverUrl] = useState("")
  const [isInviteOpen, setIsInviteOpen] = useState(false)
  const [mobileExpanded, setMobileExpanded] = useState(false)

  return (
    <div className="border-b border-border p-4">
      {/* 커버 이미지 — 데스크톱만 기본 표시, 모바일은 expanded 시에만 */}
      {trip.coverImage && (
        <div className={`relative -mx-4 -mt-4 mb-3 h-28 overflow-hidden ${mobileExpanded ? "" : "hidden lg:block"}`}>
          <img src={trip.coverImage} alt="" className="h-full w-full object-cover" />
          <button
            onClick={() => { setShowCoverInput(true); setCoverUrl(trip.coverImage ?? "") }}
            className="absolute bottom-2 right-2 rounded-lg bg-black/50 p-1.5 text-white backdrop-blur-sm hover:bg-black/70 transition-colors"
          >
            <Pencil className="h-3 w-3" />
          </button>
        </div>
      )}

      {/* 여행 이름 */}
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
            className="group flex items-center gap-1.5 text-left min-w-0"
          >
            <h2 className="text-base font-bold truncate">{trip.title}</h2>
            <Pencil className="h-3 w-3 shrink-0 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
          </button>
        )}

        {/* 모바일: 날짜 요약 + 협업 상태 인라인 */}
        <div className="ml-auto flex items-center gap-1.5 lg:hidden">
          {collab?.isShared && (
            <span className="flex items-center gap-1 rounded-full bg-sakura-dark/10 px-2 py-0.5 text-[10px] font-semibold text-sakura-dark">
              <Users className="h-3 w-3" />
              {collab.onlineMembers.length}
            </span>
          )}
          <button
            onClick={() => setMobileExpanded(!mobileExpanded)}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted transition-colors"
          >
            <MoreHorizontal className="h-4 w-4" />
          </button>
        </div>

        {/* 데스크톱: 커버 추가 버튼 */}
        {!trip.coverImage && !showCoverInput && (
          <button
            onClick={() => { setShowCoverInput(true); setCoverUrl("") }}
            className="hidden shrink-0 rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors lg:block"
            title="커버 사진 추가"
          >
            <ImagePlus className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* 모바일: 날짜 요약 한 줄 */}
      <p className="mt-1 text-[11px] text-muted-foreground lg:hidden">
        <Calendar className="mr-1 inline h-3 w-3 text-sakura-dark" />
        {getTripDateSummary(trip)}
      </p>

      {/* 모바일 확장 영역 (날짜 편집, 커버, 공동편집 등) */}
      {mobileExpanded && (
        <div className="mt-3 flex flex-col gap-2 lg:hidden animate-in fade-in slide-in-from-top-2 duration-200">
          {/* 커버 URL 입력 */}
          {!trip.coverImage && (
            <button
              onClick={() => { setShowCoverInput(true); setCoverUrl("") }}
              className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-xs text-muted-foreground hover:bg-muted transition-colors"
            >
              <ImagePlus className="h-4 w-4" />
              커버 사진 추가
            </button>
          )}
          {/* 날짜 입력 */}
          <div className="flex items-center gap-2 rounded-xl border border-border bg-muted/50 p-2.5 dark:bg-muted">
            <Calendar className="h-4 w-4 shrink-0 text-sakura-dark" />
            <input
              type="date"
              value={trip.startDate ?? ""}
              onChange={(e) => onDateChange("startDate", e.target.value)}
              className="h-8 w-full min-w-0 rounded-lg bg-card px-2.5 text-xs font-medium text-foreground outline-none border border-border shadow-sm focus:border-sakura-dark focus:ring-2 focus:ring-sakura/30"
            />
            <span className="shrink-0 text-xs font-bold text-muted-foreground">~</span>
            <input
              type="date"
              value={trip.endDate ?? ""}
              onChange={(e) => onDateChange("endDate", e.target.value)}
              className="h-8 w-full min-w-0 rounded-lg bg-card px-2.5 text-xs font-medium text-foreground outline-none border border-border shadow-sm focus:border-sakura-dark focus:ring-2 focus:ring-sakura/30"
            />
          </div>
          {/* 공동 편집 */}
          {collab?.isShared ? (
            <button
              onClick={() => setIsInviteOpen(true)}
              className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-xs font-medium text-foreground hover:bg-muted transition-colors"
            >
              <Users className="h-4 w-4 text-sakura-dark" />
              멤버 관리
            </button>
          ) : isLoggedIn && isCollabAvailable() ? (
            <button
              onClick={() => setIsInviteOpen(true)}
              className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-xs font-medium text-muted-foreground hover:bg-muted transition-colors"
            >
              <Users className="h-4 w-4" />
              공동 편집 시작
            </button>
          ) : null}
          {/* 저장 상태 */}
          {isLoggedIn ? (
            <span className="flex items-center gap-1 text-[10px] text-emerald-500">
              <Save className="h-3 w-3" />
              자동 저장
            </span>
          ) : (
            <span className="flex items-center gap-1 text-[10px] text-amber-500">
              <AlertTriangle className="h-3 w-3" />
              로그인 후 저장 가능
            </span>
          )}
        </div>
      )}

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

      {/* 데스크톱: 날짜 입력 + 공동 편집 + 자동 저장 */}
      <div className="mt-3 hidden items-center gap-2 rounded-xl border border-border bg-muted/50 p-2.5 dark:bg-muted lg:flex">
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
      <div className="mt-1.5 hidden items-center justify-between lg:flex">
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
