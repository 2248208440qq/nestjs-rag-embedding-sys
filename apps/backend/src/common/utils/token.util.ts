import { createHash } from 'crypto';

/**
 * Hash a token using SHA-256.
 *
 * Used to derive a fixed-length lookup key from raw tokens (access tokens
 * for blacklisting, refresh tokens for Redis storage).  The raw token is
 * never stored — only its hash — so a Redis compromise does not leak
 * usable tokens.
 */
export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}
