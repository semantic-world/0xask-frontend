"use client";

/**
 * Getting the resume out of the browser.
 *
 * Two paths, because they suit different needs. Print produces a PDF through
 * the browser's own Save as PDF, which the print styles are written for and
 * which needs no rendering engine on the server. Download produces a Markdown
 * file, which pastes into an application form without fighting a layout.
 */
export function ResumeActions({ variant }: { variant: string }) {
  return (
    <div className="flex flex-wrap gap-2 print:hidden">
      <button
        type="button"
        onClick={() => window.print()}
        className="inline-flex h-10 items-center gap-2 rounded-[var(--radius)] border border-border-strong px-4 text-[var(--text-small)] font-medium transition-colors duration-300 hover:border-accent hover:text-accent active:scale-[0.98]"
      >
        Print or save as PDF
      </button>

      <a
        href={`/api/v1/resume/${variant}/download`}
        // The browser handles the save. The response sets the filename.
        className="inline-flex h-10 items-center gap-2 rounded-[var(--radius)] border border-border-strong px-4 text-[var(--text-small)] font-medium transition-colors duration-300 hover:border-accent hover:text-accent active:scale-[0.98]"
      >
        Download as Markdown
      </a>
    </div>
  );
}
