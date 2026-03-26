import { useState } from "react"
import { Calendar, Pencil, MapPin, Users, Share2, FileDown, CalendarDays, Ticket, Bookmark, ClipboardCheck, Wallet, TrainFront, History, Paperclip, ChevronDown, ChevronRight, Eye } from "lucide-react"
import { useScheduleStore } from "@/stores/scheduleStore"
import { useAuthStore } from "@/stores/authStore"
import { cities as CITIES } from "@/data/cities"
import { CollaboratorsBadge } from "./CollaboratorsBadge"
import { InviteDialog } from "./InviteDialog"
import { copyShareUrl } from "@/lib/shareUtils"
import { showToast } from "@/components/ui/CelebrationOverlay"
import { isCollabAvailable } from "@/services/tripSyncService"
import { TRIP_VISIBILITY_LABELS } from "@/types/schedule"
import type { TripVisibility } from "@/types/schedule"
import type { CollaborativeSyncResult } from "@/hooks/useCollaborativeSync"

interface TripRailProps {
  activeDayIndex: number
  onActiveDayIndexChange: (index: number) => void
  collab?: CollaborativeSyncResult
  onOpenWishlist: () => void
  onOpenChecklist: () => void
  onOpenBudget: () => void
  onOpenTransportPass: () => void
  onOpenAttachmentVault: () => void
  onOpenChangeHistory: () => void
  onOpenReservation: () => void
  wishlistCount: number
}

function getDayDateLabel(startDate: string, dayIndex: number): string {
  const d = new Date(startDate)
  d.setDate(d.getDate() + dayIndex)
  return `${d.getMonth() + 1}/${d.getDate()}`
}

export function TripRail({
  activeDayIndex,
  onActiveDayIndexChange,
  collab,
  onOpenWishlist,
  onOpenChecklist,
  onOpenBudget,
  onOpenTransportPass,
  onOpenAttachmentVault,
  onOpenChangeHistory,
  onOpenReservation,
  wishlistCount,
}: TripRailProps) {
  const trip = useScheduleStore((s) => s.getActiveTrip())
  const { updateTrip, addDay } = useScheduleStore()
  const { user } = useAuthStore()

  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [editTitle, setEditTitle] = useState("")
  const [isInviteOpen, setIsInviteOpen] = useState(false)
  const [toolsExpanded, setToolsExpanded] = useState(false)

  if (!trip) return null

  const isLoggedIn = !!user
  const canCollab = isCollabAvailable()
  const allCityIds = [trip.cityId, ...(trip.cities ?? [])]
  const cityNames = allCityIds.map((id) => CITIES.find((c) => c.id === id)?.name ?? id)

  const handleTitleSave = () => {
    const trimmed = editTitle.trim()
    if (trimmed && trimmed !== trip.title) {
      updateTrip(trip.id, { title: trimmed })
    }
    setIsEditingTitle(false)
  }

  const handleDateChange = (field: "startDate" | "endDate", value: string) => {
    if (value && Number.isNaN(new Date(value).getTime())) return
    const start = field === "startDate" ? value : trip.startDate
    const end = field === "endDate" ? value : trip.endDate
    if (start && end && start > end) {
      updateTrip(trip.id, { startDate: value, endDate: value })
    } else {
      updateTrip(trip.id, { [field]: value })
    }
    // Day 수 자동 조정
    const effectiveStart = field === "startDate" ? value : trip.startDate
    const effectiveEnd = field === "endDate" ? value : trip.endDate
    if (!effectiveStart || !effectiveEnd || effectiveStart > effectiveEnd) return
    const diffDays = Math.round((new Date(effectiveEnd).getTime() - new Date(effectiveStart).getTime()) / (1000 * 60 * 60 * 24)) + 1
    if (diffDays < 1 || diffDays > 30) return
    if (diffDays > trip.days.length) {
      for (let i = trip.days.length; i < diffDays; i++) addDay(trip.id)
    }
  }

  const toolItems = [
    { icon: Ticket, label: "예약", color: "text-warning", onClick: onOpenReservation },
    { icon: Bookmark, label: "북마크", color: "text-primary", onClick: onOpenWishlist, badge: wishlistCount },
    { icon: ClipboardCheck, label: "준비물", color: "text-success", onClick: onOpenChecklist },
    { icon: Wallet, label: "예산", color: "text-success", onClick: onOpenBudget },
    { icon: TrainFront, label: "패스", color: "text-nebula", onClick: onOpenTransportPass },
    { icon: Paperclip, label: "첨부함", color: "text-nebula", onClick: onOpenAttachmentVault },
    ...(collab?.isShared ? [{ icon: History, label: "이력", color: "text-nebula-light", onClick: onOpenChangeHistory }] : []),
  ]

  return (
    <div className="flex h-full flex-col bg-card border-r border-border/30 overflow-y-auto">
      {/* Trip Title */}
      <div className="p-4 border-b border-border/30">
        {isEditingTitle ? (
          <input
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            onBlur={handleTitleSave}
            onKeyDown={(e) => e.key === "Enter" && handleTitleSave()}
            className="w-full rounded-lg bg-muted px-3 py-1.5 text-sm font-semibold outline-none focus:ring-2 focus:ring-primary/40"
            autoFocus
            maxLength={40}
          />
        ) : (
          <button
            className="group flex w-full items-center gap-2 text-left"
            onClick={() => { setEditTitle(trip.title); setIsEditingTitle(true) }}
          >
            <h2 className="text-sm font-bold text-foreground truncate flex-1">{trip.title}</h2>
            <Pencil className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
          </button>
        )}
        <div className="flex items-center gap-1 mt-1.5 text-xs text-muted-foreground">
          <MapPin className="h-3 w-3 shrink-0" />
          <span className="truncate">{cityNames.join(", ")}</span>
        </div>
      </div>

      {/* Dates */}
      <div className="px-4 py-3 border-b border-border/30">
        <div className="flex items-center gap-1.5 mb-2 text-xs font-medium text-muted-foreground">
          <Calendar className="h-3 w-3" />
          여행 날짜
        </div>
        <div className="flex gap-2">
          <input
            type="date"
            value={trip.startDate ?? ""}
            onChange={(e) => handleDateChange("startDate", e.target.value)}
            className="flex-1 rounded-lg border border-border bg-muted px-2 py-1.5 text-xs outline-none focus:ring-2 focus:ring-primary/40"
            data-testid="trip-start-date"
          />
          <input
            type="date"
            value={trip.endDate ?? ""}
            onChange={(e) => handleDateChange("endDate", e.target.value)}
            className="flex-1 rounded-lg border border-border bg-muted px-2 py-1.5 text-xs outline-none focus:ring-2 focus:ring-primary/40"
            data-testid="trip-end-date"
          />
        </div>
      </div>

      {/* Day Selector */}
      <div className="px-4 py-3 border-b border-border/30">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-muted-foreground">일정 ({trip.days.length}일)</span>
          <button
            className="text-[10px] font-medium text-primary hover:underline"
            onClick={() => addDay(trip.id)}
          >
            + Day 추가
          </button>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {trip.days.map((day, idx) => {
            const isActive = idx === activeDayIndex
            const itemCount = day.items.length
            return (
              <button
                key={day.id}
                onClick={() => onActiveDayIndexChange(idx)}
                className={`flex flex-col items-center rounded-lg px-2.5 py-1.5 text-[11px] font-medium transition-all ${
                  isActive
                    ? "bg-primary/15 text-primary ring-1 ring-primary/30"
                    : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
                }`}
                data-testid={`day-tab-${day.dayNumber}`}
              >
                <span className="font-bold">D{day.dayNumber}</span>
                {trip.startDate && (
                  <span className="text-[9px] opacity-70">{getDayDateLabel(trip.startDate, idx)}</span>
                )}
                {itemCount > 0 && (
                  <span className={`mt-0.5 text-[9px] ${isActive ? "text-primary/70" : "text-muted-foreground/60"}`}>
                    {itemCount}곳
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Collaboration */}
      {isLoggedIn && canCollab && (
        <div className="px-4 py-3 border-b border-border/30">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-muted-foreground">
              <Users className="inline h-3 w-3 mr-1" />
              협업
            </span>
            {collab?.isShared && (
              <CollaboratorsBadge
                isConnected={collab.isConnected}
                isSyncing={collab.isSyncing}
                onlineMembers={collab.onlineMembers}
              />
            )}
          </div>
          <button
            onClick={() => setIsInviteOpen(true)}
            className="w-full rounded-lg bg-primary/10 px-3 py-2 text-xs font-medium text-primary hover:bg-primary/15 transition-colors text-center"
          >
            {collab?.isShared ? "멤버 관리" : "공유 & 초대"}
          </button>
        </div>
      )}

      {/* Visibility */}
      <div className="px-4 py-3 border-b border-border/30">
        <div className="flex items-center gap-1.5 mb-2 text-xs font-medium text-muted-foreground">
          <Eye className="h-3 w-3" />
          공개 설정
        </div>
        <select
          value={trip.visibility ?? "private"}
          onChange={(e) => updateTrip(trip.id, { visibility: e.target.value as TripVisibility })}
          className="w-full rounded-lg border border-border bg-muted px-2 py-1.5 text-xs outline-none cursor-pointer"
        >
          {Object.entries(TRIP_VISIBILITY_LABELS).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
      </div>

      {/* Tools */}
      <div className="px-4 py-3 flex-1">
        <button
          className="flex w-full items-center justify-between text-xs font-medium text-muted-foreground mb-2"
          onClick={() => setToolsExpanded(!toolsExpanded)}
        >
          <span>여행 도구</span>
          {toolsExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
        </button>
        {toolsExpanded && (
          <div className="grid grid-cols-2 gap-1.5 animate-in fade-in slide-in-from-top-2 duration-200">
            {toolItems.map((tool) => (
              <button
                key={tool.label}
                onClick={tool.onClick}
                className="relative flex items-center gap-2 rounded-lg border border-border bg-card px-2.5 py-2 text-xs font-medium text-foreground hover:bg-muted transition-colors"
              >
                <tool.icon className={`h-3.5 w-3.5 ${tool.color}`} />
                {tool.label}
                {tool.badge && tool.badge > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[9px] font-bold text-primary-foreground">
                    {tool.badge}
                  </span>
                )}
              </button>
            ))}
          </div>
        )}

        {/* Quick Actions */}
        <div className="mt-3 flex flex-col gap-1">
          <button
            className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-xs font-medium text-foreground hover:bg-muted transition-colors"
            onClick={async () => {
              if (!trip) return
              const ok = await copyShareUrl(trip)
              showToast(ok ? "링크가 복사되었습니다!" : "복사에 실패했습니다")
            }}
          >
            <Share2 className="h-3.5 w-3.5 text-muted-foreground" />
            공유 링크 복사
          </button>
          <button
            className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-xs font-medium text-foreground hover:bg-muted transition-colors"
            onClick={async () => {
              if (!trip) return
              showToast("PDF 생성 중...")
              const { downloadTripPdf } = await import("@/lib/exportPdf")
              const result = await downloadTripPdf(trip)
              showToast(result.ok ? "PDF가 다운로드되었습니다!" : (result.error ?? "PDF 생성에 실패했습니다"))
            }}
          >
            <FileDown className="h-3.5 w-3.5 text-muted-foreground" />
            PDF 내보내기
          </button>
          <button
            className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-xs font-medium text-foreground hover:bg-muted transition-colors"
            onClick={async () => {
              if (!trip) return
              const { downloadTripIcs } = await import("@/lib/exportIcs")
              downloadTripIcs(trip)
              showToast("캘린더 파일이 다운로드되었습니다!")
            }}
          >
            <CalendarDays className="h-3.5 w-3.5 text-muted-foreground" />
            캘린더 내보내기
          </button>
        </div>
      </div>

      {/* Invite Dialog */}
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
