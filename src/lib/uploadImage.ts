import { supabase, isSupabaseConfigured } from "@/lib/supabase"

const MAX_SIZE = 5 * 1024 * 1024 // 5MB

/**
 * Supabase Storage에 이미지를 업로드하고 공개 URL을 반환합니다.
 * Mock 모드에서는 base64 data URL을 반환합니다.
 */
export async function uploadImage(file: File): Promise<{ url: string } | { error: string }> {
  if (file.size > MAX_SIZE) {
    return { error: "이미지는 5MB 이하만 업로드 가능합니다." }
  }

  if (!isSupabaseConfigured) {
    return new Promise((resolve) => {
      const reader = new FileReader()
      reader.onload = () => {
        const result = reader.result
        if (typeof result === "string") resolve({ url: result })
        else resolve({ error: "이미지를 읽을 수 없습니다." })
      }
      reader.onerror = () => resolve({ error: "이미지를 읽을 수 없습니다." })
      reader.readAsDataURL(file)
    })
  }

  const ext = file.name.split(".").pop() ?? "jpg"
  const path = `posts/${crypto.randomUUID()}.${ext}`
  const { error: uploadError } = await supabase.storage
    .from("images")
    .upload(path, file, { contentType: file.type })

  if (uploadError) {
    return { error: "이미지 업로드에 실패했습니다." }
  }

  const { data } = supabase.storage.from("images").getPublicUrl(path)
  return { url: data.publicUrl }
}
