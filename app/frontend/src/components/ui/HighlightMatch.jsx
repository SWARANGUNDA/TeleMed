import React from 'react';

/**
 * High-performance string highlighter for real-time Elasticsearch-style search matching.
 * Matches multi-token substrings with a glowing highlight mark.
 */
export function HighlightMatch({ text, query, className = '' }) {
  if (!query || !text) return <>{text}</>;
  const cleanQ = String(query).trim();
  if (!cleanQ) return <>{text}</>;

  try {
    const tokens = cleanQ.split(/\s+/).filter(Boolean);
    if (!tokens.length) return <>{text}</>;

    const escapedTokens = tokens
      .map(t => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
      .sort((a, b) => b.length - a.length);

    const regex = new RegExp(`(${escapedTokens.join('|')})`, 'gi');
    const parts = String(text).split(regex);
    const tokenSet = new Set(tokens.map(t => t.toLowerCase()));

    return (
      <span className={className}>
        {parts.map((part, i) =>
          tokenSet.has(part.toLowerCase()) ? (
            <mark
              key={i}
              className="bg-[var(--primary)]/20 text-[var(--primary)] font-extrabold px-1 py-0.5 rounded border border-[var(--primary)]/30 shadow-xs"
            >
              {part}
            </mark>
          ) : (
            <React.Fragment key={i}>{part}</React.Fragment>
          )
        )}
      </span>
    );
  } catch (e) {
    return <>{text}</>;
  }
}

export default HighlightMatch;
