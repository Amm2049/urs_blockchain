import { useState, useEffect, useRef } from 'react';

/**
 * A button that handles blockchain transaction lifecycle:
 * loading spinner → tx sent → confirmed → success toast / error toast.
 */
export default function TxButton({ label, loadingLabel = 'Confirming…', onClick, className = '', disabled = false, variant = 'primary' }) {
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const [success, setSuccess] = useState(false);
  const errorTimer  = useRef(null);
  const successTimer = useRef(null);

  const variantClass = {
    primary:   'btn-primary',
    secondary: 'btn-secondary',
    danger:    'btn-danger',
    success:   'btn-success',
  }[variant] || 'btn-primary';

  // Clear timers on unmount
  useEffect(() => () => {
    clearTimeout(errorTimer.current);
    clearTimeout(successTimer.current);
  }, []);

  const handleClick = async () => {
    setError('');
    setSuccess(false);
    setLoading(true);
    try {
      await onClick();
      setSuccess(true);
      successTimer.current = setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      const msg = err?.reason || err?.data?.message || err?.message || 'Transaction failed';
      setError(msg.length > 120 ? msg.slice(0, 120) + '…' : msg);
      // Auto-clear error after 8 seconds
      clearTimeout(errorTimer.current);
      errorTimer.current = setTimeout(() => setError(''), 8000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-1">
      <button
        className={`${variantClass} ${className}`}
        onClick={handleClick}
        disabled={disabled || loading}
      >
        {loading && (
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
        )}
        {loading ? loadingLabel : label}
      </button>

      {/* Success toast */}
      {success && (
        <div className="flex items-center gap-1.5 text-xs text-emerald-400 animate-fade-in">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
          </svg>
          Transaction confirmed!
        </div>
      )}

      {/* Error message with dismiss button */}
      {error && (
        <div className="flex items-start gap-1.5 text-xs text-red-400 max-w-xs">
          <span className="flex-1 break-words">{error}</span>
          <button
            onClick={() => { setError(''); clearTimeout(errorTimer.current); }}
            className="flex-shrink-0 text-red-400/60 hover:text-red-400 transition-colors leading-none mt-0.5"
            aria-label="Dismiss error"
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
}
