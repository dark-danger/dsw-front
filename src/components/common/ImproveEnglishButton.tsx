import React, { useState } from 'react';
import { Sparkles, Loader2, Check } from 'lucide-react';
import { apiRequest } from '../../lib/api';

interface ImproveEnglishButtonProps {
  text: string;
  onImproved: (improvedText: string) => void;
  context?: string;
  size?: 'sm' | 'xs';
  disabled?: boolean;
  className?: string;
}

export const ImproveEnglishButton: React.FC<ImproveEnglishButtonProps> = ({
  text,
  onImproved,
  context,
  size = 'xs',
  disabled = false,
  className = '',
}) => {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleImprove = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const trimmed = (text || '').trim();
    if (!trimmed) {
      alert('Please enter some text first before clicking Improve.');
      return;
    }

    setLoading(true);
    setSuccess(false);

    try {
      const res = await apiRequest<{ original_text: string; improved_text: string }>(
        '/ai/improve-english',
        'POST',
        {
          text: trimmed,
          context: context || undefined,
        }
      );

      if (res && res.improved_text) {
        onImproved(res.improved_text);
        setSuccess(true);
        setTimeout(() => setSuccess(false), 2000);
      }
    } catch (err: any) {
      console.error('Failed to improve text:', err);
      alert(err.message || 'Could not improve text. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  const isTextEmpty = !text || text.trim().length === 0;

  return (
    <button
      type="button"
      onClick={handleImprove}
      disabled={disabled || loading || isTextEmpty}
      title={
        isTextEmpty
          ? 'Enter text to enable AI improvement'
          : 'Refine grammar, spelling, and polish phrasing using Gemini AI'
      }
      className={`inline-flex items-center gap-1.5 font-semibold transition-all rounded-lg shadow-2xs select-none ${
        size === 'xs' ? 'px-2 py-1 text-[11px]' : 'px-2.5 py-1.5 text-xs'
      } ${
        loading
          ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30 cursor-wait'
          : success
          ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 border border-emerald-500/40'
          : isTextEmpty || disabled
          ? 'opacity-40 cursor-not-allowed bg-[var(--card-bg-to)] text-[var(--text-muted)] border border-[var(--panel-border)]'
          : 'bg-gradient-to-r from-purple-500/15 to-indigo-500/15 hover:from-purple-500/25 hover:to-indigo-500/25 text-purple-700 dark:text-purple-300 border border-purple-500/30 hover:border-purple-500/50 hover:scale-[1.02] active:scale-[0.98]'
      } ${className}`}
    >
      {loading ? (
        <>
          <Loader2 className="w-3 h-3 animate-spin text-purple-400" />
          <span>Polishing...</span>
        </>
      ) : success ? (
        <>
          <Check className="w-3 h-3 text-emerald-500" />
          <span>Polished!</span>
        </>
      ) : (
        <>
          <Sparkles className="w-3 h-3 text-purple-500 dark:text-purple-400" />
          <span>Improve</span>
        </>
      )}
    </button>
  );
};
