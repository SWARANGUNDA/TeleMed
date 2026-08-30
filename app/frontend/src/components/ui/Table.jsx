import React from 'react';

export function Table({ headers = [], children, className = '' }) {
  return (
    <div className={`w-full overflow-x-auto border border-[var(--border-subtle)] rounded-xl bg-[var(--bg-surface)] ${className}`}>
      <table className="w-full text-left text-sm text-[var(--text-main)] border-collapse">
        {headers.length > 0 && (
          <thead className="sticky top-0 z-10 bg-[var(--bg-primary)] text-xs uppercase font-semibold text-[var(--text-muted)] border-b border-[var(--border-subtle)]">
            <tr>
              {headers.map((h, i) => (
                <th key={i} className="px-4 py-3 font-mono">{h}</th>
              ))}
            </tr>
          </thead>
        )}
        <tbody className="divide-y divide-[var(--border-subtle)]">{children}</tbody>
      </table>
    </div>
  );
}

export function TableRow({ children, className = '' }) {
  return <tr className={`hover:bg-[var(--bg-surface-hover)] transition-colors ${className}`}>{children}</tr>;
}

export function TableCell({ children, className = '' }) {
  return <td className={`px-4 py-3.5 align-middle ${className}`}>{children}</td>;
}
