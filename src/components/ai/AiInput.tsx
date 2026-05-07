'use client';

import { useState, useRef, useCallback } from 'react';

interface AiInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
}

export function AiInput({ onSend, disabled }: AiInputProps) {
  const [value, setValue] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = useCallback(() => {
    if (!value.trim() || disabled) return;
    onSend(value.trim());
    setValue('');
    textareaRef.current?.focus();
  }, [value, disabled, onSend]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="flex gap-2">
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        placeholder="Ask KCV AI to tailor your CV..."
        rows={2}
        className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-500/50 resize-none"
      />
      <button
        onClick={handleSubmit}
        disabled={!value.trim() || disabled}
        className="px-3 py-2 rounded-lg bg-amber-500 text-zinc-900 text-sm font-medium hover:bg-amber-400 disabled:opacity-40 disabled:cursor-not-allowed transition-colors self-end"
      >
        Send
      </button>
    </div>
  );
}