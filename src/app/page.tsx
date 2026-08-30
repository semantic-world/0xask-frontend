import Link from "next/link";

export default function HomePage() {
  return (
    <div className="shell-width">
      <section className="flex min-h-[calc(100svh-var(--header-height)-4rem)] flex-col justify-center py-20">
        <p className="font-mono text-[var(--text-caption)] uppercase tracking-[0.18em] text-ink-faint">
          Engineering portfolio
        </p>

        <h1 className="mt-6 max-w-[18ch] text-[length:var(--text-display)] font-medium">
          Systems built to be
          <span className="text-accent"> understood</span>, not just shipped.
        </h1>

        <p className="mt-7 max-w-[58ch] text-[length:var(--text-lead)] text-ink-muted">
          The work of 0xSemantic across AI infrastructure, backend systems, protocol engineering,
          and security. Browse it the conventional way, or ask about it directly and get answers
          grounded in evidence.
        </p>

        <div className="mt-11 flex flex-col gap-3 sm:flex-row sm:items-center">
          <Link
            href="/work"
            className="group inline-flex h-12 items-center justify-center gap-2 rounded-[var(--radius)] bg-ink px-6 text-[var(--text-small)] font-medium text-ink-inverse transition-transform duration-300 ease-[var(--ease-out)] active:scale-[0.98]"
          >
            Explore the work
            <span
              aria-hidden="true"
              className="transition-transform duration-300 ease-[var(--ease-out)] group-hover:translate-x-0.5"
            >
              &rarr;
            </span>
          </Link>

          <Link
            href="/ask"
            className="inline-flex h-12 items-center justify-center gap-2 rounded-[var(--radius)] border border-border-strong px-6 font-mono text-[var(--text-small)] font-medium text-ink transition-colors duration-300 hover:border-accent hover:text-accent active:scale-[0.98]"
          >
            Ask 0xAsk
          </Link>
        </div>
      </section>

      <section className="border-t border-border-subtle py-16" aria-labelledby="paradigms">
        <h2 id="paradigms" className="sr-only">
          Two ways to explore
        </h2>

        <div className="grid gap-px overflow-hidden rounded-[var(--radius-lg)] border border-border-subtle bg-border-subtle sm:grid-cols-2">
          {[
            {
              eyebrow: "Classic",
              title: "Browse it",
              body: "Profile, experience, capabilities, and full case studies for each project. Structured, indexable, and readable in a minute.",
              href: "/work",
              cta: "Selected work",
            },
            {
              eyebrow: "0xAsk",
              title: "Ask it",
              body: "Query the same curated knowledge directly. Every answer cites the evidence behind it, and says so plainly when the evidence is not there.",
              href: "/ask",
              cta: "Start asking",
            },
          ].map((card) => (
            <Link
              key={card.href}
              href={card.href}
              className="group flex flex-col gap-3 bg-surface p-7 transition-colors duration-300 hover:bg-surface-raised sm:p-9"
            >
              <span className="font-mono text-[var(--text-caption)] uppercase tracking-[0.14em] text-ink-faint">
                {card.eyebrow}
              </span>
              <span className="text-[length:var(--text-h3)] font-medium">{card.title}</span>
              <span className="max-w-[42ch] text-ink-muted">{card.body}</span>
              <span className="mt-3 inline-flex items-center gap-2 text-[var(--text-small)] font-medium text-accent">
                {card.cta}
                <span
                  aria-hidden="true"
                  className="transition-transform duration-300 ease-[var(--ease-out)] group-hover:translate-x-1"
                >
                  &rarr;
                </span>
              </span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
