import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { getAllPosts } from "@/lib/blog";

const AGENT_DIR = path.join(process.cwd(), "content", "agent");
const BLOG_DIR = path.join(process.cwd(), "content", "blog");

// Public marketing pages with a hand-maintained markdown variant in content/agent/
const PAGE_FILES: Record<string, string> = {
  "/": "index.md",
  "/formats": "formats.md",
  "/support": "support.md",
  "/privacy": "privacy.md",
  "/about": "about.md",
  "/docs": "docs.md",
};

export const NOT_FOUND_MARKDOWN = `# 404 — Page not found

This page does not exist on thepickempool.com.

Where to look next:

- [Home](https://thepickempool.com/) — platform overview
- [Site map](https://thepickempool.com/sitemap.xml) — every public URL
- [llms.txt](https://thepickempool.com/llms.txt) — structured site overview for agents
- [Developer & agent resources](https://thepickempool.com/docs)
- [Help & support](https://thepickempool.com/support) — or email admin@thepickempool.com
`;

function isSafeSlug(slug: string): boolean {
  return /^[a-z0-9-]+$/i.test(slug);
}

function blogPostMarkdown(slug: string): string | null {
  if (!isSafeSlug(slug)) return null;
  const file = path.join(BLOG_DIR, `${slug}.mdx`);
  if (!fs.existsSync(file)) return null;
  const raw = fs.readFileSync(file, "utf8");
  const { data, content } = matter(raw);
  const title = (data.title as string) ?? slug;
  const description = (data.description as string) ?? "";
  const date = (data.date as string) ?? "";
  const header = [
    `# ${title}`,
    "",
    description,
    date ? `\n_Published ${date} · [thepickempool blog](https://thepickempool.com/blog)_` : "",
    "",
  ].join("\n");
  return `${header}\n${content.trim()}\n`;
}

function blogIndexMarkdown(): string {
  const posts = getAllPosts();
  const lines = posts.map(
    (p) => `- [${p.title}](https://thepickempool.com/blog/${p.slug})${p.description ? ` — ${p.description}` : ""}`,
  );
  return [
    "# thepickempool Blog — NFL Pick'em Guides",
    "",
    "Guides on running and winning NFL pick'em pools: confidence scoring, ATS strategy, tiebreakers, payouts, and commissioner practices.",
    "",
    ...lines,
    "",
  ].join("\n");
}

/** True if this pathname has a markdown variant. */
export function hasMarkdownVariant(pathname: string): boolean {
  if (pathname in PAGE_FILES) return true;
  if (pathname === "/blog") return true;
  const m = pathname.match(/^\/blog\/([a-z0-9-]+)$/i);
  if (m) return fs.existsSync(path.join(BLOG_DIR, `${m[1]}.mdx`));
  return false;
}

/** Markdown content for a public pathname, or null if none exists. */
export function getMarkdownForPath(pathname: string): string | null {
  const file = PAGE_FILES[pathname];
  if (file) {
    const full = path.join(AGENT_DIR, file);
    if (!fs.existsSync(full)) return null;
    return fs.readFileSync(full, "utf8");
  }
  if (pathname === "/blog") return blogIndexMarkdown();
  const m = pathname.match(/^\/blog\/([a-z0-9-]+)$/i);
  if (m) return blogPostMarkdown(m[1]);
  return null;
}
