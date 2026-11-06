'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from './api-client';
import type { MyApplication } from './types';

/**
 * The current student's applications, indexed by project id. Lets any screen
 * reflect "you already applied" without waiting for a backend rejection.
 * Shared query key so one fetch serves the catalogue, project page and dashboard.
 */
export function useMyApplications() {
  const query = useQuery({
    queryKey: ['applications', 'mine'],
    queryFn: () => api.get<MyApplication[]>('/applications/mine'),
  });

  const byProjectId = new Map<string, MyApplication>();
  for (const app of query.data ?? []) {
    byProjectId.set(app.project.id, app);
  }

  return { ...query, byProjectId };
}
