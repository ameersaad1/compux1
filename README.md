# Compux — Campus Social Network

A university social network: posts, follows, study groups, events with seat-limited RSVPs, real-time direct messaging, notifications, and an admin console — built on a real, independently-runnable backend (no mock data, no client-side "fake auth").

## Architecture

This is a two-service monorepo:

```
compux/
├── server/    Express + TypeScript API — PostgreSQL (Prisma), Redis, Socket.IO
└── client/    React 19 + TypeScript + Tailwind SPA
```

The client never stores or trusts any user data on its own. Every screen — including the login/register screens — reads and writes through the API in `server/`. There is no seeded "developer login" anywhere in the shipped code path; the only accounts that exist are the ones created through `/auth/register` (or the local-only seed script, see below).

## Tech stack

| Layer | Choice | Why |
|---|---|---|
| API | Express + TypeScript | explicit, well-understood middleware pipeline |
| Database | PostgreSQL via Prisma | relational integrity for follows/likes/RSVPs, type-safe queries |
| Sessions | Redis | OTP codes, rate-limit counters |
| Auth | bcrypt + JWT (access + rotating refresh tokens) + Google Sign-In | industry-standard, revocable sessions |
| Realtime | Socket.IO | authenticated direct messages & live notifications |
| Storage | AWS S3 (presigned URLs) | uploads never pass through the API process |
| Frontend | React 19, React Router, Tailwind 4 | fast, typed, no server dependency for rendering |

## Getting started

### 1. Start Postgres & Redis

```bash
docker compose up -d
```

(No Docker? Point `DATABASE_URL` / `REDIS_URL` in `server/.env` at any Postgres 14+ and Redis 6+ instance instead.)

### 2. Configure environment variables

```bash
cp server/.env.example server/.env
cp client/.env.example client/.env
```

Fill in `server/.env` at minimum with real values for `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET` (`openssl rand -base64 48`). SMTP, Google OAuth, and AWS S3 are optional for local development — without them, OTP codes are logged to the server console instead of emailed, Google Sign-In is simply hidden, and image uploads are disabled.

### 3. Install dependencies & set up the database

```bash
npm run install:all
npm run db:migrate
npm run db:seed   # optional: creates two local test accounts, see console output
```

### 4. Run both apps

```bash
npm run dev
```

- API: http://localhost:5000
- App: http://localhost:5173

## Security posture

See [`SECURITY.md`](./SECURITY.md) for the full breakdown. Summary of what's implemented:

- Passwords hashed with bcrypt (12 rounds); never logged, never returned by any endpoint.
- Access/refresh token pair; refresh tokens are random opaque values, stored only as SHA-256 hashes, individually revocable.
- httpOnly, sameSite, secure-in-production cookies — tokens are never reachable from JavaScript.
- Per-route rate limiting, with a much tighter limit on login/register/OTP.
- Login lockout after repeated failures; generic error messages that don't reveal whether an email is registered.
- Server-side Zod validation on every mutating endpoint.
- Helmet security headers + a restrictive Content-Security-Policy.
- Role-based authorization (`STUDENT` / `MODERATOR` / `ADMIN`) enforced server-side on every admin route — the admin UI is not a trust boundary, the API is.
- File uploads are type/size-restricted and go directly to S3 via short-lived presigned URLs.
- Transactional, race-safe event RSVPs (no overbooking under concurrent requests) and race-safe group joins.

## What's intentionally out of scope for this milestone

Being upfront about the current boundary rather than overstating it:

- End-to-end encrypted DMs (the `crypto.ts` helper for it exists client-side but isn't wired into the chat UI yet).
- Push notifications / email digests beyond OTP and password-change emails.
- Automated test suite (unit/integration tests for the service layer are the natural next addition given how the code is already split into thin controllers + testable services).

## License

MIT
