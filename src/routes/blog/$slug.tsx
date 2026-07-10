import { createFileRoute, Link } from "@tanstack/react-router";
import { BLOG_POSTS } from "@/lib/blog-data";
import { Tape, Badge, Button } from "@/components/notebook";
import { Calendar, User, ArrowLeft, BookOpen } from "lucide-react";
import { useApplyTheme } from "@/stores/theme-store";

export const Route = createFileRoute("/blog/$slug")({
  loader: ({ params }) => {
    const post = BLOG_POSTS.find((p) => p.slug === params.slug);
    if (!post) {
      throw new Error("Post not found");
    }
    return { post };
  },
  head: ({ loaderData }) => {
    const post = loaderData?.post;
    if (!post) return {};
    return {
      meta: [
        { title: `${post.title} — DayCraft Blog` },
        { name: "description", content: post.description },
        // Open Graph
        { property: "og:type", content: "article" },
        { property: "og:url", content: `https://daycraft.live/blog/${post.slug}` },
        { property: "og:title", content: `${post.title} — DayCraft Blog` },
        { property: "og:description", content: post.description },
        { property: "og:image", content: "https://daycraft.live/og-image.png" },
        // Twitter Card
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:title", content: `${post.title} — DayCraft Blog` },
        { name: "twitter:description", content: post.description },
        { name: "twitter:image", content: "https://daycraft.live/og-image.png" },
      ],
      links: [{ rel: "canonical", href: `https://daycraft.live/blog/${post.slug}` }],
    };
  },
  component: BlogPostPage,
});

function MarkdownRenderer({ content }: { content: string }) {
  const blocks = content.split("\n\n");

  return (
    <div className="space-y-6 text-ink-soft leading-relaxed text-base sm:text-lg">
      {blocks.map((block, index) => {
        const trimmed = block.trim();
        if (!trimmed) return null;

        // Header 1 (# Title)
        if (trimmed.startsWith("# ")) {
          return (
            <h1
              key={index}
              className="font-hand text-4xl sm:text-5xl font-bold text-ink mt-8 mb-4 border-b border-ink/10 pb-2"
            >
              {trimmed.substring(2)}
            </h1>
          );
        }

        // Header 2 (## Title)
        if (trimmed.startsWith("## ")) {
          return (
            <h2 key={index} className="font-hand text-2xl sm:text-3xl font-bold text-ink mt-6 mb-3">
              {trimmed.substring(3)}
            </h2>
          );
        }

        // Header 3 (### Title)
        if (trimmed.startsWith("### ")) {
          return (
            <h3 key={index} className="font-hand text-xl sm:text-2xl font-bold text-ink mt-4 mb-2">
              {trimmed.substring(4)}
            </h3>
          );
        }

        // Horizontal Rule (---)
        if (trimmed === "---") {
          return <hr key={index} className="border-t-2 border-dashed border-ink/10 my-8" />;
        }

        // Unordered List (- item)
        if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
          const items = trimmed.split("\n").map((l) => l.replace(/^[-*]\s+/, ""));
          return (
            <ul key={index} className="list-disc pl-6 space-y-2 my-4">
              {items.map((item, itemIdx) => {
                // Inline bold parse
                return (
                  <li
                    key={itemIdx}
                    dangerouslySetInnerHTML={{ __html: parseInlineMarkdown(item) }}
                  />
                );
              })}
            </ul>
          );
        }

        // Numbered List (1. item)
        if (/^\d+\.\s+/.test(trimmed)) {
          const items = trimmed.split("\n").map((l) => l.replace(/^\d+\.\s+/, ""));
          return (
            <ol key={index} className="list-decimal pl-6 space-y-2 my-4">
              {items.map((item, itemIdx) => {
                return (
                  <li
                    key={itemIdx}
                    dangerouslySetInnerHTML={{ __html: parseInlineMarkdown(item) }}
                  />
                );
              })}
            </ol>
          );
        }

        // Table parse
        if (trimmed.startsWith("|")) {
          const rows = trimmed.split("\n").map((row) =>
            row
              .split("|")
              .map((col) => col.trim())
              .filter((_, i, arr) => i > 0 && i < arr.length - 1),
          );
          const isHeaderSep = rows[1]?.every((cell) => /^:-+|-+:|:-+:|-+$/.test(cell));
          const bodyRows = isHeaderSep ? rows.slice(2) : rows.slice(1);
          const headerRow = rows[0];

          return (
            <div
              key={index}
              className="overflow-x-auto my-6 border border-ink/20 rounded bg-paper-2/40"
            >
              <table className="min-w-full divide-y divide-ink/20">
                <thead className="bg-paper-2">
                  <tr>
                    {headerRow.map((cell, cellIdx) => (
                      <th
                        key={cellIdx}
                        className="px-4 py-2 text-left font-hand text-lg text-ink border-r border-ink/15 last:border-r-0"
                      >
                        {cell}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink/10">
                  {bodyRows.map((row, rowIdx) => (
                    <tr key={rowIdx}>
                      {row.map((cell, cellIdx) => (
                        <td
                          key={cellIdx}
                          className="px-4 py-2 border-r border-ink/10 last:border-r-0 text-sm"
                          dangerouslySetInnerHTML={{ __html: parseInlineMarkdown(cell) }}
                        />
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        }

        // Paragraph (default)
        return (
          <p
            key={index}
            className="my-4"
            dangerouslySetInnerHTML={{ __html: parseInlineMarkdown(trimmed) }}
          />
        );
      })}
    </div>
  );
}

// Basic helper to parse **bold**, [links](/), and `code`
function parseInlineMarkdown(text: string): string {
  return (
    text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      // Bold **text**
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      // Link [text](href)
      .replace(
        /\[(.*?)\]\((.*?)\)/g,
        '<a href="$2" class="underline text-accent font-bold hover:text-accent/80 transition-colors">$1</a>',
      )
      // Inline code `code`
      .replace(
        /`(.*?)`/g,
        '<code class="bg-paper-2/80 px-1.5 py-0.5 rounded text-sm font-mono border border-ink/10 text-ink">$1</code>',
      )
  );
}

function BlogPostPage() {
  useApplyTheme();
  const { post } = Route.useLoaderData();

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.description,
    datePublished: post.publishedAt,
    author: {
      "@type": "Person",
      name: "Kanhaiya Yadav",
    },
    publisher: {
      "@type": "Organization",
      name: "DayCraft",
      logo: {
        "@type": "ImageObject",
        url: "https://daycraft.live/favicon.svg",
      },
    },
    image: "https://daycraft.live/og-image.png",
  };

  return (
    <main className="min-h-screen px-4 pt-8 pb-12 sm:px-8 lg:px-16 flex flex-col justify-between bg-paper">
      {/* Schema.org Article Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />

      <div className="mx-auto max-w-3xl w-full space-y-8">
        {/* Navigation back */}
        <div className="flex items-center justify-between">
          <Link
            to="/blog"
            className="inline-flex items-center gap-1.5 text-sm font-bold text-ink-soft hover:text-accent transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to all guides
          </Link>
          <Link to="/auth">
            <Button size="sm">Go to App →</Button>
          </Link>
        </div>

        {/* Article Card Wrapper */}
        <article className="paper-card p-6 sm:p-10 relative">
          <Tape className="absolute -top-3 left-12" rotate={-3} />
          <Tape className="absolute -top-3 right-16 h-4 w-20" rotate={2} />

          {/* Header info */}
          <div className="space-y-4 border-b border-ink/10 pb-6">
            <div className="flex items-center gap-2">
              <span className="text-3xl">{post.coverImage}</span>
              <div className="flex flex-wrap gap-1">
                {post.tags.map((tag) => (
                  <Badge key={tag} tone="highlight" className="text-[10px] uppercase">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>

            <h1 className="font-hand text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight text-ink">
              {post.title}
            </h1>

            <div className="flex flex-wrap items-center gap-y-2 gap-x-4 text-xs sm:text-sm text-ink-soft pt-1">
              <span className="flex items-center gap-1">
                <User className="h-4 w-4" />
                By Kanhaiya Yadav
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                Published {post.publishedAt}
              </span>
              <span className="flex items-center gap-1">
                <BookOpen className="h-4 w-4" />5 min read
              </span>
            </div>
          </div>

          {/* Article outline */}
          <div className="my-6 p-4 rounded border border-dashed border-ink/25 bg-paper-2/30">
            <h3 className="font-hand text-xl font-bold text-ink mb-2">Outline of this guide:</h3>
            <ul className="list-inside list-decimal space-y-1 text-sm text-ink-soft">
              {post.outline.map((o, idx) => (
                <li key={idx}>{o}</li>
              ))}
            </ul>
          </div>

          {/* Article Main Body Content */}
          <div className="prose max-w-none pt-2">
            <MarkdownRenderer content={post.content} />
          </div>
        </article>
      </div>

      {/* Footer */}
      <footer className="mt-16 border-t-2 border-ink/10 pt-6 text-center w-full">
        <div className="max-w-3xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-ink-soft">
          <div>
            Want to start tracking? Try{" "}
            <Link to="/" className="underline text-ink hover:text-accent font-bold">
              DayCraft
            </Link>{" "}
            instantly in Guest Mode.
          </div>
          <div className="font-hand text-sm">© 2026 DayCraft. All rights reserved.</div>
        </div>
      </footer>
    </main>
  );
}
