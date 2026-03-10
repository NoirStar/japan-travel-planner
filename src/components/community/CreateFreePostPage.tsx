import { useState, useCallback } from "react"
import { useNavigate } from "react-router-dom"
import { useEditor, EditorContent } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import Underline from "@tiptap/extension-underline"
import TextAlign from "@tiptap/extension-text-align"
import ImageExt from "@tiptap/extension-image"
import Color from "@tiptap/extension-color"
import { TextStyle } from "@tiptap/extension-text-style"
import Placeholder from "@tiptap/extension-placeholder"
import {
  ArrowLeft,
  Bold,
  Italic,
  UnderlineIcon,
  Strikethrough,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  ImageIcon,
  Minus,
  Undo,
  Redo,
  Loader2,
  Type,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAuthStore } from "@/stores/authStore"
import { supabase, isSupabaseConfigured } from "@/lib/supabase"
import { createMockFreePost } from "@/lib/mockCommunity"

const COLORS = [
  { label: "기본", value: "" },
  { label: "빨강", value: "#ef4444" },
  { label: "주황", value: "#f97316" },
  { label: "노랑", value: "#eab308" },
  { label: "초록", value: "#22c55e" },
  { label: "파랑", value: "#3b82f6" },
  { label: "보라", value: "#a855f7" },
  { label: "분홍", value: "#ec4899" },
  { label: "회색", value: "#6b7280" },
]

export function CreateFreePostPage() {
  const navigate = useNavigate()
  const { user, isDemoMode, refreshDemoProfile, setShowLoginModal } = useAuthStore()
  const useMock = !isSupabaseConfigured || isDemoMode

  const [title, setTitle] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [showColorPicker, setShowColorPicker] = useState(false)

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Underline,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      ImageExt.configure({ allowBase64: true, inline: false }),
      TextStyle,
      Color,
      Placeholder.configure({ placeholder: "내용을 입력하세요..." }),
    ],
    editorProps: {
      attributes: {
        class: "prose prose-sm dark:prose-invert max-w-none min-h-[300px] px-5 py-4 outline-none focus:outline-none",
      },
    },
  })

  const addImage = useCallback(() => {
    const input = document.createElement("input")
    input.type = "file"
    input.accept = "image/*"
    input.onchange = () => {
      const file = input.files?.[0]
      if (!file || !editor) return
      if (file.size > 5 * 1024 * 1024) {
        setError("이미지는 5MB 이하만 업로드 가능합니다.")
        return
      }
      const reader = new FileReader()
      reader.onload = () => {
        const result = reader.result
        if (typeof result === "string") {
          editor.chain().focus().setImage({ src: result }).run()
        }
      }
      reader.readAsDataURL(file)
    }
    input.click()
  }, [editor])

  if (!user) {
    setShowLoginModal(true)
    navigate("/community/free")
    return null
  }

  const handleSubmit = async () => {
    if (!editor || !title.trim() || isSubmitting) return
    const htmlContent = editor.getHTML()
    const textContent = editor.getText()
    if (!textContent.trim()) {
      setError("내용을 입력해주세요.")
      return
    }
    setIsSubmitting(true)
    setError("")

    try {
      if (useMock) {
        const newPost = createMockFreePost(user.id, title.trim(), htmlContent)
        refreshDemoProfile()
        navigate(`/community/${newPost.id}`)
      } else {
        const { data, error: insertError } = await supabase
          .from("posts")
          .insert({
            user_id: user.id,
            board_type: "free",
            title: title.trim(),
            description: "",
            content: htmlContent,
            city_id: "",
            trip_data: {},
          })
          .select("id")
          .single()

        if (insertError) {
          console.error("Supabase insert error:", insertError)
          setError(`작성 중 오류: ${insertError.message}`)
          setIsSubmitting(false)
          return
        }

        if (!data?.id) {
          setError("작성은 완료됐지만 이동할 글 정보를 찾지 못했습니다.")
          setIsSubmitting(false)
          return
        }

        navigate(`/community/${data.id}`)
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-4 pt-20 pb-10">
      {/* 상단 */}
      <div className="mb-4 flex items-center justify-between">
        <button
          onClick={() => navigate("/community/free")}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          자유게시판
        </button>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => navigate("/community/free")}
            className="rounded-xl"
          >
            취소
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!title.trim() || isSubmitting}
            className="gap-2 rounded-xl"
          >
            {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
            {isSubmitting ? "작성 중..." : "게시하기"}
          </Button>
        </div>
      </div>

      {/* 제목 */}
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="제목을 입력하세요"
        maxLength={100}
        autoFocus
        className="mb-4 w-full border-b-2 border-border bg-transparent px-1 pb-3 text-2xl font-bold outline-none placeholder:text-muted-foreground/50 focus:border-primary"
      />

      {/* 에디터 툴바 */}
      {editor && (
        <div className="sticky top-16 z-30 mb-1 flex flex-wrap items-center gap-0.5 rounded-xl border border-border bg-card p-1.5 shadow-sm">
          {/* 서식 */}
          <ToolBtn
            active={editor.isActive("bold")}
            onClick={() => editor.chain().focus().toggleBold().run()}
            title="굵게"
          >
            <Bold className="h-4 w-4" />
          </ToolBtn>
          <ToolBtn
            active={editor.isActive("italic")}
            onClick={() => editor.chain().focus().toggleItalic().run()}
            title="기울임"
          >
            <Italic className="h-4 w-4" />
          </ToolBtn>
          <ToolBtn
            active={editor.isActive("underline")}
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            title="밑줄"
          >
            <UnderlineIcon className="h-4 w-4" />
          </ToolBtn>
          <ToolBtn
            active={editor.isActive("strike")}
            onClick={() => editor.chain().focus().toggleStrike().run()}
            title="취소선"
          >
            <Strikethrough className="h-4 w-4" />
          </ToolBtn>

          <Divider />

          {/* 제목 */}
          <ToolBtn
            active={editor.isActive("heading", { level: 1 })}
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            title="제목 1"
          >
            <Heading1 className="h-4 w-4" />
          </ToolBtn>
          <ToolBtn
            active={editor.isActive("heading", { level: 2 })}
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            title="제목 2"
          >
            <Heading2 className="h-4 w-4" />
          </ToolBtn>
          <ToolBtn
            active={editor.isActive("heading", { level: 3 })}
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            title="제목 3"
          >
            <Heading3 className="h-4 w-4" />
          </ToolBtn>

          <Divider />

          {/* 정렬 */}
          <ToolBtn
            active={editor.isActive({ textAlign: "left" })}
            onClick={() => editor.chain().focus().setTextAlign("left").run()}
            title="왼쪽 정렬"
          >
            <AlignLeft className="h-4 w-4" />
          </ToolBtn>
          <ToolBtn
            active={editor.isActive({ textAlign: "center" })}
            onClick={() => editor.chain().focus().setTextAlign("center").run()}
            title="가운데 정렬"
          >
            <AlignCenter className="h-4 w-4" />
          </ToolBtn>
          <ToolBtn
            active={editor.isActive({ textAlign: "right" })}
            onClick={() => editor.chain().focus().setTextAlign("right").run()}
            title="오른쪽 정렬"
          >
            <AlignRight className="h-4 w-4" />
          </ToolBtn>

          <Divider />

          {/* 리스트 */}
          <ToolBtn
            active={editor.isActive("bulletList")}
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            title="글머리 기호"
          >
            <List className="h-4 w-4" />
          </ToolBtn>
          <ToolBtn
            active={editor.isActive("orderedList")}
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            title="번호 목록"
          >
            <ListOrdered className="h-4 w-4" />
          </ToolBtn>
          <ToolBtn
            active={editor.isActive("blockquote")}
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            title="인용문"
          >
            <Quote className="h-4 w-4" />
          </ToolBtn>

          <Divider />

          {/* 색상 */}
          <div className="relative">
            <ToolBtn
              active={showColorPicker}
              onClick={() => setShowColorPicker(!showColorPicker)}
              title="글자 색상"
            >
              <Type className="h-4 w-4" />
            </ToolBtn>
            {showColorPicker && (
              <div className="absolute left-0 top-full mt-1 flex gap-1 rounded-xl border border-border bg-card p-2 shadow-lg z-50">
                {COLORS.map((c) => (
                  <button
                    key={c.value || "default"}
                    onClick={() => {
                      if (c.value) {
                        editor.chain().focus().setColor(c.value).run()
                      } else {
                        editor.chain().focus().unsetColor().run()
                      }
                      setShowColorPicker(false)
                    }}
                    className="h-6 w-6 rounded-full border border-border transition-transform hover:scale-125"
                    style={{ backgroundColor: c.value || "var(--foreground)" }}
                    title={c.label}
                  />
                ))}
              </div>
            )}
          </div>

          {/* 이미지 & 구분선 */}
          <ToolBtn onClick={addImage} title="이미지 삽입">
            <ImageIcon className="h-4 w-4" />
          </ToolBtn>
          <ToolBtn
            onClick={() => editor.chain().focus().setHorizontalRule().run()}
            title="구분선"
          >
            <Minus className="h-4 w-4" />
          </ToolBtn>

          <Divider />

          {/* 되돌리기/다시실행 */}
          <ToolBtn
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
            title="되돌리기"
          >
            <Undo className="h-4 w-4" />
          </ToolBtn>
          <ToolBtn
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
            title="다시실행"
          >
            <Redo className="h-4 w-4" />
          </ToolBtn>
        </div>
      )}

      {/* 에디터 본문 */}
      <div className="rounded-xl border border-border bg-card shadow-sm">
        <EditorContent editor={editor} />
      </div>

      {error && (
        <p className="mt-3 text-sm text-destructive">{error}</p>
      )}
    </div>
  )
}

/* ── 툴바 버튼 ────────────────────────────────────────── */
function ToolBtn({
  children,
  active,
  disabled,
  onClick,
  title,
}: {
  children: React.ReactNode
  active?: boolean
  disabled?: boolean
  onClick?: () => void
  title?: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`rounded-lg p-1.5 transition-colors ${
        active
          ? "bg-primary text-primary-foreground"
          : disabled
            ? "text-muted-foreground/40 cursor-not-allowed"
            : "text-muted-foreground hover:bg-muted hover:text-foreground"
      }`}
    >
      {children}
    </button>
  )
}

function Divider() {
  return <div className="mx-0.5 h-5 w-px bg-border" />
}
