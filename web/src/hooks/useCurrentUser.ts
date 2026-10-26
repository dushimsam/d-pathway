'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import type { CurrentUser } from '@/lib/types';

export function useCurrentUser() {
  return useQuery({
    queryKey: ['currentUser'],
    queryFn: () => api.get<CurrentUser>('/auth/me'),
  });
}
