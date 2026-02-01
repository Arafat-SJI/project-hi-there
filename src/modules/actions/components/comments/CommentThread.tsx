import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Reply, Pencil, Trash2, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useAddComment, useUpdateComment, useDeleteComment } from "../../hooks/useTaskComments";
import type { TaskComment } from "../../types/tasks";

interface CommentThreadProps {
  taskId: string;
  comments: TaskComment[];
}

export function CommentThread({ taskId, comments }: CommentThreadProps) {
  const [replyText, setReplyText] = useState("");
  const addComment = useAddComment();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim()) return;
    await addComment.mutateAsync({ taskId, content: replyText.trim() });
    setReplyText("");
  };

  return (
    <div className="space-y-4">
      <h4 className="text-sm font-medium">
        Comments {comments.length > 0 && `(${comments.reduce((acc, c) => acc + 1 + (c.replies?.length || 0), 0)})`}
      </h4>

      {/* Comment list */}
      <div className="space-y-4">
        {comments.map((comment) => (
          <CommentItem key={comment.id} comment={comment} taskId={taskId} />
        ))}
      </div>

      {comments.length === 0 && (
        <p className="text-sm text-muted-foreground py-2">No comments yet.</p>
      )}

      {/* Add comment */}
      <form onSubmit={handleSubmit} className="flex gap-2">
        <Textarea
          placeholder="Write a comment..."
          value={replyText}
          onChange={(e) => setReplyText(e.target.value)}
          rows={2}
          className="flex-1"
        />
        <Button
          type="submit"
          size="sm"
          disabled={!replyText.trim() || addComment.isPending}
          className="self-end"
        >
          {addComment.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            "Post"
          )}
        </Button>
      </form>
    </div>
  );
}

function CommentItem({ comment, taskId }: { comment: TaskComment; taskId: string }) {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(comment.content);
  const [showReply, setShowReply] = useState(false);
  const [replyText, setReplyText] = useState("");

  const updateComment = useUpdateComment();
  const deleteComment = useDeleteComment();
  const addReply = useAddComment();

  const isOwner = user?.id === comment.user_id;
  const initials = comment.user?.full_name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase() || "?";

  const handleSaveEdit = async () => {
    if (!editText.trim()) return;
    await updateComment.mutateAsync({ id: comment.id, taskId, content: editText.trim() });
    setIsEditing(false);
  };

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim()) return;
    await addReply.mutateAsync({ taskId, content: replyText.trim(), parentCommentId: comment.id });
    setReplyText("");
    setShowReply(false);
  };

  return (
    <div className="space-y-2">
      <div className="flex gap-3">
        <Avatar className="h-8 w-8 shrink-0">
          <AvatarFallback className="text-xs">{initials}</AvatarFallback>
        </Avatar>
        <div className="flex-1 space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">
              {comment.user?.full_name || comment.user?.email || "Unknown"}
            </span>
            <span className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
            </span>
            {comment.is_edited && (
              <span className="text-xs text-muted-foreground">(edited)</span>
            )}
          </div>

          {isEditing ? (
            <div className="space-y-2">
              <Textarea value={editText} onChange={(e) => setEditText(e.target.value)} rows={2} />
              <div className="flex gap-2">
                <Button size="sm" onClick={handleSaveEdit} disabled={updateComment.isPending}>
                  Save
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setIsEditing(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <p className="text-sm text-foreground whitespace-pre-wrap">{comment.content}</p>
          )}

          {/* Action buttons */}
          {!isEditing && (
            <div className="flex gap-1">
              <Button variant="ghost" size="sm" className="h-6 text-xs px-2" onClick={() => setShowReply(!showReply)}>
                <Reply className="mr-1 h-3 w-3" />
                Reply
              </Button>
              {isOwner && (
                <>
                  <Button variant="ghost" size="sm" className="h-6 text-xs px-2" onClick={() => setIsEditing(true)}>
                    <Pencil className="mr-1 h-3 w-3" />
                    Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 text-xs px-2 text-red-600"
                    onClick={() => deleteComment.mutate({ id: comment.id, taskId })}
                  >
                    <Trash2 className="mr-1 h-3 w-3" />
                    Delete
                  </Button>
                </>
              )}
            </div>
          )}

          {/* Reply form */}
          {showReply && (
            <form onSubmit={handleReply} className="flex gap-2 mt-2">
              <Textarea
                placeholder="Write a reply..."
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                rows={1}
                className="flex-1"
                autoFocus
              />
              <Button type="submit" size="sm" disabled={!replyText.trim() || addReply.isPending}>
                Reply
              </Button>
            </form>
          )}
        </div>
      </div>

      {/* Nested replies */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="ml-11 border-l-2 border-muted pl-4 space-y-3">
          {comment.replies.map((reply) => (
            <CommentItem key={reply.id} comment={reply} taskId={taskId} />
          ))}
        </div>
      )}
    </div>
  );
}
