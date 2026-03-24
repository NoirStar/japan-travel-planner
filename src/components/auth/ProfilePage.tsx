import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Camera, LogOut, Save, MessageCircle, Pencil, ThumbsUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAuthStore } from "@/stores/authStore"
import { LevelBadge } from "@/components/community/LevelBadge"
import { LEVEL_ICONS } from "@/components/community/levelIconMap"
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
    try {
      await updateProfile({ nickname: trimmed, avatar_url: avatarUrl || null })
    } catch (e) {
      console.error("프로필 저장 실패:", e)
    } finally {
      setIsSaving(false)
    }
  }

  const handleSignOut = async () => {
    await signOut()
    navigate("/")
  }

  return (
    <div className="mx-auto max-w-lg px-5 pt-24 pb-14">
      {/* 프로필 헤더 */}
      <div className="mb-8 rounded-2xl border border-border bg-gradient-to-br from-primary/5 via-card to-card p-8">
        <div className="flex flex-col items-center gap-4">
          <div className="relative h-24 w-24">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt="avatar"
                className="h-24 w-24 rounded-full border-2 border-primary/20 object-cover ring-4 ring-primary/5"
              />
            ) : (
              <div className="flex h-24 w-24 items-center justify-center rounded-full border-2 border-primary/20 bg-primary/10 text-3xl font-bold text-primary ring-4 ring-primary/5">
                {profile.nickname.charAt(0)}
              </div>
            )}
            <label className="absolute bottom-0 right-0 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-primary text-white shadow-md hover:bg-primary/90 transition-colors">
              <Camera className="h-4 w-4" />
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (!file) return
                  const reader = new FileReader()
                  reader.onload = () => setAvatarUrl(reader.result as string)
                  reader.readAsDataURL(file)
                }}
              />
            </label>
          </div>

          <div className="text-center">
            <h1 className="text-title font-bold">{profile.nickname}</h1>
            <div className="mt-1.5">
              <LevelBadge level={profile.level} totalPoints={profile.total_points} isAdmin={profile.is_admin} />
            </div>
          </div>
        </div>
      </div>

      {/* 닉네임 */}
      <div className="mb-5">
        <label className="mb-1.5 block text-body-sm font-medium text-muted-foreground">
          닉네임
        </label>
        <input
          type="text"
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          maxLength={20}
          className="w-full rounded-xl border border-border bg-background px-4 py-3 text-body-sm outline-none focus:ring-2 focus:ring-primary/40 transition-shadow"
        />
        <p className="mt-1.5 text-caption text-muted-foreground">{nickname.length}/20</p>
      </div>

      <div className="mb-8" />

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
          <div className="mb-8 space-y-5">
            {/* 포인트 + 레벨 요약 */}
            <div className="grid grid-cols-3 gap-3">
              <div className="card-elevated rounded-2xl p-5 text-center">
                <p className="text-headline font-bold text-primary">{currentPts}</p>
                <p className="text-caption text-muted-foreground mt-1">총 포인트</p>
              </div>
              <div className="card-elevated rounded-2xl p-5 text-center">
                <p className="text-headline font-bold text-primary">Lv.{profile.level}</p>
                <p className="text-caption text-muted-foreground mt-1">{currentLevel.label}</p>
              </div>
              <div className="card-elevated rounded-2xl p-5 text-center">
                <p className="text-headline font-bold text-primary">{profile.total_likes}</p>
                <p className="text-caption text-muted-foreground mt-1">받은 추천</p>
              </div>
            </div>

            {/* 다음 레벨 프로그레스 */}
            {nextLevel && (
              <div className="rounded-2xl border border-border bg-card p-5">
                <div className="mb-2 flex items-center justify-between text-caption text-muted-foreground">
                  <span className="inline-flex items-center gap-1">다음 레벨: Lv.{nextLevel.level} {nextLevel.label} {(LEVEL_ICONS[nextLevel.level] ?? LEVEL_ICONS[1])(14)}</span>
                  <span className="font-medium">{currentPts} / {nextLevel.minPoints}P</span>
                </div>
                <div className="h-2.5 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-primary to-indigo transition-all"
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
              </div>
            )}

            {/* 포인트 내역 */}
            {breakdown && (
              <div className="rounded-2xl border border-border bg-card p-5">
                <h3 className="mb-4 text-body-sm font-semibold">포인트 내역</h3>
                <div className="space-y-3 text-body-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground inline-flex items-center gap-1.5"><MessageCircle className="h-4 w-4" /> 댓글 작성</span>
                    <span className="font-medium">{breakdown.comment}P</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground inline-flex items-center gap-1.5"><Pencil className="h-4 w-4" /> 글 작성</span>
                    <span className="font-medium">{breakdown.post}P</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground inline-flex items-center gap-1.5"><ThumbsUp className="h-4 w-4" /> 추천 받기</span>
                    <span className="font-medium">{breakdown.like_received}P</span>
                  </div>
                  <div className="border-t border-border pt-3 flex items-center justify-between font-semibold">
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
          className="btn-base btn-lg w-full rounded-xl"
        >
          <Save className="h-4 w-4" />
          {isSaving ? "저장 중..." : "프로필 저장"}
        </Button>
        <Button
          onClick={handleSignOut}
          variant="outline"
          className="btn-base btn-lg w-full rounded-xl text-destructive hover:bg-destructive/10"
        >
          <LogOut className="h-4 w-4" />
          로그아웃
        </Button>
      </div>
    </div>
  )
}
