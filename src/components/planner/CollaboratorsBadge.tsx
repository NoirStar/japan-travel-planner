import { Wifi, WifiOff, Loader2 } from "lucide-react"
import type { OnlineMember } from "@/hooks/useCollaborativeSync"

interface CollaboratorsBadgeProps {
  isConnected: boolean
  isSyncing: boolean
  onlineMembers: OnlineMember[]
}

/** 아바타 팔레트 (멤버별 색상 구분) */
const AVATAR_COLORS = [
  "bg-primary",
  "bg-primary",
  "bg-success",
  "bg-info",
  "bg-warning",
  "bg-primary-light",
]

export function CollaboratorsBadge({
  isConnected,
  isSyncing,
  onlineMembers,
}: CollaboratorsBadgeProps) {
  return (
    <div
      className="flex items-center gap-1.5 rounded-full border border-border bg-card px-2.5 py-1"
      data-testid="collaborators-badge"
    >
      {/* 동기화 상태 */}
      {isSyncing ? (
        <Loader2 className="h-3 w-3 animate-spin text-warning" />
      ) : isConnected ? (
        <Wifi className="h-3 w-3 text-success" />
      ) : (
        <WifiOff className="h-3 w-3 text-muted-foreground" />
      )}

      {/* 온라인 아바타 스택 */}
      <div className="flex -space-x-1.5">
        {onlineMembers.slice(0, 4).map((m, i) => (
          <div
            key={m.userId}
            className={`flex h-5 w-5 items-center justify-center rounded-full border-2 border-card text-[9px] font-bold text-white ${AVATAR_COLORS[i % AVATAR_COLORS.length]}`}
            title={m.nickname}
          >
            {m.avatarUrl ? (
              <img src={m.avatarUrl} alt={m.nickname} className="h-full w-full rounded-full object-cover" />
            ) : (
              m.nickname.charAt(0).toUpperCase()
            )}
          </div>
        ))}
        {onlineMembers.length > 4 && (
          <div className="flex h-5 w-5 items-center justify-center rounded-full border-2 border-card bg-muted text-[9px] font-bold text-muted-foreground">
            +{onlineMembers.length - 4}
          </div>
        )}
      </div>

      {/* 온라인 수 */}
      {onlineMembers.length > 0 && (
        <span className="text-[10px] font-medium text-muted-foreground">
          {onlineMembers.length}명 온라인
        </span>
      )}
    </div>
  )
}
