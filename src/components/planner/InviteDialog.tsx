import { useState, useCallback } from "react"
import { X, Copy, Check, Users, Crown, Pencil, Eye, UserMinus, Link } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { TripMember, MemberRole } from "@/services/tripSyncService"
import { removeMember } from "@/services/tripSyncService"

interface InviteDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  inviteCode: string | null
  members: TripMember[]
  myRole: MemberRole | null
  isShared: boolean
  sharedId?: string
  onShare: () => Promise<string | null>
  onRefreshMembers: () => Promise<void>
}

const ROLE_ICONS: Record<MemberRole, typeof Crown> = {
  owner: Crown,
  editor: Pencil,
  viewer: Eye,
}

const ROLE_LABELS: Record<MemberRole, string> = {
  owner: "소유자",
  editor: "편집자",
  viewer: "뷰어",
}

export function InviteDialog({
  open,
  onOpenChange,
  inviteCode,
  members,
  myRole,
  isShared,
  sharedId,
  onShare,
  onRefreshMembers,
}: InviteDialogProps) {
  const [copied, setCopied] = useState(false)
  const [isSharing, setIsSharing] = useState(false)
  const [shareError, setShareError] = useState<string | null>(null)

  const inviteUrl = inviteCode
    ? `${window.location.origin}/collab/${inviteCode}`
    : null

  const handleCopy = useCallback(async () => {
    if (!inviteUrl) return
    try {
      await navigator.clipboard.writeText(inviteUrl)
    } catch {
      // clipboard API 미지원/실패 시 fallback
      const ta = document.createElement("textarea")
      ta.value = inviteUrl
      ta.style.cssText = "position:fixed;opacity:0"
      document.body.appendChild(ta)
      ta.select()
      document.execCommand("copy")
      document.body.removeChild(ta)
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [inviteUrl])

  const handleShare = useCallback(async () => {
    setIsSharing(true)
    setShareError(null)
    try {
      await onShare()
    } catch (e) {
      setShareError(e instanceof Error ? e.message : "초대 링크 생성에 실패했습니다. 다시 시도해 주세요.")
    } finally {
      setIsSharing(false)
    }
  }, [onShare])

  const handleRemoveMember = useCallback(async (userId: string) => {
    if (!sharedId) return
    await removeMember(sharedId, userId)
    await onRefreshMembers()
  }, [sharedId, onRefreshMembers])

  if (!open) return null

  return (
    <>
      {/* 백드롭 */}
      <div
        className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
        onClick={() => onOpenChange(false)}
      />

      {/* 다이얼로그 */}
      <div className="fixed inset-x-4 top-1/2 z-50 mx-auto max-w-sm -translate-y-1/2 overflow-hidden rounded-2xl border border-border bg-card p-5 shadow-xl" data-testid="invite-dialog">
        {/* 헤더 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-sakura-dark" />
            <h3 className="text-base font-bold">공동 편집</h3>
          </div>
          <button
            onClick={() => onOpenChange(false)}
            className="rounded-full p-1 text-muted-foreground hover:bg-muted"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* 공유 안 됨 → 공유 시작 */}
        {!isShared ? (
          <div className="mt-4 flex flex-col items-center gap-3 py-4 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sakura-dark/10">
              <Link className="h-6 w-6 text-sakura-dark" />
            </div>
            <div>
              <p className="text-sm font-semibold">친구와 함께 일정을 편집하세요</p>
              <p className="mt-1 text-xs text-muted-foreground">
                초대 링크를 공유하면 실시간으로 같이 수정할 수 있습니다
              </p>
            </div>
            <Button
              onClick={handleShare}
              disabled={isSharing}
              className="w-full rounded-xl border-0 text-sm font-bold"
            >
              {isSharing ? "생성 중..." : "초대 링크 만들기"}
            </Button>
            {shareError && (
              <p className="mt-2 text-xs text-destructive text-center">{shareError}</p>
            )}
          </div>
        ) : (
          <>
            {/* 초대 링크 */}
            <div className="mt-4">
              <p className="text-xs font-semibold text-muted-foreground mb-1.5">초대 링크</p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleCopy}
                  className="flex min-w-0 flex-1 items-center gap-2 rounded-lg border border-border bg-muted/50 px-3 py-2 text-left select-none active:bg-muted transition-colors"
                >
                  {copied ? (
                    <Check className="h-3.5 w-3.5 shrink-0 text-success" />
                  ) : (
                    <Link className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  )}
                  <span className="truncate text-[11px] text-foreground">{inviteUrl}</span>
                </button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopy}
                  className="shrink-0 gap-1 rounded-lg"
                >
                  {copied ? (
                    <><Check className="h-3.5 w-3.5 text-success" /> 복사됨</>
                  ) : (
                    <><Copy className="h-3.5 w-3.5" /> 복사</>
                  )}
                </Button>
              </div>
            </div>

            {/* 멤버 목록 */}
            <div className="mt-4">
              <p className="text-xs font-semibold text-muted-foreground mb-1.5">멤버 ({members.length}명)</p>
              <div className="flex flex-col gap-1.5 max-h-48 overflow-y-auto">
                {members.map((member) => {
                  const RoleIcon = ROLE_ICONS[member.role]
                  return (
                    <div
                      key={member.user_id}
                      className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-muted/50"
                    >
                      {/* 아바타 */}
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted">
                        {member.avatar_url ? (
                          <img src={member.avatar_url} alt="" className="h-full w-full rounded-full object-cover" />
                        ) : (
                          <span className="text-xs font-bold text-muted-foreground">
                            {member.nickname.charAt(0).toUpperCase()}
                          </span>
                        )}
                      </div>
                      {/* 이름 + 역할 */}
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-semibold">{member.nickname}</p>
                      </div>
                      <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                        <RoleIcon className="h-3 w-3" />
                        {ROLE_LABELS[member.role]}
                      </div>
                      {/* owner가 다른 멤버를 삭제 */}
                      {myRole === "owner" && member.role !== "owner" && (
                        <button
                          onClick={() => handleRemoveMember(member.user_id)}
                          className="shrink-0 rounded-full p-1 text-muted-foreground/40 hover:text-destructive transition-colors"
                          title="멤버 삭제"
                        >
                          <UserMinus className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          </>
        )}
      </div>
    </>
  )
}
