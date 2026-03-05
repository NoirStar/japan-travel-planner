import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Camera, LogOut, Save } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAuthStore } from "@/stores/authStore"
import { LevelBadge } from "@/components/community/LevelBadge"
import { getLevelInfo, USER_LEVELS } from "@/types/community"
import { getPointBreakdown } from "@/lib/mockCommunity"

export function ProfilePage() {
  const { user, profile, isDemoMode, updateProfile, signOut } = useAuthStore()
  const navigate = useNavigate()
  const [nickname, setNickname] = useState(profile?.nickname ?? "")
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url ?? "")
  const [isSaving, setIsSaving] = useState(false)

  if (!user || !profile) {
    navigate("/")
    return null
  }

  const handleSave = async () => {
    const trimmed = nickname.trim()
    if (!trimmed || trimmed.length > 20) return
    setIsSaving(true)
    await updateProfile({ nickname: trimmed, avatar_url: avatarUrl || null })
    setIsSaving(false)
  }

  const handleSignOut = async () => {
    await signOut()
    navigate("/")
  }

  return (
    <div className="mx-auto max-w-lg px-4 pt-20 pb-10">
      <h1 className="mb-6 text-2xl font-bold">프로필</h1>

      {/* 아바타 */}
      <div className="mb-6 flex flex-col items-center gap-3">
        <div className="relative h-24 w-24">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt="avatar"
              className="h-24 w-24 rounded-full border-2 border-border object-cover"
            />
          ) : (
            <div className="flex h-24 w-24 items-center justify-center rounded-full border-2 border-border bg-muted text-3xl font-bold text-muted-foreground">
              {profile.nickname.charAt(0)}
            </div>
          )}
          <label className="absolute bottom-0 right-0 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-primary text-white shadow">
            <Camera className="h-4 w-4" />
            <input
              type="text"
              className="hidden"
              placeholder="이미지 URL"
            />
          </label>
        </div>

        <LevelBadge level={profile.level} totalPoints={profile.total_points} isAdmin={profile.is_admin} />
      </div>

      {/* 닉네임 */}
      <div className="mb-4">
        <label className="mb-1 block text-sm font-medium text-muted-foreground">
          닉네임
        </label>
        <input
          type="text"
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          maxLength={20}
          className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/40"
        />
        <p className="mt-1 text-xs text-muted-foreground">{nickname.length}/20</p>
      </div>

      {/* 아바타 URL */}
      <div className="mb-6">
        <label className="mb-1 block text-sm font-medium text-muted-foreground">
          프로필 이미지 URL
        </label>
        <input
          type="url"
          value={avatarUrl}
          onChange={(e) => setAvatarUrl(e.target.value)}
          placeholder="https://..."
          className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/40"
        />
      </div>

      {/* 통계 */}
      {(() => {
        const breakdown = isDemoMode && !profile.is_admin ? getPointBreakdown() : null
        const currentLevel = getLevelInfo(profile.level)
        const nextLevel = USER_LEVELS.find((l) => l.level === profile.level + 1)
        const currentPts = profile.total_points ?? 0
        const progressPct = nextLevel
          ? Math.min(100, ((currentPts - currentLevel.minPoints) / (nextLevel.minPoints - currentLevel.minPoints)) * 100)
          : 100

        return (
          <div className="mb-6 space-y-4">
            {/* 포인트 + 레벨 요약 */}
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-xl border border-border bg-card p-4 text-center">
                <p className="text-2xl font-bold text-primary">{currentPts}</p>
                <p className="text-xs text-muted-foreground">총 포인트</p>
              </div>
              <div className="rounded-xl border border-border bg-card p-4 text-center">
                <p className="text-2xl font-bold text-primary">Lv.{profile.level}</p>
                <p className="text-xs text-muted-foreground">{currentLevel.label}</p>
              </div>
              <div className="rounded-xl border border-border bg-card p-4 text-center">
                <p className="text-2xl font-bold text-primary">{profile.total_likes}</p>
                <p className="text-xs text-muted-foreground">받은 추천</p>
              </div>
            </div>

            {/* 다음 레벨 프로그레스 */}
            {nextLevel && (
              <div className="rounded-xl border border-border bg-card p-4">
                <div className="mb-1 flex items-center justify-between text-xs text-muted-foreground">
                  <span>다음 레벨: Lv.{nextLevel.level} {nextLevel.label} {nextLevel.emoji}</span>
                  <span>{currentPts} / {nextLevel.minPoints}P</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-primary to-indigo-500 transition-all"
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
              </div>
            )}

            {/* 포인트 내역 */}
            {breakdown && (
              <div className="rounded-xl border border-border bg-card p-4">
                <h3 className="mb-3 text-sm font-semibold">포인트 내역</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">📅 출석체크</span>
                    <span className="font-medium">{breakdown.attendance}P</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">💬 댓글 작성</span>
                    <span className="font-medium">{breakdown.comment}P</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">✏️ 글 작성</span>
                    <span className="font-medium">{breakdown.post}P</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">👍 추천 받기</span>
                    <span className="font-medium">{breakdown.like_received}P</span>
                  </div>
                  <div className="border-t border-border pt-2 flex items-center justify-between font-semibold">
                    <span>합계</span>
                    <span className="text-primary">{currentPts}P</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )
      })()}

      {/* 버튼 */}
      <div className="space-y-3">
        <Button
          onClick={handleSave}
          disabled={isSaving || !nickname.trim()}
          className="w-full gap-2 rounded-xl"
        >
          <Save className="h-4 w-4" />
          {isSaving ? "저장 중..." : "프로필 저장"}
        </Button>
        <Button
          onClick={handleSignOut}
          variant="outline"
          className="w-full gap-2 rounded-xl text-destructive hover:bg-destructive/10"
        >
          <LogOut className="h-4 w-4" />
          로그아웃
        </Button>
      </div>
    </div>
  )
}
