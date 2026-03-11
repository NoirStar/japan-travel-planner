import { describe, expect, it, vi } from "vitest"
import { fireEvent, render, screen } from "@testing-library/react"
import { CommentVoteButtons } from "@/components/community/CommentVoteButtons"

describe("CommentVoteButtons", () => {
  it("추천 버튼 클릭 시 댓글 id와 up 타입을 전달한다", () => {
    const onVote = vi.fn()

    render(
      <CommentVoteButtons
        commentId="comment-1"
        likesCount={3}
        dislikesCount={1}
        currentVote={null}
        onVote={onVote}
      />, 
    )

    fireEvent.click(screen.getByTestId("comment-upvote-comment-1"))

    expect(onVote).toHaveBeenCalledWith("comment-1", "up")
    expect(screen.getByTestId("comment-upvote-comment-1")).toHaveTextContent("3")
  })

  it("현재 비추천 상태를 스타일 클래스로 반영한다", () => {
    render(
      <CommentVoteButtons
        commentId="comment-2"
        likesCount={0}
        dislikesCount={2}
        currentVote="down"
        onVote={vi.fn()}
      />,
    )

    expect(screen.getByTestId("comment-downvote-comment-2").className).toContain("text-destructive")
  })
})
