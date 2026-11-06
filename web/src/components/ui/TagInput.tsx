'use client';

import { useState, type KeyboardEvent } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/cn';

/**
 * A chip/tag input: type a value and press Enter or comma to commit it as a
 * chip. Accepts pasted comma-separated lists, dedupes case-insensitively, and
 * Backspace on an empty field removes the last chip. Values keep their spaces
 * (e.g. "Software Engineering"), so only commas separate entries.
 */
export function TagInput({
  id,
  value,
  onChange,
  disabled,
  placeholder,
}: {
  id?: string;
  value: string[];
  onChange: (next: string[]) => void;
  disabled?: boolean;
  placeholder?: string;
}) {
  const [draft, setDraft] = useState('');

  function add(raw: string) {
    const parts = raw
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    if (parts.length === 0) {
      setDraft('');
      return;
    }
    const seen = new Set(value.map((v) => v.toLowerCase()));
    const next = [...value];
    for (const part of parts) {
      if (!seen.has(part.toLowerCase())) {
        next.push(part);
        seen.add(part.toLowerCase());
      }
    }
    onChange(next);
    setDraft('');
  }

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      add(draft);
    } else if (e.key === 'Backspace' && draft === '' && value.length > 0) {
      onChange(value.slice(0, -1));
    }
  }

  return (
    <div
      className={cn(
        'flex min-h-10 w-full flex-wrap items-center gap-1.5 rounded-[8px] border border-n300 bg-n0 px-2 py-1.5 text-[14px]',
        'focus-within:border-primary focus-within:ring-2 focus-within:ring-primary-50',
        disabled && 'bg-n100 opacity-60',
      )}
      onClick={() => {
        if (!disabled) document.getElementById(id ?? '')?.focus();
      }}
    >
      {value.map((tag) => (
        <span
          key={tag}
          className="inline-flex items-center gap-1 rounded-full bg-primary-50 px-2.5 py-1 text-[13px] text-primary-dark"
        >
          {tag}
          {!disabled && (
            <button
              type="button"
              aria-label={`Remove ${tag}`}
              onClick={(e) => {
                e.stopPropagation();
                onChange(value.filter((t) => t !== tag));
              }}
              className="text-primary-dark/70 hover:text-primary-dark"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </span>
      ))}
      <input
        id={id}
        value={draft}
        disabled={disabled}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={onKeyDown}
        onBlur={() => add(draft)}
        placeholder={value.length === 0 ? placeholder : ''}
        className="min-w-[140px] flex-1 bg-transparent px-1 py-0.5 text-n900 outline-none placeholder:text-n500"
      />
    </div>
  );
}
