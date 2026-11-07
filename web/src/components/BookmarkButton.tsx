'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Bookmark } from 'lucide-react';
import { api } from '@/lib/api-client';
import { cn } from '@/lib/cn';

/** Toggle bookmarking a brief. Optimistic-ish: invalidates saved queries on success. */
export function BookmarkButton({
  projectId,
  saved,
  className,
}: {
  projectId: string;
  saved: boolean;
  className?: string;
}) {
  const qc = useQueryClient();
  const toggle = useMutation({
    mutationFn: () =>
      saved
        ? api.del(`/catalogue/saved/${projectId}`)
        : api.post('/catalogue/saved', { projectId }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['saved', 'ids'] });
      qc.invalidateQueries({ queryKey: ['saved', 'list'] });
    },
  });

  return (
    <button
      type="button"
      aria-label={saved ? 'Remove bookmark' : 'Save brief'}
      title={saved ? 'Saved' : 'Save for later'}
      disabled={toggle.isPending}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggle.mutate();
      }}
      className={cn(
        'flex h-8 w-8 shrink-0 items-center justify-center rounded-full border transition-colors',
        saved
          ? 'border-primary bg-primary-50 text-primary'
          : 'border-n300 bg-n0 text-n500 hover:text-n900',
        className,
      )}
    >
      <Bookmark className={cn('h-4 w-4', saved && 'fill-primary')} />
    </button>
  );
}
