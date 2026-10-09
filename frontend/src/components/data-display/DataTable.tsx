import React from 'react';

export interface Column<T> {
  /** Unique key; also the default render key. */
  key: string;
  header: React.ReactNode;
  /** Custom cell renderer; falls back to `String(row[key])`. */
  render?: (row: T) => React.ReactNode;
  /** Hide the column below the md breakpoint. */
  secondary?: boolean;
}

export interface DataTableProps<T> {
  columns: Column<T>[];
  rows: T[];
  /** Extracts a stable row key (defaults to `row.id`). */
  rowKey?: (row: T) => string;
  /** Rendered when `rows` is empty. */
  empty?: React.ReactNode;
  caption?: string;
}

/**
 * Reusable table: consistent header styling, responsive scroll wrapper, and an
 * empty slot so pages never render a bare `<table>`.
 */
export default function DataTable<T extends { id: string }>({
  columns,
  rows,
  rowKey,
  empty,
  caption,
}: DataTableProps<T>) {
  if (rows.length === 0 && empty) return <>{empty}</>;

  return (
    <div className="w-full rounded-xl border border-sandstone bg-surface dark:border-gold/25 dark:bg-primary">
      <table className="w-full text-sm block md:table border-collapse">
        {caption && <caption className="sr-only">{caption}</caption>}
        <thead className="hidden md:table-header-group">
          <tr className="border-b border-sandstone bg-slate-50 dark:border-gold/20 dark:bg-white/5">
            {columns.map((col) => (
              <th
                key={col.key}
                scope="col"
                className={`px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-gold-light/80 ${
                  col.secondary ? 'hidden md:table-cell' : ''
                }`}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="block md:table-row-group divide-y md:divide-y-0 divide-slate-100 dark:divide-white/5">
          {rows.map((row) => (
            <tr
              key={rowKey ? rowKey(row) : row.id}
              className="block md:table-row md:border-b md:border-slate-100 md:last:border-0 hover:bg-slate-50/70 dark:md:border-white/5 dark:hover:bg-white/5 p-4 md:p-0"
            >
              {columns.map((col) => (
                <td
                  key={col.key}
                  className={`flex justify-between items-center md:table-cell px-0 md:px-3 py-2 md:py-2.5 align-top text-charcoal dark:text-ivory ${
                    col.secondary ? 'hidden md:table-cell' : ''
                  }`}
                >
                  <span className="md:hidden font-semibold text-slate-500 dark:text-gold-light/80 text-xs uppercase">
                    {col.header}
                  </span>
                  <div className="text-right md:text-left flex-1 flex justify-end md:block">
                    {col.render ? col.render(row) : String((row as Record<string, unknown>)[col.key] ?? '—')}
                  </div>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
