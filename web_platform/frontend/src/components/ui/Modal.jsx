import React, { useEffect } from 'react';

export function Modal({ isOpen = false, onClose, title, children, footer, className = '' }) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen && onClose) onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[var(--z-modal)] flex items-center justify-center p-4">
      {/* Backdrop with 16px blur */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-md transition-opacity animate-fade-in"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className={`relative z-10 w-full max-w-lg glass-card p-6 border border-[var(--glass-border)] shadow-2xl rounded-2xl bg-[var(--bg-surface)] text-[var(--text-main)] transition-all animate-scale-in ${className}`}>
        <div className="flex items-center justify-between pb-4 border-b border-[var(--border-subtle)]">
          <h3 className="text-lg font-bold text-[var(--text-main)] tracking-tight">{title}</h3>
          <button
            onClick={onClose}
            className="text-[var(--text-muted)] hover:text-[var(--text-main)] p-1 rounded-lg hover:bg-[var(--bg-surface-hover)] transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="py-4 space-y-4 max-h-[70vh] overflow-y-auto">{children}</div>

        {footer && <div className="pt-4 border-t border-[var(--border-subtle)] flex items-center justify-end gap-3">{footer}</div>}
      </div>
    </div>
  );
}
