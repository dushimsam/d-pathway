'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from './api-client';

/** The project ids this student has bookmarked, for quick UI lookups. */
export function useSavedBriefs() {
  const query = useQuery({
    queryKey: ['saved', 'ids'],
    queryFn: () => api.get<string[]>('/catalogue/saved/ids'),
  });
  const ids = new Set(query.data ?? []);
  return { ...query, ids };
}
