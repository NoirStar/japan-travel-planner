import { useCallback, useEffect, useMemo, useState } from "react"
import { useEditor, EditorContent } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import Underline from "@tiptap/extension-underline"
import TextAlign from "@tiptap/extension-text-align"
import ImageExt from "@tiptap/extension-image"
import Color from "@tiptap/extension-color"
import { TextStyle } from "@tiptap/extension-text-style"
import Placeholder from "@tiptap/extension-placeholder"
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  ArrowLeft,
  Bold,
  Heading1,
  Heading2,
  Heading3,
  ImageIcon,
  Italic,
  List,
  ListOrdered,
  Loader2,
  Minus,
  Quote,
  Redo,
  Strikethrough,
  Type,
  UnderlineIcon,
  Undo,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { supabase } from "@/lib/supabase"

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
] as const

interface SubmitPayload {
  title: string
  htmlContent: string
  textContent: string
}

interface FreePostEditorProps {
  initialTitle?: string
  initialContent?: string
  isLoading?: boolean
  isSubmitting: boolean
  error: string
  submitLabel: string
  submittingLabel: string
  onBack: () => void
  onSubmit: (payload: SubmitPayload) => Promise<void> | void
  useMock: boolean
}

export function FreePostEditor({
  initialTitle = "",
  initialContent = "",
  isLoading = false,
  isSubmitting,
  error,
  submitLabel,
  submittingLabel,
  onBack,
  onSubmit,
  useMock,
}: FreePostEditorProps) {
  const [title, setTitle] = useState(initialTitle)
  const [localError, setLocalError] = useState("")
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
      handleDrop: (_view, event) => {
        const file = event.dataTransfer?.files?.[0]
        if (file?.type.startsWith("image/")) {
          event.preventDefault()
          void handleImageFile(file)
          return true
        }
        return false
      },
      handlePaste: (_view, event) => {
        const file = event.clipboardData?.files?.[0]
        if (file?.type.startsWith("image/")) {
          event.preventDefault()
          void handleImageFile(file)
          return true
        }
        return false
      },
    },
  })

  useEffect(() => {
    setTitle(initialTitle)
  }, [initialTitle])

  useEffect(() => {
    if (!editor) return
    const currentHtml = editor.getHTML()
    if (initialContent && currentHtml !== initialContent) {
      editor.commands.setContent(initialContent)
      return
    }
    if (!initialContent && currentHtml !== "<p></p>") {
      editor.commands.clearContent()
    }
  }, [editor, initialContent])

  const mergedError = localError || error

  const handleImageFile = useCallback(async (file: File) => {
    if (!editor) return
    if (file.size > 5 * 1024 * 1024) {
      setLocalError("이미지는 5MB 이하만 업로드 가능합니다.")
      return
    }

    if (!useMock) {
      const ext = file.name.split(".").pop() ?? "jpg"
      const path = `posts/${crypto.randomUUID()}.${ext}`
      const { error: uploadError } = await supabase.storage
        .from("images")
        .upload(path, file, { contentType: file.type })

      if (uploadError) {
        setLocalError("이미지 업로드에 실패했습니다.")
        return
      }

      const { data: urlData } = supabase.storage.from("images").getPublicUrl(path)
      editor.chain().focus().setImage({ src: urlData.publicUrl }).run()
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
  }, [editor, useMock])

  const addImage = useCallback(() => {
    const input = document.createElement("input")
    input.type = "file"
    input.accept = "image/*"
    input.onchange = () => {
      const file = input.files?.[0]
      if (file) {
        void handleImageFile(file)
      }
    }
    input.click()
  }, [handleImageFile])

  const handleSubmit = useCallback(async () => {
    if (!editor || !title.trim() || isSubmitting) return

    const htmlContent = editor.getHTML()
    const textContent = editor.getText()
    if (!textContent.trim()) {
      setLocalError("내용을 입력해주세요.")
      return
    }

    setLocalError("")
    await onSubmit({
      title: title.trim(),
      htmlContent,
      textContent,
    })
  }, [editor, isSubmitting, onSubmit, title])

  const toolbar = useMemo(() => editor && (
    <div className="sticky top-16 z-30 mb-1 flex items-center gap-0.5 overflow-x-auto rounded-xl border border-border bg-card p-1.5 shadow-sm scrollbar-hide">
      <ToolBtn active={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()} title="굵게"><Bold className="h-4 w-4" /></ToolBtn>
      <ToolBtn active={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()} title="기울임"><Italic className="h-4 w-4" /></ToolBtn>
      <ToolBtn active={editor.isActive("underline")} onClick={() => editor.chain().focus().toggleUnderline().run()} title="밑줄"><UnderlineIcon className="h-4 w-4" /></ToolBtn>
      <ToolBtn active={editor.isActive("strike")} onClick={() => editor.chain().focus().toggleStrike().run()} title="취소선"><Strikethrough className="h-4 w-4" /></ToolBtn>
      <Divider />
      <ToolBtn active={editor.isActive("heading", { level: 1 })} onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} title="제목 1"><Heading1 className="h-4 w-4" /></ToolBtn>
      <ToolBtn active={editor.isActive("heading", { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} title="제목 2"><Heading2 className="h-4 w-4" /></ToolBtn>
      <ToolBtn active={editor.isActive("heading", { level: 3 })} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} title="제목 3"><Heading3 className="h-4 w-4" /></ToolBtn>
      <Divider />
      <ToolBtn active={editor.isActive({ textAlign: "left" })} onClick={() => editor.chain().focus().setTextAlign("left").run()} title="왼쪽 정렬"><AlignLeft className="h-4 w-4" /></ToolBtn>
      <ToolBtn active={editor.isActive({ textAlign: "center" })} onClick={() => editor.chain().focus().setTextAlign("center").run()} title="가운데 정렬"><AlignCenter className="h-4 w-4" /></ToolBtn>
      <ToolBtn active={editor.isActive({ textAlign: "right" })} onClick={() => editor.chain().focus().setTextAlign("right").run()} title="오른쪽 정렬"><AlignRight className="h-4 w-4" /></ToolBtn>
      <Divider />
      <ToolBtn active={editor.isActive("bulletList")} onClick={() => editor.chain().focus().toggleBulletList().run()} title="글머리 기호"><List className="h-4 w-4" /></ToolBtn>
      <ToolBtn active={editor.isActive("orderedList")} onClick={() => editor.chain().focus().toggleOrderedList().run()} title="번호 목록"><ListOrdered className="h-4 w-4" /></ToolBtn>
      <ToolBtn active={editor.isActive("blockquote")} onClick={() => editor.chain().focus().toggleBlockquote().run()} title="인용문"><Quote className="h-4 w-4" /></ToolBtn>
      <Divider />
      <div className="relative">
        <ToolBtn active={showColorPicker} onClick={() => setShowColorPicker((prev) => !prev)} title="글자 색상"><Type className="h-4 w-4" /></ToolBtn>
        {showColorPicker && (
          <div className="absolute left-0 top-full mt-1 flex gap-1 rounded-xl border border-border bg-card p-2 shadow-lg z-50">
            {COLORS.map((color) => (
              <button
                key={color.value || "default"}
                onClick={() => {
                  if (color.value) editor.chain().focus().setColor(color.value).run()
                  else editor.chain().focus().unsetColor().run()
                  setShowColorPicker(false)
                }}
                className="h-6 w-6 rounded-full border border-border transition-transform hover:scale-125"
                style={{ backgroundColor: color.value || "var(--foreground)" }}
                title={color.label}
              />
            ))}
          </div>
        )}
      </div>
      <ToolBtn onClick={addImage} title="이미지 삽입"><ImageIcon className="h-4 w-4" /></ToolBtn>
      <ToolBtn onClick={() => editor.chain().focus().setHorizontalRule().run()} title="구분선"><Minus className="h-4 w-4" /></ToolBtn>
      <Divider />
      <ToolBtn onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} title="되돌리기"><Undo className="h-4 w-4" /></ToolBtn>
      <ToolBtn onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} title="다시실행"><Redo className="h-4 w-4" /></ToolBtn>
    </div>
  ), [addImage, editor, showColorPicker])

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl px-4 pt-20 pb-10">
      <div className="mb-4 flex items-center justify-between">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          돌아가기
        </button>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={onBack}
            className="rounded-xl"
          >
            취소
          </Button>
          <Button
            onClick={() => void handleSubmit()}
            disabled={!title.trim() || isSubmitting}
            className="gap-2 rounded-xl"
          >
            {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
            {isSubmitting ? submittingLabel : submitLabel}
          </Button>
        </div>
      </div>

      <input
        type="text"
        value={title}
        onChange={(event) => setTitle(event.target.value)}
        placeholder="제목을 입력하세요"
        maxLength={100}
        autoFocus
        className="mb-4 w-full border-b-2 border-border bg-transparent px-1 pb-3 text-2xl font-bold outline-none placeholder:text-muted-foreground/50 focus:border-primary"
      />

      {toolbar}

      <div className="rounded-xl border border-border bg-card shadow-sm">
        <EditorContent editor={editor} />
      </div>

      {mergedError && (
        <p className="mt-3 text-sm text-destructive">{mergedError}</p>
      )}
    </div>
  )
}

function ToolBtn({
  children,
  active = false,
  disabled = false,
  onClick,
  title,
}: {
  children: React.ReactNode
  active?: boolean
  disabled?: boolean
  onClick: () => void
  title: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-colors ${
        active
          ? "bg-primary text-primary-foreground"
          : "text-muted-foreground hover:bg-muted hover:text-foreground"
      } ${disabled ? "opacity-40 cursor-not-allowed" : ""}`}
    >
      {children}
    </button>
  )
}

function Divider() {
  return <div className="mx-1 h-6 w-px shrink-0 bg-border" />
}
