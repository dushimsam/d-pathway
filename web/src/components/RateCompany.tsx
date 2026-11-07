'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Star } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { api } from '@/lib/api-client';

/**
 * Inline control for a student to rate the company they worked with. Collapsed
 * to a single button until opened; after submitting it reflects the given stars.
 * `existingRating` (if set) means the student already reviewed — shown read-only.
 */
export function RateCompany({
  projectId,
  companyName,
  existingRating,
}: {
  projectId: string;
  companyName: string;
  existingRating?: number;
}) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState('');

  const mutation = useMutation({
    mutationFn: () => api.post('/reviews', { projectId, rating, comment: comment.trim() || undefined }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['reviews', 'mine'] });
      setOpen(false);
    },
  });

  if (existingRating) {
    return (
      <div className="flex items-center gap-1.5 rounded-[8px] border border-n100 px-3 py-2 text-[13px] text-n700">
        <span>You rated {companyName}</span>
        <span className="flex items-center gap-0.5 font-medium text-n900">
          <Star className="h-3.5 w-3.5 fill-warning text-warning" />
          {existingRating}/5
        </span>
      </div>
    );
  }

  if (!open) {
    return (
      <Button variant="secondary" size="sm" onClick={() => setOpen(true)}>
        Rate {companyName}
      </Button>
    );
  }

  const shown = hover || rating;
  return (
    <div className="flex flex-col gap-2 rounded-[8px] border border-n300 p-3">
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            aria-label={`${n} star${n > 1 ? 's' : ''}`}
            onMouseEnter={() => setHover(n)}
            onMouseLeave={() => setHover(0)}
            onClick={() => setRating(n)}
            className="p-0.5"
          >
            <Star
              className={
                n <= shown
                  ? 'h-6 w-6 fill-warning text-warning'
                  : 'h-6 w-6 text-n300'
              }
            />
          </button>
        ))}
      </div>
      <textarea
        placeholder={`How was working with ${companyName}? (optional)`}
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        rows={2}
        maxLength={1000}
        className="w-full rounded-[8px] border border-n300 bg-n0 px-3 py-2 text-[14px] text-n900 focus:border-primary focus:outline-none"
      />
      {mutation.isError && (
        <p className="text-[13px] text-danger">Could not submit your review. Try again.</p>
      )}
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          disabled={rating === 0 || mutation.isPending}
          onClick={() => mutation.mutate()}
        >
          {mutation.isPending ? 'Submitting…' : 'Submit review'}
        </Button>
        <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
