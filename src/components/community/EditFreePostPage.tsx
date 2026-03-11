import { lazy, Suspense, useEffect, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { Loader2 } from "lucide-react"
import { useAuthStore } from "@/stores/authStore"
import { supabase, isSupabaseConfigured } from "@/lib/supabase"
import { fetchMockPost, updateMockPost } from "@/lib/mockCommunity"

const FreePostEditor = lazy(() => import("@/components/community/FreePostEditor").then((m) => ({ default: m.FreePostEditor })))

function EditorLoader() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  )
}

export function EditFreePostPage() {
  const { postId } = useParams<{ postId: string }>()
  const navigate = useNavigate()
  const { user, isDemoMode } = useAuthStore()
  const useMock = !isSupabaseConfigured || isDemoMode

  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [isLoadingPost, setIsLoadingPost] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    if (!postId) return
    const targetPostId = postId

    async function load() {
      setIsLoadingPost(true)
      setError("")

      if (useMock) {
        const post = fetchMockPost(targetPostId)
        if (!post) {
          setError("게시글을 찾을 수 없습니다.")
          setIsLoadingPost(false)
          return
        }
        setTitle(post.title)
        setContent(post.content ?? "")
        setIsLoadingPost(false)
        return
      }

      const { data, error: loadError } = await supabase
        .from("posts")
        .select("id, user_id, title, content, board_type")
        .eq("id", targetPostId)
        .eq("board_type", "free")
        .single()

      if (loadError || !data) {
        setError("게시글을 불러오지 못했습니다.")
        setIsLoadingPost(false)
        return
      }

      if (user && data.user_id !== user.id) {
        navigate(`/community/${targetPostId}`, { replace: true })
        return
      }

      setTitle(data.title)
      setContent(data.content ?? "")
      setIsLoadingPost(false)
    }

    void load()
  }, [navigate, postId, useMock, user])

  const handleSubmit = async ({ title: nextTitle, htmlContent }: { title: string; htmlContent: string }) => {
    if (!postId) return

    setIsSubmitting(true)
    setError("")

    try {
      if (useMock) {
        updateMockPost(postId, { title: nextTitle, content: htmlContent })
        navigate(`/community/${postId}`)
        return
      }

      const { error: updateError } = await supabase
        .from("posts")
        .update({
          title: nextTitle,
          content: htmlContent,
          updated_at: new Date().toISOString(),
        })
        .eq("id", postId)
        .eq("user_id", user?.id ?? "")

      if (updateError) {
        setError("수정 중 오류가 발생했습니다.")
        return
      }

      navigate(`/community/${postId}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Suspense fallback={<EditorLoader />}>
      <FreePostEditor
        initialTitle={title}
        initialContent={content}
        isLoading={isLoadingPost}
        submitLabel="수정 완료"
        submittingLabel="수정 중..."
        isSubmitting={isSubmitting}
        error={error}
        onBack={() => navigate(`/community/${postId}`)}
        onSubmit={handleSubmit}
        useMock={useMock}
      />
    </Suspense>
  )
}
