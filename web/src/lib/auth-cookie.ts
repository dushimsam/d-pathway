/** Name of the httpOnly cookie holding the API JWT. Never read in the browser. */
export const AUTH_COOKIE = 'dp_token';

export const authCookieOptions = {
  httpOnly: true,
  sameSite: 'lax' as const,
  secure: process.env.NODE_ENV === 'production',
  path: '/',
  // Matches the API's 24h token.
  maxAge: 60 * 60 * 24,
};
