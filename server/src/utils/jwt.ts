import jwt from 'jsonwebtoken';
import crypto from 'node:crypto';
import { env } from '../config/env.js';

export interface AccessTokenPayload {
  sub: string; // userId
  role: string;
  tokenVersion?: number;
}

export class TokenService {
  /** Short-lived token sent as a Bearer/cookie and checked on every request. */
  static signAccessToken(payload: AccessTokenPayload): string {
    return jwt.sign(payload, env.JWT_ACCESS_SECRET, { expiresIn: env.JWT_ACCESS_TTL, algorithm: 'HS256' });
  }

  /**
   * The `algorithms` allow-list is passed explicitly (not left to the
   * token's own `alg` header) so a token that claims `alg: none` or an
   * asymmetric algorithm can never be accepted - a classic JWT "algorithm
   * confusion" bypass. jsonwebtoken already defends against this for HMAC
   * secrets, but pinning it here makes the guarantee explicit and future-proof
   * against a library change or someone swapping the secret for a public key.
   */
  static verifyAccessToken(token: string): AccessTokenPayload {
    return jwt.verify(token, env.JWT_ACCESS_SECRET, { algorithms: ['HS256'] }) as AccessTokenPayload;
  }

  /**
   * Refresh tokens are random opaque strings, not JWTs: the server is the
   * only party that ever needs to read them, and only their SHA-256 hash is
   * persisted, so a leaked database row can never be replayed as a token.
   */
  static generateRefreshToken(): { token: string; hash: string } {
    const token = crypto.randomBytes(48).toString('hex');
    const hash = TokenService.hashRefreshToken(token);
    return { token, hash };
  }

  static hashRefreshToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  static refreshTtlToDate(): Date {
    const ttl = env.JWT_REFRESH_TTL; // e.g. "30d"
    const match = /^(\d+)([smhd])$/.exec(ttl);
    const amount = match ? Number(match[1]) : 30;
    const unit = match ? match[2] : 'd';
    const multiplier = { s: 1000, m: 60_000, h: 3_600_000, d: 86_400_000 }[unit as 's' | 'm' | 'h' | 'd'];
    return new Date(Date.now() + amount * multiplier);
  }
}
