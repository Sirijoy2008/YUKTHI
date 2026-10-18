import React from 'react';
import { Spinner } from './Spinner';

export interface Column<T> {
  key: string;
  header: string;
  className?: string;
  render?: (row: T) => React.ReactNode;
}

export interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (row: T) => string;
  isLoading?: boolean;
  emptyMessage?: string;
  caption?: string;
}

export function DataTable<T>({
  columns,
  data,
  keyExtractor,
  isLoading = false,
  emptyMessage = 'No records found',
  caption,
}: DataTableProps<T>) {
  return (
    <div className="w-full overflow-x-auto rounded-xl border border-[#E2E8F0] bg-white shadow-xs">
      <table className="w-full text-left text-sm text-[#0F172A] border-collapse">
        {caption && <caption className="sr-only">{caption}</caption>}
        <thead>
          <tr className="border-b border-[#E2E8F0] bg-[#F8FAFC]">
            {columns.map((col) => (
              <th
                key={col.key}
                scope="col"
                className={`py-3.5 px-4 font-semibold text-xs tracking-wider uppercase text-[#475569] ${col.className || ''}`}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-[#F1F5F9]">
          {isLoading ? (
            <tr>
              <td
                colSpan={columns.length}
                className="py-12 text-center text-[#64748B]"
              >
                <div className="flex flex-col items-center justify-center gap-2">
                  <Spinner size="md" />
                  <span className="text-xs font-medium">Loading records...</span>
                </div>
              </td>
            </tr>
          ) : data.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                className="py-12 text-center text-sm text-[#64748B]"
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((row) => (
              <tr
                key={keyExtractor(row)}
                className="hover:bg-[#F0F7FF]/60 transition-colors duration-150"
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={`py-3.5 px-4 text-sm align-middle ${col.className || ''}`}
                  >
                    {col.render
                      ? col.render(row)
                      : String((row as Record<string, unknown>)[col.key] ?? '—')}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
