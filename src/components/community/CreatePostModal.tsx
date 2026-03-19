import { useState, useMemo, useRef } from "react"
import { X, Share2, ImagePlus, Trash2, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { showToast } from "@/components/ui/CelebrationOverlay"
import { useAuthStore } from "@/stores/authStore"
import { useScheduleStore } from "@/stores/scheduleStore"
import { supabase, isSupabaseConfigured } from "@/lib/supabase"
import { createMockPost } from "@/lib/mockCommunity"
import { cities } from "@/data/cities"
import { getAnyPlaceById } from "@/stores/dynamicPlaceStore"
import { uploadImage } from "@/lib/uploadImage"
import type { Trip } from "@/types/schedule"

interface CreatePostModalProps {
  open: boolean
  onClose: () => void
  onCreated: () => void
}

export function CreatePostModal({ open, onClose, onCreated }: CreatePostModalProps) {
  const { user, refreshDemoProfile } = useAuthStore()
  const allTrips = useScheduleStore((s) => s.trips)
  const trips = useMemo(() => (open ? allTrips : []), [open, allTrips])
  const [selectedTripId, setSelectedTripId] = useState("")
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [customCover, setCustomCover] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const tripOptions = useMemo(() =>
    trips.map((trip) => {
      const city = cities.find((c) => c.id === trip.cityId)
      return { id: trip.id, label: `${trip.title} (${city?.name ?? trip.cityId}) - ${trip.days.length}일` }
    }), [trips])

  if (!open) return null

  const selectedTrip = trips.find((t) => t.id === selectedTripId)
  const city = selectedTrip ? cities.find((c) => c.id === selectedTrip.cityId) : undefined
  const finalCover = customCover || city?.image || null

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setIsUploading(true)
    setError("")
    const result = await uploadImage(file)
    setIsUploading(false)
    if ("error" in result) {
      setError(result.error)
      return
    }
    setCustomCover(result.url)
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  const handleSubmit = async () => {
    if (!user || !selectedTrip || !title.trim()) return
    setIsSubmitting(true)
    setError("")

    // trip_data에 장소 데이터를 포함시켜 가져오기 시 복원 가능하게
    const tripWithNames: Trip = {
      ...selectedTrip,
      days: selectedTrip.days.map((day) => ({
        ...day,
        items: day.items.map((item) => {
          const place = getAnyPlaceById(item.placeId)
          return {
            ...item,
            placeName: place?.name ?? item.placeId,
            placeData: place ?? undefined,
          }
        }),
      })),
    }

    if (!isSupabaseConfigured) {
      createMockPost({
        user_id: user.id,
        title: title.trim(),
        description: description.trim() || null,
        city_id: selectedTrip.cityId,
        cover_image: finalCover,
        trip_data: tripWithNames,
      })
      setIsSubmitting(false)
      refreshDemoProfile()
      onCreated()
      onClose()
      showToast("여행이 공유됐어요")
      setTitle("")
      setDescription("")
      setSelectedTripId("")
      setCustomCover(null)
      return
    }

    const { error: insertError } = await supabase.from("posts").insert({
      user_id: user.id,
      board_type: "travel",
      title: title.trim(),
      description: description.trim() || null,
      city_id: selectedTrip.cityId,
      cover_image: finalCover,
      trip_data: tripWithNames,
    })

    setIsSubmitting(false)

    if (insertError) {
      console.error("게시글 작성 실패:", insertError)
      setError("게시글 작성에 실패했어요. 잠시 후 다시 시도해주세요.")
      return
    }

    onCreated()
    onClose()
    showToast("여행이 공유됐어요")
    setTitle("")
    setDescription("")
    setSelectedTripId("")
    setCustomCover(null)
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-md max-h-[85vh] overflow-y-auto rounded-2xl border border-border bg-card p-6 shadow-xl">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-muted-foreground hover:text-foreground"
        >
          <X className="h-5 w-5" />
        </button>

        <h2 className="mb-4 text-lg font-bold">여행 공유하기</h2>

        {/* 여행 선택 */}
        <div className="mb-4">
          <label className="mb-1 block text-sm font-medium text-muted-foreground">여행 선택</label>
          <select
            value={selectedTripId}
            onChange={(e) => setSelectedTripId(e.target.value)}
            className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/40"
          >
            <option value="">여행을 선택하세요</option>
            {tripOptions.map((opt) => (
              <option key={opt.id} value={opt.id}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* 제목 */}
        <div className="mb-4">
          <label className="mb-1 block text-sm font-medium text-muted-foreground">제목</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={60}
            placeholder="예: 3박4일 도쿄 맛집투어"
            className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>

        {/* 설명 */}
        <div className="mb-4">
          <label className="mb-1 block text-sm font-medium text-muted-foreground">설명 (선택)</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={500}
            rows={3}
            placeholder="여행 일정에 대한 간단한 소개를 작성하세요"
            className="w-full resize-none rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>

        {/* 커버 이미지 */}
        <div className="mb-4">
          <label className="mb-1 block text-sm font-medium text-muted-foreground">커버 이미지</label>
          <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
          {finalCover ? (
            <div className="relative rounded-xl overflow-hidden border border-border">
              <img src={finalCover} alt="커버" className="h-32 w-full object-cover" />
              <div className="absolute right-2 top-2 flex gap-1">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80"
                >
                  {isUploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ImagePlus className="h-3.5 w-3.5" />}
                </button>
                {customCover && (
                  <button
                    type="button"
                    onClick={() => setCustomCover(null)}
                    className="flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-border py-6 text-sm text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
            >
              {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-5 w-5" />}
              {isUploading ? "업로드 중..." : "이미지 추가"}
            </button>
          )}
        </div>

        {error && <p className="mb-3 text-sm text-destructive">{error}</p>}

        <Button
          onClick={handleSubmit}
          disabled={isSubmitting || !selectedTripId || !title.trim()}
          className="w-full gap-2 rounded-xl"
        >
          <Share2 className="h-4 w-4" />
          {isSubmitting ? "공유 중..." : "커뮤니티에 공유"}
        </Button>
      </div>
    </div>
  )
}
