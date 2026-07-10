import { createFileRoute, Link } from "@tanstack/react-router";
import { BLOG_POSTS } from "@/lib/blog-data";
import { Tape, Badge, Button } from "@/components/notebook";
import { BookOpen, Calendar, ArrowLeft } from "lucide-react";
import { useApplyTheme } from "@/stores/theme-store";

export const Route = createFileRoute("/blog/")({
  head: () => ({
    meta: [
      { title: "DayCraft Blog — Productivity, Focus & Study Guides" },
      {
        name: "description",
        content:
          "Read articles on the Pomodoro technique, study methods, tracking study hours without burnout, and how to build a daily goal checklist with DayCraft.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://daycraft.live/blog" },
      { property: "og:title", content: "DayCraft Blog — Productivity, Focus & Study Guides" },
      {
        property: "og:description",
        content:
          "Read articles on the Pomodoro technique, study methods, tracking study hours without burnout, and how to build a daily goal checklist with DayCraft.",
      },
      { property: "og:image", content: "https://daycraft.live/og-image.png" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "DayCraft Blog — Productivity, Focus & Study Guides" },
      {
        name: "twitter:description",
        content:
          "Read articles on the Pomodoro technique, study methods, tracking study hours without burnout, and how to build a daily goal checklist with DayCraft.",
      },
      { name: "twitter:image", content: "https://daycraft.live/og-image.png" },
    ],
    links: [{ rel: "canonical", href: "https://daycraft.live/blog" }],
  }),
  component: BlogIndexPage,
});

function BlogIndexPage() {
  useApplyTheme();

  return (
    <main className="min-h-screen px-4 pt-8 pb-12 sm:px-8 lg:px-16 flex flex-col justify-between bg-paper">
      <div className="mx-auto max-w-4xl w-full space-y-12">
        {/* Navigation / Header */}
        <header className="relative paper-card p-6 flex flex-wrap items-center justify-between gap-4">
          <Tape className="absolute -top-3 left-8" rotate={-4} />
          <div className="flex items-center gap-3">
            <Link
              to="/"
              className="p-2 rounded-full border border-ink/20 hover:bg-accent-soft text-ink hover:text-accent transition-colors"
              aria-label="Back to home"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <p className="font-hand text-sm text-ink-soft">productivity resources</p>
              <h1 className="font-hand text-4xl leading-none">
                DayCraft <span className="highlight-marker">Blog</span> 📖
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/auth">
              <Button size="sm">Go to App →</Button>
            </Link>
          </div>
        </header>

        {/* Intro */}
        <section className="text-center py-4 space-y-2">
          <h2 className="font-hand text-3xl sm:text-4xl text-ink">
            Mindful Study Guides & Time Optimization
          </h2>
          <p className="text-sm text-ink-soft max-w-xl mx-auto">
            Practical strategies, guides, and insights to help you build consistent focus, manage
            daily tasks, and study without burnout.
          </p>
        </section>

        {/* Blog Post List */}
        <section className="space-y-6">
          {BLOG_POSTS.map((post) => (
            <article
              key={post.slug}
              className="paper-card p-6 relative hover:scale-[1.01] transition-transform duration-200"
            >
              <Tape className="absolute -top-3 right-12 h-3.5 w-16 opacity-75" rotate={2} />

              <div className="flex flex-col md:flex-row md:items-start gap-4">
                {/* Visual Cover/Icon container */}
                <div className="w-12 h-12 shrink-0 rounded-lg border-2 border-ink flex items-center justify-center bg-paper-2 text-2xl shadow-[2px_2px_0px_rgba(0,0,0,0.15)]">
                  {post.coverImage}
                </div>

                <div className="space-y-3 w-full">
                  <div className="flex flex-wrap items-center gap-3 text-xs text-ink-soft">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" />
                      {post.publishedAt}
                    </span>
                    <span className="flex items-center gap-1">
                      <BookOpen className="h-3.5 w-3.5" />5 min read
                    </span>
                  </div>

                  <div className="space-y-1">
                    <h3 className="font-hand text-2xl sm:text-3xl font-bold leading-tight text-ink hover:text-accent transition-colors">
                      <Link to="/blog/$slug" params={{ slug: post.slug }}>
                        {post.title}
                      </Link>
                    </h3>
                    <p className="text-sm sm:text-base text-ink-soft leading-relaxed">
                      {post.description}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {post.tags.map((tag) => (
                      <Badge
                        key={tag}
                        tone="highlight"
                        className="text-[10px] uppercase tracking-wider"
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>

                  <div className="pt-2">
                    <Link
                      to="/blog/$slug"
                      params={{ slug: post.slug }}
                      className="inline-flex items-center font-bold text-accent hover:underline text-sm"
                    >
                      Read full guide →
                    </Link>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </section>
      </div>

      {/* Footer */}
      <footer className="mt-16 border-t-2 border-ink/10 pt-6 text-center w-full">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-ink-soft">
          <div>
            Built for mindful productivity at{" "}
            <Link to="/" className="underline text-ink hover:text-accent font-bold">
              DayCraft
            </Link>
          </div>
          <div className="font-hand text-sm">© 2026 DayCraft. All rights reserved.</div>
        </div>
      </footer>
    </main>
  );
}
