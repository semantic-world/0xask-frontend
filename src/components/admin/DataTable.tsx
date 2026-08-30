"use client";

import type { ReactNode } from "react";

export type Column<T> = {
  key: string;
  header: string;
  render: (row: T) => ReactNode;
  /** Columns that fall away first on a narrow screen. */
  hideBelow?: "sm" | "md" | "lg";
  align?: "left" | "right";
};

const HIDE: Record<string, string> = {
  sm: "hidden sm:table-cell",
  md: "hidden md:table-cell",
  lg: "hidden lg:table-cell",
};

/**
 * The console's one table.
 *
 * Selection is optional and drives the bulk actions on the review queue. The
 * table scrolls inside its own container rather than pushing the page sideways.
 */
export function DataTable<T extends { id: string }>({
  columns,
  rows,
  onRowClick,
  selectable = false,
  selected,
  onSelectedChange,
  emptyState,
}: {
  columns: ReadonlyArray<Column<T>>;
  rows: readonly T[];
  onRowClick?: (row: T) => void;
  selectable?: boolean;
  selected?: ReadonlySet<string>;
  onSelectedChange?: (next: Set<string>) => void;
  emptyState?: ReactNode;
}) {
  const chosen = selected ?? new Set<string>();
  const allChosen = rows.length > 0 && rows.every((row) => chosen.has(row.id));

  function toggleAll() {
    if (!onSelectedChange) return;
    onSelectedChange(allChosen ? new Set() : new Set(rows.map((row) => row.id)));
  }

  function toggleOne(id: string) {
    if (!onSelectedChange) return;
    const next = new Set(chosen);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    onSelectedChange(next);
  }

  if (rows.length === 0 && emptyState) return <>{emptyState}</>;

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[38rem] border-collapse text-left">
        <thead>
          <tr className="border-b border-border-subtle">
            {selectable ? (
              <th scope="col" className="w-10 px-4 py-2.5">
                <input
                  type="checkbox"
                  checked={allChosen}
                  onChange={toggleAll}
                  aria-label="Select every row on this page"
                  className="size-4 accent-[var(--accent)]"
                />
              </th>
            ) : null}
            {columns.map((column) => (
              <th
                key={column.key}
                scope="col"
                className={`px-4 py-2.5 font-mono text-[var(--text-caption)] font-medium uppercase tracking-[0.1em] text-ink-faint ${
                  column.hideBelow ? HIDE[column.hideBelow] : ""
                } ${column.align === "right" ? "text-right" : ""}`}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={row.id}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
              // A row that only responds to a pointer is unusable from a
              // keyboard, so it takes focus and answers Enter and Space too.
              onKeyDown={
                onRowClick
                  ? (event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        onRowClick(row);
                      }
                    }
                  : undefined
              }
              tabIndex={onRowClick ? 0 : undefined}
              className={`border-b border-border-subtle/60 transition-colors duration-150 last:border-0 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent ${
                onRowClick ? "cursor-pointer hover:bg-surface-sunken" : ""
              } ${chosen.has(row.id) ? "bg-accent-wash" : ""}`}
            >
              {selectable ? (
                <td className="px-4 py-3">
                  <input
                    type="checkbox"
                    checked={chosen.has(row.id)}
                    onChange={() => toggleOne(row.id)}
                    // Selecting a row must not also open it.
                    onClick={(event) => event.stopPropagation()}
                    aria-label={`Select row ${row.id}`}
                    className="size-4 accent-[var(--accent)]"
                  />
                </td>
              ) : null}
              {columns.map((column) => (
                <td
                  key={column.key}
                  className={`px-4 py-3 text-[var(--text-small)] align-top ${
                    column.hideBelow ? HIDE[column.hideBelow] : ""
                  } ${column.align === "right" ? "text-right" : ""}`}
                >
                  {column.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function Pager({
  total,
  limit,
  offset,
  onChange,
}: {
  total: number;
  limit: number;
  offset: number;
  onChange: (offset: number) => void;
}) {
  const from = total === 0 ? 0 : offset + 1;
  const to = Math.min(offset + limit, total);
  const canBack = offset > 0;
  const canForward = to < total;

  if (total <= limit) {
    return (
      <p className="px-5 py-3 font-mono text-[var(--text-caption)] text-ink-faint">
        {total} {total === 1 ? "row" : "rows"}
      </p>
    );
  }

  return (
    <div className="flex items-center justify-between gap-3 border-t border-border-subtle px-5 py-3">
      <p className="tabular font-mono text-[var(--text-caption)] text-ink-faint">
        {from} to {to} of {total}
      </p>
      <div className="flex gap-2">
        <button
          type="button"
          disabled={!canBack}
          onClick={() => onChange(Math.max(0, offset - limit))}
          className="rounded-[var(--radius-sm)] px-3 py-1 text-[var(--text-caption)] text-ink-muted transition-colors hover:bg-surface-sunken hover:text-ink disabled:opacity-40 disabled:hover:bg-transparent"
        >
          Previous
        </button>
        <button
          type="button"
          disabled={!canForward}
          onClick={() => onChange(offset + limit)}
          className="rounded-[var(--radius-sm)] px-3 py-1 text-[var(--text-caption)] text-ink-muted transition-colors hover:bg-surface-sunken hover:text-ink disabled:opacity-40 disabled:hover:bg-transparent"
        >
          Next
        </button>
      </div>
    </div>
  );
}
