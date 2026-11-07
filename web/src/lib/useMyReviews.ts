'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from './api-client';

/**
 * The company reviews this student has already written, indexed by project id,
 * so the UI shows "you rated" instead of offering a rate button that would fail.
 */
export function useMyReviews() {
  const query = useQuery({
    queryKey: ['reviews', 'mine'],
    queryFn: () => api.get<Array<{ projectId: string; rating: number }>>('/reviews/mine'),
  });

  const byProjectId = new Map<string, number>();
  for (const r of query.data ?? []) byProjectId.set(r.projectId, r.rating);

  return { ...query, byProjectId };
}
