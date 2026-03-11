import { describe, expect, it, vi, beforeEach } from "vitest"
import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { MemoryRouter, Route, Routes } from "react-router-dom"
import { EditFreePostPage } from "@/components/community/EditFreePostPage"

const mockNavigate = vi.fn()
const fetchMockPost = vi.fn()
const updateMockPost = vi.fn()

vi.mock("@/stores/authStore", () => ({
  useAuthStore: () => ({
    user: { id: "user-1" },
    isDemoMode: true,
  }),
}))

vi.mock("@/lib/supabase", () => ({
  isSupabaseConfigured: false,
  supabase: {},
}))

vi.mock("@/lib/mockCommunity", () => ({
  fetchMockPost: (...args: unknown[]) => fetchMockPost(...args),
  updateMockPost: (...args: unknown[]) => updateMockPost(...args),
}))

vi.mock("@/components/community/FreePostEditor", () => ({
  FreePostEditor: ({ initialTitle, isLoading, onSubmit }: { initialTitle?: string; isLoading?: boolean; onSubmit: (payload: { title: string; htmlContent: string; textContent: string }) => void }) => (
    <div>
      <div data-testid="editor-title">{initialTitle}</div>
      <div data-testid="editor-loading">{String(isLoading)}</div>
      <button onClick={() => onSubmit({ title: "수정된 제목", htmlContent: "<p>수정 본문</p>", textContent: "수정 본문" })}>
        submit-edit
      </button>
    </div>
  ),
}))

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom")
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

describe("EditFreePostPage", () => {
  beforeEach(() => {
    mockNavigate.mockReset()
    fetchMockPost.mockReset()
    updateMockPost.mockReset()
    fetchMockPost.mockReturnValue({
      id: "post-1",
      title: "기존 제목",
      content: "<p>기존 본문</p>",
    })
  })

  it("mock 게시글을 로드하고 수정 제출 시 updateMockPost를 호출한다", async () => {
    render(
      <MemoryRouter initialEntries={["/community/free/edit/post-1"]}>
        <Routes>
          <Route path="/community/free/edit/:postId" element={<EditFreePostPage />} />
        </Routes>
      </MemoryRouter>,
    )

    await waitFor(() => {
      expect(screen.getByTestId("editor-title")).toHaveTextContent("기존 제목")
    })

    fireEvent.click(screen.getByRole("button", { name: "submit-edit" }))

    await waitFor(() => {
      expect(updateMockPost).toHaveBeenCalledWith("post-1", {
        title: "수정된 제목",
        content: "<p>수정 본문</p>",
      })
      expect(mockNavigate).toHaveBeenCalledWith("/community/post-1")
    })
  })
})
