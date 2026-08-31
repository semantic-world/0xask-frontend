import type { ReactNode } from "react";

/**
 * A page section with a numbered eyebrow.
 *
 * The numbering is not decoration. A case study read top to bottom benefits
 * from knowing where it is, and a reader scanning benefits from a fixed set of
 * anchors that mean the same thing on every project page.
 */
export function Section({
  eyebrow,
  title,
  children,
  id,
  bordered = true,
}: {
  eyebrow?: string;
  title?: string;
  children: ReactNode;
  id?: string;
  bordered?: boolean;
}) {
  return (
    <section
      id={id}
      className={`py-14 sm:py-20 ${bordered ? "border-t border-border-subtle" : ""}`}
    >
      {eyebrow || title ? (
        <header className="mb-8">
          {eyebrow ? (
            <p className="font-mono text-[var(--text-caption)] uppercase tracking-[0.18em] text-ink-faint">
              {eyebrow}
            </p>
          ) : null}
          {title ? (
            <h2 className="mt-3 max-w-[24ch] text-[length:var(--text-h2)] font-medium">{title}</h2>
          ) : null}
        </header>
      ) : null}
      {children}
    </section>
  );
}

/**
 * Long form prose from the database.
 *
 * Rendered as paragraphs split on blank lines rather than through a markdown
 * parser. The content is written by the owner in the console as plain prose,
 * and adding a parser would mean adding a sanitiser, which is a dependency and
 * an attack surface for a feature nobody asked for.
 */
/**
 * Inline emphasis and code spans, and nothing else.
 *
 * A case study that names three tools wants their names to stand out, and an
 * install command wants to look like a command rather than like prose. That is
 * the whole requirement, so this handles `**bold**` and `` `code` `` and
 * leaves every other character alone.
 *
 * It builds React elements rather than a string of HTML. Nothing here is ever
 * handed to `dangerouslySetInnerHTML`, so text arriving from the database
 * cannot become markup however it is written.
 */
const INLINE = /(\*\*[^*]+\*\*|`[^`]+`)/g;

function inline(text: string): ReactNode[] {
  return text.split(INLINE).map((piece, index) => {
    const key = `${index}-${piece.slice(0, 24)}`;

    if (piece.startsWith("**") && piece.endsWith("**") && piece.length > 4) {
      return (
        <strong key={key} className="font-medium text-ink">
          {piece.slice(2, -2)}
        </strong>
      );
    }

    if (piece.startsWith("`") && piece.endsWith("`") && piece.length > 2) {
      return (
        <code
          key={key}
          className="rounded bg-surface-sunken px-1.5 py-0.5 font-mono text-[0.85em] text-ink"
        >
          {piece.slice(1, -1)}
        </code>
      );
    }

    return piece;
  });
}

export function Prose({ text }: { text: string | null | undefined }) {
  if (!text?.trim()) return null;

  const paragraphs = text
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);

  return (
    <div className="space-y-4">
      {paragraphs.map((paragraph) => (
        <p key={paragraph.slice(0, 60)} className="max-w-[68ch] text-ink-muted">
          {inline(paragraph)}
        </p>
      ))}
    </div>
  );
}

export function TagList({ items, label }: { items: string[]; label?: string }) {
  if (!items.length) return null;

  return (
    <ul aria-label={label} className="flex flex-wrap gap-1.5">
      {items.map((item) => (
        <li
          key={item}
          className="rounded-full border border-border-subtle px-2.5 py-1 font-mono text-[0.6875rem] uppercase tracking-[0.06em] text-ink-muted"
        >
          {item}
        </li>
      ))}
    </ul>
  );
}

export function EmptyNotice({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-[var(--radius-lg)] border border-dashed border-border-subtle px-6 py-12 text-center">
      <p className="text-[length:var(--text-small)] font-medium text-ink-muted">{title}</p>
      <p className="mx-auto mt-2 max-w-[48ch] text-[var(--text-caption)] text-ink-faint">{body}</p>
    </div>
  );
}
