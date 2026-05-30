import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MDXRemote } from "next-mdx-remote/rsc";
import { getAllPosts, getPostBySlug } from "@/lib/blog";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const posts = getAllPosts();
  return posts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) return {};

  return {
    title: `${post.title} | thepickempool Blog`,
    description: post.description,
    alternates: { canonical: `https://thepickempool.com/blog/${slug}` },
    openGraph: {
      title: post.title,
      description: post.description,
      url: `https://thepickempool.com/blog/${slug}`,
      siteName: "thepickempool",
      type: "article",
      publishedTime: post.date,
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.description,
    },
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = getPostBySlug(slug);

  if (!post || !post.content) {
    notFound();
  }

  const formattedDate = new Date(post.date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });

  return (
    <div className="blog-shell">
      <div className="blog-post-header">
        <div className="blog-post-header-inner">
          <Link href="/blog" className="blog-back">
            &larr; Back to blog
          </Link>

          <h1 className="blog-post-headline">{post.title}</h1>

          <div className="blog-post-byline">
            <time dateTime={post.date}>{formattedDate}</time>
            {post.readingTime && (
              <>
                <span className="blog-post-meta-sep">·</span>
                <span>{post.readingTime}</span>
              </>
            )}
          </div>

          {post.tags.length > 0 && (
            <div className="blog-tags">
              {post.tags.map((tag) => (
                <span key={tag} className="blog-tag">
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="blog-content">
        <article className="blog-article">
          <MDXRemote source={post.content} />
        </article>

        <div className="blog-article-footer">
          <Link href="/blog" className="blog-back">
            &larr; Back to blog
          </Link>
        </div>
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
