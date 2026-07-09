# guguletter-web

Next.js 15 (App Router) frontend for 구구레터.

## Setup

```bash
cp .env.example .env.local
# fill Supabase + API URL
npm install
npm run dev
```

## Routes

| Path | Description |
|------|-------------|
| `/` | 로그인 여부에 따라 `/splash` 또는 `/home` 리다이렉트 |
| `/splash` | 스플래시 후 `/home` 또는 `/onboarding` |
| `/onboarding` | 온보딩 슬라이드 + 카카오 로그인 |
| `/login` | Kakao login landing |
| `/auth/callback` | OAuth callback |
| `/home` | My home (received/sent tabs, status message, home link share) |
| `/u/[userId]` | Public home (id or home_slug) |
| `/write` | Write letter (direct link mode or friend home via `?to=`) |
| `/write/preview` | *(미구현)* `/write`로 리다이렉트 |
| `/send/complete` | Send success (direct / link) |
| `/letters/received/[id]` | Received detail + reaction + share |
| `/letters/sent/[id]` | Sent detail |
| `/l/[token]` | Claim link letter |
| `/settings` | Nickname, inquiry, logout, withdraw |
| `/settings/terms` | 서비스 이용약관 · 개인정보 처리방침 |

## Notes

- Auth uses Supabase Kakao provider via `@supabase/ssr`.
- Business APIs call `guguletter-api` with Bearer access token.
- Letter draft is persisted in zustand (`localStorage`) across login redirects.
- Bottom navigation is shown on `/home` and `/write` (no receiver).

## Deploy

Vercel 배포 가이드: [DEPLOY.md](./DEPLOY.md)

```bash
# GitHub push (gh auth login 후)
bash ../scripts/setup-github.sh
```
