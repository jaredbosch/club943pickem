"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";

type Comment = {
  id: string;
  post_id: string;
  body: string | null;
  image_url: string | null;
  created_at: string;
  user_id: string;
  authorName: string;
  isCurrentUser: boolean;
};

type Post = {
  id: string;
  body: string | null;
  image_url: string | null;
  is_pinned: boolean;
  created_at: string;
  user_id: string;
  authorName: string;
  isCurrentUser: boolean;
  comments: Comment[];
};

type Props = {
  leagueId: string;
  initialPosts: Post[];
  isCommissioner: boolean;
  currentUserId: string;
};

function timeAgo(iso: string) {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function initials(name: string) {
  return name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
}

export function LeagueNotes({ leagueId, initialPosts, isCommissioner, currentUserId }: Props) {
  const supabase = createClient();
  const [posts, setPosts] = useState<Post[]>(initialPosts);
  const [body, setBody] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchPosts = useCallback(async () => {
    const { data: postRows } = await supabase
      .from("league_posts")
      .select("id, body, image_url, is_pinned, created_at, user_id, users(display_name, email)")
      .eq("league_id", leagueId)
      .order("is_pinned", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(50);

    if (!postRows) return;

    const postIds = postRows.map((p) => p.id);
    const { data: commentRows } = postIds.length
      ? await supabase
          .from("post_comments")
          .select("id, post_id, body, image_url, created_at, user_id, users(display_name, email)")
          .in("post_id", postIds)
          .order("created_at", { ascending: true })
      : { data: [] };

    const commentsByPost = new Map<string, Comment[]>();
    for (const c of commentRows ?? []) {
      const u = c.users as unknown as { display_name: string | null; email: string } | null;
      const comment: Comment = {
        id: c.id,
        post_id: c.post_id,
        body: c.body,
        image_url: c.image_url,
        created_at: c.created_at,
        user_id: c.user_id,
        authorName: u?.display_name ?? u?.email?.split("@")[0] ?? "Member",
        isCurrentUser: c.user_id === currentUserId,
      };
      if (!commentsByPost.has(c.post_id)) commentsByPost.set(c.post_id, []);
      commentsByPost.get(c.post_id)!.push(comment);
    }

    setPosts(postRows.map((p) => {
      const u = p.users as unknown as { display_name: string | null; email: string } | null;
      return {
        id: p.id,
        body: p.body,
        image_url: p.image_url,
        is_pinned: p.is_pinned,
        created_at: p.created_at,
        user_id: p.user_id,
        authorName: u?.display_name ?? u?.email?.split("@")[0] ?? "Member",
        isCurrentUser: p.user_id === currentUserId,
        comments: commentsByPost.get(p.id) ?? [],
      };
    }));
  }, [supabase, leagueId, currentUserId]);

  useEffect(() => {
    const channel = supabase
      .channel(`league_board:${leagueId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "league_posts", filter: `league_id=eq.${leagueId}` }, fetchPosts)
      .on("postgres_changes", { event: "*", schema: "public", table: "post_comments", filter: `league_id=eq.${leagueId}` }, fetchPosts)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [leagueId, fetchPosts, supabase]);

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    setImageFile(file);
    if (file) {
      const url = URL.createObjectURL(file);
      setImagePreview(url);
    } else {
      setImagePreview(null);
    }
  }

  function clearImage() {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function uploadImage(file: File, prefix: string): Promise<string | null> {
    const ext = file.name.split(".").pop() ?? "jpg";
    const path = `${prefix}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("post-images").upload(path, file, { upsert: false });
    if (error) return null;
    const { data } = supabase.storage.from("post-images").getPublicUrl(path);
    return data.publicUrl;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const text = body.trim();
    if (!text && !imageFile) return;

    setIsPending(true);
    let uploadedUrl: string | null = null;
    if (imageFile) {
      uploadedUrl = await uploadImage(imageFile, `posts/${leagueId}`);
    }

    await supabase.from("league_posts").insert({
      league_id: leagueId,
      user_id: currentUserId,
      body: text || null,
      image_url: uploadedUrl,
    });

    setBody("");
    clearImage();
    setIsPending(false);
    textareaRef.current?.focus();
    fetchPosts();
  }

  async function deletePost(id: string) {
    await supabase.from("league_posts").delete().eq("id", id);
    fetchPosts();
  }

  async function togglePin(id: string, currentlyPinned: boolean) {
    await supabase.from("league_posts").update({ is_pinned: !currentlyPinned }).eq("id", id);
    fetchPosts();
  }

  async function addComment(postId: string, commentBody: string | null, commentImage: File | null) {
    let uploadedUrl: string | null = null;
    if (commentImage) {
      uploadedUrl = await uploadImage(commentImage, `comments/${leagueId}`);
    }
    await supabase.from("post_comments").insert({
      post_id: postId,
      league_id: leagueId,
      user_id: currentUserId,
      body: commentBody || null,
      image_url: uploadedUrl,
    });
    fetchPosts();
  }

  async function deleteComment(id: string) {
    await supabase.from("post_comments").delete().eq("id", id);
    fetchPosts();
  }

  const pinned = posts.filter((p) => p.is_pinned);
  const rest = posts.filter((p) => !p.is_pinned);

  return (
    <div className="notes-panel">
      <div className="notes-header">League Board</div>

      <div className="notes-feed">
        {posts.length === 0 && (
          <p className="notes-empty">No posts yet. Be the first to post.</p>
        )}

        {pinned.map((p) => (
          <PostCard
            key={p.id}
            post={p}
            pinned
            isCommissioner={isCommissioner}
            onDelete={() => deletePost(p.id)}
            onTogglePin={() => togglePin(p.id, p.is_pinned)}
            onAddComment={addComment}
            onDeleteComment={deleteComment}
          />
        ))}

        {rest.map((p) => (
          <PostCard
            key={p.id}
            post={p}
            pinned={false}
            isCommissioner={isCommissioner}
            onDelete={() => deletePost(p.id)}
            onTogglePin={() => togglePin(p.id, p.is_pinned)}
            onAddComment={addComment}
            onDeleteComment={deleteComment}
          />
        ))}
      </div>

      {/* Compose */}
      <form onSubmit={handleSubmit} className="notes-compose">
        {imagePreview && (
          <div className="notes-preview-wrap">
            <img src={imagePreview} alt="preview" className="notes-preview-img" />
            <button type="button" className="notes-preview-remove" onClick={clearImage}>✕</button>
          </div>
        )}
        <textarea
          ref={textareaRef}
          className="notes-textarea"
          placeholder="Post to the league board…"
          value={body}
          maxLength={1000}
          rows={3}
          onChange={(e) => setBody(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleSubmit(e);
          }}
        />
        <div className="notes-compose-actions">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            style={{ display: "none" }}
            onChange={handleImageChange}
          />
          <button
            type="button"
            className="notes-img-btn"
            onClick={() => fileInputRef.current?.click()}
            title="Attach image"
          >
            📷
          </button>
          <button type="submit" className="notes-post-btn" disabled={(!body.trim() && !imageFile) || isPending}>
            {isPending ? "Posting…" : "Post"}
          </button>
        </div>
      </form>
    </div>
  );
}

function PostCard({
  post,
  pinned,
  isCommissioner,
  onDelete,
  onTogglePin,
  onAddComment,
  onDeleteComment,
}: {
  post: Post;
  pinned: boolean;
  isCommissioner: boolean;
  onDelete: () => void;
  onTogglePin: () => void;
  onAddComment: (postId: string, body: string | null, image: File | null) => Promise<void>;
  onDeleteComment: (id: string) => void;
}) {
  const canDelete = post.isCurrentUser || isCommissioner;
  const [showComments, setShowComments] = useState(pinned);
  const [replyBody, setReplyBody] = useState("");
  const [replyImage, setReplyImage] = useState<File | null>(null);
  const [replyPreview, setReplyPreview] = useState<string | null>(null);
  const [replying, setReplying] = useState(false);
  const replyFileRef = useRef<HTMLInputElement>(null);

  function handleReplyImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    setReplyImage(file);
    setReplyPreview(file ? URL.createObjectURL(file) : null);
  }

  function clearReplyImage() {
    setReplyImage(null);
    setReplyPreview(null);
    if (replyFileRef.current) replyFileRef.current.value = "";
  }

  async function submitReply(e: React.FormEvent) {
    e.preventDefault();
    const text = replyBody.trim();
    if (!text && !replyImage) return;
    setReplying(true);
    await onAddComment(post.id, text || null, replyImage);
    setReplyBody("");
    clearReplyImage();
    setReplying(false);
  }

  const commentCount = post.comments.length;

  return (
    <div className={`notes-post${pinned ? " notes-post-pinned" : ""}`}>
      {pinned && <div className="notes-pin-badge">📌 Commissioner&apos;s Note</div>}
      <div className="notes-post-meta">
        <div className="notes-avatar">{initials(post.authorName)}</div>
        <div className="notes-meta-right">
          <span className="notes-author">{post.authorName}</span>
          <span className="notes-time">{timeAgo(post.created_at)}</span>
        </div>
      </div>
      {post.body && <div className="notes-body">{post.body}</div>}
      {post.image_url && (
        <a href={post.image_url} target="_blank" rel="noopener noreferrer" className="notes-img-link">
          <img src={post.image_url} alt="attachment" className="notes-post-img" />
        </a>
      )}

      {/* Action row */}
      <div className="notes-actions">
        <button
          type="button"
          className="notes-comment-toggle"
          onClick={() => setShowComments((v) => !v)}
        >
          💬 {commentCount > 0 ? `${commentCount} comment${commentCount !== 1 ? "s" : ""}` : "Reply"}
          {commentCount > 0 && <span className="notes-toggle-caret">{showComments ? " ▴" : " ▾"}</span>}
        </button>
        <div className="notes-action-right">
          {isCommissioner && (
            <button type="button" className="notes-action-btn" onClick={onTogglePin}>
              {pinned ? "Unpin" : "Pin"}
            </button>
          )}
          {canDelete && (
            <button type="button" className="notes-action-btn notes-action-delete" onClick={onDelete}>
              Delete
            </button>
          )}
        </div>
      </div>

      {/* Thread */}
      {showComments && (
        <div className="notes-thread">
          {post.comments.map((c) => (
            <CommentRow
              key={c.id}
              comment={c}
              isCommissioner={isCommissioner}
              onDelete={() => onDeleteComment(c.id)}
            />
          ))}

          {/* Reply form */}
          <form onSubmit={submitReply} className="notes-reply-form">
            {replyPreview && (
              <div className="notes-preview-wrap">
                <img src={replyPreview} alt="preview" className="notes-preview-img" />
                <button type="button" className="notes-preview-remove" onClick={clearReplyImage}>✕</button>
              </div>
            )}
            <div className="notes-reply-row">
              <input
                type="text"
                className="notes-reply-input"
                placeholder="Write a reply…"
                value={replyBody}
                maxLength={500}
                onChange={(e) => setReplyBody(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) submitReply(e as unknown as React.FormEvent); }}
              />
              <input
                ref={replyFileRef}
                type="file"
                accept="image/*"
                style={{ display: "none" }}
                onChange={handleReplyImage}
              />
              <button
                type="button"
                className="notes-img-btn sm"
                onClick={() => replyFileRef.current?.click()}
                title="Attach image"
              >
                📷
              </button>
              <button
                type="submit"
                className="notes-reply-btn"
                disabled={(!replyBody.trim() && !replyImage) || replying}
              >
                {replying ? "…" : "↵"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

function CommentRow({
  comment,
  isCommissioner,
  onDelete,
}: {
  comment: Comment;
  isCommissioner: boolean;
  onDelete: () => void;
}) {
  const canDelete = comment.isCurrentUser || isCommissioner;

  return (
    <div className="notes-comment">
      <div className="notes-comment-avatar">{initials(comment.authorName)}</div>
      <div className="notes-comment-body">
        <div className="notes-comment-meta">
          <span className="notes-author sm">{comment.authorName}</span>
          <span className="notes-time">{timeAgo(comment.created_at)}</span>
          {canDelete && (
            <button type="button" className="notes-action-btn notes-action-delete xs" onClick={onDelete}>
              Delete
            </button>
          )}
        </div>
        {comment.body && <div className="notes-comment-text">{comment.body}</div>}
        {comment.image_url && (
          <a href={comment.image_url} target="_blank" rel="noopener noreferrer" className="notes-img-link">
            <img src={comment.image_url} alt="attachment" className="notes-comment-img" />
          </a>
        )}
      </div>
    </div>
  );
}
