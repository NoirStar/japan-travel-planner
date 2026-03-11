import { ThumbsDown, ThumbsUp } from "lucide-react"
import type { VoteType } from "@/types/community"

interface CommentVoteButtonsProps {
  commentId: string
  likesCount: number
  dislikesCount: number
  currentVote: VoteType | null | undefined
  onVote: (commentId: string, type: VoteType) => void
}

export function CommentVoteButtons({
  commentId,
  likesCount,
  dislikesCount,
  currentVote,
  onVote,
}: CommentVoteButtonsProps) {
  return (
    <div className="flex items-center gap-2">
      <button
        data-testid={`comment-upvote-${commentId}`}
        onClick={() => onVote(commentId, "up")}
        className={`inline-flex items-center gap-1 rounded-lg px-2 py-0.5 text-xs transition-colors ${
          currentVote === "up"
            ? "bg-primary/10 text-primary font-semibold"
            : "text-muted-foreground hover:text-foreground"
        }`}
      >
        <ThumbsUp className="h-3 w-3" />
        {Number(likesCount) || 0}
      </button>
      <button
        data-testid={`comment-downvote-${commentId}`}
        onClick={() => onVote(commentId, "down")}
        className={`inline-flex items-center gap-1 rounded-lg px-2 py-0.5 text-xs transition-colors ${
          currentVote === "down"
            ? "bg-destructive/10 text-destructive font-semibold"
            : "text-muted-foreground hover:text-foreground"
        }`}
      >
        <ThumbsDown className="h-3 w-3" />
        {Number(dislikesCount) || 0}
      </button>
    </div>
  )
}
