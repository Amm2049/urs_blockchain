import { useEffect, useRef } from 'react';
import { ExclamationTriangleIcon, XCircleIcon, XMarkIcon } from '@heroicons/react/24/outline';

/**
 * Beautiful confirmation dialog modal.
 *
 * Props:
 *   open        – boolean, controls visibility
 *   title       – string, dialog heading
 *   message     – string | ReactNode, body text
 *   confirmLabel – string (default "Confirm")
 *   cancelLabel  – string (default "Cancel")
 *   variant      – "danger" | "warning" (default "danger")
 *   onConfirm   – () => void
 *   onCancel    – () => void
 */
export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'danger',
  icon: CustomIcon,
  loading = false,
  onConfirm,
  onCancel,
}) {
  const cancelRef = useRef(null);

  // Focus cancel button when opened (accessibility)
  useEffect(() => {
    if (open) {
      setTimeout(() => cancelRef.current?.focus(), 50);
    }
  }, [open]);

  // Close on Escape key
  useEffect(() => {
    if (!open || loading) return;
    const handler = (e) => { if (e.key === 'Escape') onCancel?.(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, loading, onCancel]);

  if (!open) return null;

  const isDanger  = variant === 'danger';
  const isWarning = variant === 'warning';
  const isBrand   = variant === 'brand' || variant === 'info';

  const Icon      = CustomIcon || (isDanger ? XCircleIcon : isWarning ? ExclamationTriangleIcon : SparklesIcon);
  
  const iconBg    = isDanger 
    ? 'bg-red-500/15' 
    : isWarning 
    ? 'bg-amber-500/15' 
    : 'bg-brand-500/15';
    
  const iconColor = isDanger 
    ? 'text-red-400'  
    : isWarning 
    ? 'text-amber-400' 
    : 'text-brand-400';
    
  const confirmBg = isDanger
    ? 'bg-red-500/20 border border-red-500/40 text-red-300 hover:bg-red-500/35'
    : isWarning
    ? 'bg-amber-500/20 border border-amber-500/40 text-amber-300 hover:bg-amber-500/35'
    : 'bg-brand-gradient text-white hover:opacity-90 shadow-[0_0_15px_rgba(16,185,129,0.2)]';

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      aria-modal="true"
      role="dialog"
      aria-labelledby="confirm-title"
    >
      {/* Blurred dark overlay */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={() => !loading && onCancel?.()}
      />

      {/* Dialog panel */}
      <div className="relative w-full max-w-md animate-slide-up">
        <div className="glass-card border border-white/[0.10] p-6 shadow-2xl">

          {/* Close button */}
          <button
            onClick={onCancel}
            disabled={loading}
            className="absolute top-4 right-4 text-white/30 hover:text-white/70 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            aria-label="Close"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>

          {/* Icon + Title */}
          <div className="flex items-start gap-4 mb-4">
            <div className={`flex-shrink-0 w-11 h-11 rounded-xl ${iconBg} flex items-center justify-center`}>
              <Icon className={`w-6 h-6 ${iconColor}`} />
            </div>
            <div>
              <h3 id="confirm-title" className="font-semibold text-white text-base leading-snug">
                {title}
              </h3>
              {message && (
                <div className="text-sm text-white/60 mt-1 leading-relaxed">{message}</div>
              )}
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-white/[0.07] my-5" />

          {/* Actions */}
          <div className="flex items-center justify-end gap-3">
            <button
              ref={cancelRef}
              onClick={onCancel}
              disabled={loading}
              className="px-4 py-2 rounded-xl text-sm font-medium bg-white/[0.06] border border-white/[0.10]
                         text-white/70 hover:text-white hover:bg-white/[0.10] transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {cancelLabel}
            </button>
            <button
              onClick={onConfirm}
              disabled={loading}
              className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150 active:scale-95 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${confirmBg}`}
            >
              {loading && (
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              )}
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
