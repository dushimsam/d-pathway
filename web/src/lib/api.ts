import type { Pathway, PathwayStatus } from './types';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000/api/v1';

export type PathwaysResult =
  | { ok: true; pathways: Pathway[] }
  | { ok: false; reason: 'unreachable' };

/**
 * Fetches pathways from the API, optionally filtered by status.
 * Never throws: if the API is unreachable, returns { ok: false } so the
 * page can render a friendly notice instead of crashing.
 */
export async function getPathways(
  status?: PathwayStatus,
): Promise<PathwaysResult> {
  const query = status ? `?status=${status}` : '';
  try {
    const response = await fetch(`${API_URL}/pathways${query}`, {
      cache: 'no-store',
    });
    if (!response.ok) {
      return { ok: false, reason: 'unreachable' };
    }
    const pathways = (await response.json()) as Pathway[];
    return { ok: true, pathways };
  } catch {
    return { ok: false, reason: 'unreachable' };
  }
}
