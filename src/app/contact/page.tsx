import type { Metadata } from "next";
import { getProfile, NotPublished } from "@/lib/server-api";

/**
 * Rendered per request.
 *
 * The content changes whenever the owner publishes or blocks something, and
 * the backend already caches and invalidates these responses. Prerendering
 * here would put a second, slower cache in front of that and delay a publish
 * reaching visitors, which is the opposite of what the invalidation is for.
 */
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  alternates: { canonical: "/contact" },
  title: "Contact",
  description: "How to get in touch.",
};

export default async function ContactPage() {
  let profile: Awaited<ReturnType<typeof getProfile>> | null = null;

  try {
    profile = await getProfile();
  } catch (error) {
    if (!(error instanceof NotPublished)) throw error;
  }

  return (
    <div className="shell-width flex min-h-[calc(100svh-var(--header-height)-8rem)] flex-col justify-center py-20">
      <p className="font-mono text-[var(--text-caption)] uppercase tracking-[0.18em] text-ink-faint">
        Contact
      </p>

      <h1 className="mt-5 max-w-[18ch] text-[length:var(--text-h1)] font-medium">
        Worth a conversation?
      </h1>

      <p className="mt-6 max-w-[52ch] text-[length:var(--text-lead)] text-ink-muted">
        {profile?.availability ??
          "Open to conversations about engineering work across AI, backend, protocol, and security."}
      </p>

      {profile?.links.length ? (
        <ul className="mt-10 flex flex-wrap gap-3">
          {profile.links.map((link) => (
            <li key={link.url}>
              <a
                href={link.url}
                rel="noopener noreferrer me"
                target="_blank"
                className="inline-flex h-12 items-center gap-2 rounded-[var(--radius)] border border-border-strong px-6 text-[var(--text-small)] font-medium transition-colors duration-300 hover:border-accent hover:text-accent"
              >
                {link.label}
                <span aria-hidden="true">&#8599;</span>
              </a>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-10 text-[var(--text-small)] text-ink-faint">
          Contact details are not published yet.
        </p>
      )}
    </div>
  );
}
