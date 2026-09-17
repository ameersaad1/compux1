# Security

## Current implementation

| Area | Implementation |
|---|---|
| Password storage | `bcrypt`, 12 rounds. Never logged (see `logger.ts` redaction list), never included in any API response. |
| Session tokens | Short-lived (15 min) signed JWT access token + long-lived random opaque refresh token, rotated on every use, stored server-side only as a SHA-256 hash so a leaked database row can't be replayed. |
| Cookie flags | `httpOnly`, `sameSite=lax`, `secure` in production. Tokens are never readable by client-side JavaScript, which removes the most common XSS-token-theft path. |
| Brute force | 10 login attempts / 10 min per IP (route-level), plus a 5-failed-attempt account lockout (15 min) independent of IP. |
| Enumeration | Login and registration return the same generic error regardless of whether the email exists. |
| OTP | 6-digit, Redis-backed, 5-minute TTL, constant-time comparison, 5-attempt cap, separate rate limit on resend. |
| Input validation | Every mutating route validates its body/query with a Zod schema before touching the database. |
| Authorization | Role checks (`STUDENT` / `MODERATOR` / `ADMIN`) run server-side via middleware on every protected route, including all of `/api/v1/admin/*`. A user's role in a JWT can't be forged without the signing secret. |
| Headers | `helmet` with a restrictive CSP (`default-src 'self'`, no inline scripts, no framing). |
| Uploads | Presigned, single-use, time-limited S3 PUT URLs; MIME type and size (8 MB) enforced server-side before a URL is even issued. Files never pass through the API process. |
| Concurrency | Event RSVPs and group joins run inside serializable/optimistic transactions so two simultaneous requests can't both claim the last seat. |
| Error handling | Unexpected errors are logged with full detail server-side; the client only ever receives a generic message in production (no stack traces, no SQL, no internal paths). |
| SQL injection | Not applicable in the classic sense — all queries go through Prisma's parameterized query builder; no raw string-concatenated SQL exists in this codebase. |

## Reporting a vulnerability

Please do not open a public GitHub issue for a security report. Email the maintainer directly with:
1. A description of the issue and its potential impact.
2. Steps to reproduce.
3. Any suggested remediation.

We'll acknowledge within a reasonable timeframe before any public disclosure.

## Deployment checklist

Before pointing this at real users:

- [ ] Rotate every placeholder secret in `.env` (JWT secrets, SMTP credentials, AWS keys).
- [ ] Put the API behind HTTPS end-to-end (the `secure` cookie flag depends on it).
- [ ] Configure `CLIENT_URL` / CORS to the real production origin only.
- [ ] Run `prisma migrate deploy` (not `migrate dev`) against production.
- [ ] Point logs (`pino` output) at a real aggregator and set up alerting on 5xx spikes and repeated 401s.
- [ ] Add automated dependency scanning (`npm audit` / Dependabot/Snyk) to CI.
- [ ] Load-test the RSVP and like endpoints specifically — they're the two paths with explicit concurrency handling and are worth verifying under real contention.
