import { lazy, Suspense, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Loader2 } from "lucide-react"
import { showToast } from "@/components/ui/CelebrationOverlay"
import { useAuthStore } from "@/stores/authStore"
import { supabase, isSupabaseConfigured } from "@/lib/supabase"
import { createMockFreePost } from "@/lib/mockCommunity"

const FreePostEditor = lazy(() => import("@/components/community/FreePostEditor").then((m) => ({ default: m.FreePostEditor })))

function EditorLoader() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  )
}

export function CreateFreePostPage() {
  const navigate = useNavigate()
  const { user, refreshDemoProfile } = useAuthStore()
  const useMock = !isSupabaseConfigured
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async ({ title, htmlContent }: { title: string; htmlContent: string }) => {
    if (!user) return

    setIsSubmitting(true)
    setError("")

    try {
      if (useMock) {
        const newPost = createMockFreePost(user.id, title, htmlContent)
        refreshDemoProfile()
        showToast("글이 등록됐어요")
        navigate(`/community/${newPost.id}`)
        return
      }

      const { data, error: insertError } = await supabase
        .from("posts")
        .insert({
          user_id: user.id,
          board_type: "free",
          title,
          description: "",
          content: htmlContent,
          city_id: "",
          trip_data: {},
        })
        .select("id")
        .single()

      if (insertError) {
        console.error("글 작성 실패:", insertError)
        setError("글 작성에 실패했어요. 잠시 후 다시 시도해주세요.")
        return
      }
      if (!data?.id) {
        setError("작성 중 오류가 발생했습니다.")
        return
      }

      showToast("글이 등록됐어요")
      navigate(`/community/${data.id}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Suspense fallback={<EditorLoader />}>
      <FreePostEditor
        submitLabel="게시하기"
        submittingLabel="작성 중..."
        isSubmitting={isSubmitting}
        error={error}
        onBack={() => navigate("/community/free")}
        onSubmit={handleSubmit}
        useMock={useMock}
      />
    </Suspense>
  )
}
