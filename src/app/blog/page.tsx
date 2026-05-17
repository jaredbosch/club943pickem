import type { Metadata } from "next";
import Link from "next/link";
import { getAllPosts } from "@/lib/blog";

export const metadata: Metadata = {
  title: "NFL Pick'em Blog | thepickempool",
  description:
    "NFL pick'em tips, ATS strategy guides, and pool management advice for running the best confidence pick'em pool with your crew.",
};

export default function BlogIndexPage() {
  const posts = getAllPosts();

  return (
    <div className="blog-shell">
      <div className="blog-header">
        <div className="blog-header-inner">
          <Link href="/" className="blog-back-home">
            ← thepickempool
          </Link>
          <h1 className="blog-title">The Pick&apos;em Pool Blog</h1>
          <p className="blog-subtitle">
            NFL pick&apos;em strategy, ATS insights, and pool management guides.
          </p>
        </div>
      </div>

      <div className="blog-content">
        {posts.length === 0 ? (
          <p className="blog-empty">No posts yet. Check back soon.</p>
        ) : (
          <div className="blog-post-list">
            {posts.map((post) => (
              <article key={post.slug} className="blog-post-card">
                <div className="blog-post-meta">
                  <time dateTime={post.date}>
                    {new Date(post.date).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                      timeZone: "UTC",
                    })}
                  </time>
                  {post.readingTime && (
                    <>
                      <span className="blog-post-meta-sep">·</span>
                      <span>{post.readingTime}</span>
                    </>
                  )}
                </div>

                <h2 className="blog-post-title">
                  <Link href={`/blog/${post.slug}`}>{post.title}</Link>
                </h2>

                {post.description && (
                  <p className="blog-post-desc">{post.description}</p>
                )}

                {post.tags.length > 0 && (
                  <div className="blog-tags">
                    {post.tags.map((tag) => (
                      <span key={tag} className="blog-tag">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                <Link href={`/blog/${post.slug}`} className="blog-read-link">
                  Read &rarr;
                </Link>
              </article>
            ))}
          </div>
        )}
      </div>

      <footer className="blog-footer">
        <Link href="/" className="blog-footer-link">
          ← Back to thepickempool
        </Link>
        <Link href="/privacy" className="blog-footer-link">
          Privacy Policy
        </Link>
      </footer>
    </div>
  );
}
