"use client";

import { useState, useTransition, useRef, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

type Post = {
  id: string;
  body: string;
  is_pinned: boolean;
  created_at: string;
  user_id: string;
  authorName: string;
  isCurrentUser: boolean;
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

export function LeagueNotes({ leagueId, initialPosts, isCommissioner, currentUserId }: Props) {
  const supabase = createClient();
  const [posts, setPosts] = useState<Post[]>(initialPosts);
  const [body, setBody] = useState("");
  const [isPending, startTransition] = useTransition();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel(`league_posts:${leagueId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "league_posts", filter: `league_id=eq.${leagueId}` },
        () => { fetchPosts(); }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leagueId]);

  async function fetchPosts() {
    const { data } = await supabase
      .from("league_posts")
      .select("id, body, is_pinned, created_at, user_id, users(display_name, email)")
      .eq("league_id", leagueId)
      .order("is_pinned", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(50);

    if (data) {
      setPosts(data.map((p) => {
        const u = p.users as unknown as { display_name: string | null; email: string } | null;
        return {
          id: p.id,
          body: p.body,
          is_pinned: p.is_pinned,
          created_at: p.created_at,
          user_id: p.user_id,
          authorName: u?.display_name ?? u?.email?.split("@")[0] ?? "Member",
          isCurrentUser: p.user_id === currentUserId,
        };
      }));
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const text = body.trim();
    if (!text) return;

    startTransition(async () => {
      await supabase.from("league_posts").insert({ league_id: leagueId, user_id: currentUserId, body: text });
      setBody("");
      textareaRef.current?.focus();
      fetchPosts();
    });
  }

  async function deletePost(id: string) {
    await supabase.from("league_posts").delete().eq("id", id);
    fetchPosts();
  }

  async function togglePin(id: string, currentlyPinned: boolean) {
    await supabase.from("league_posts").update({ is_pinned: !currentlyPinned }).eq("id", id);
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
          />
        ))}
      </div>

      <form onSubmit={handleSubmit} className="notes-compose">
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
        <button type="submit" className="notes-post-btn" disabled={!body.trim() || isPending}>
          {isPending ? "Posting…" : "Post"}
        </button>
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
}: {
  post: Post;
  pinned: boolean;
  isCommissioner: boolean;
  onDelete: () => void;
  onTogglePin: () => void;
}) {
  const canDelete = post.isCurrentUser || isCommissioner;

  return (
    <div className={`notes-post${pinned ? " notes-post-pinned" : ""}`}>
      {pinned && <div className="notes-pin-badge">📌 Commissioner</div>}
      <div className="notes-post-meta">
        <span className="notes-author">{post.authorName}</span>
        <span className="notes-time">{timeAgo(post.created_at)}</span>
      </div>
      <div className="notes-body">{post.body}</div>
      <div className="notes-actions">
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
  );
}
