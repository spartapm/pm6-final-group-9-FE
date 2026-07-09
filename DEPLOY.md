# guguletter-web 배포 가이드 (Vercel)

**Production URL:** `https://pm6-final-group-9-fe.vercel.app`  
**API URL:** `https://pm6-final-group-9-be.onrender.com`

## 1. GitHub

```bash
gh auth login
bash ../scripts/setup-github.sh
```

## 2. Vercel 프로젝트 생성

1. [vercel.com](https://vercel.com) → **Add New Project**
2. `guguletter-web` GitHub repo Import
3. Framework: **Next.js** (자동 감지)

## 3. 환경변수 (Production)

| Key | Value |
|-----|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | anon public key |
| `NEXT_PUBLIC_API_URL` | `https://pm6-final-group-9-be.onrender.com` |
| `NEXT_PUBLIC_APP_URL` | `https://pm6-final-group-9-fe.vercel.app` |

> 확정 URL 상세: [docs/production-urls.md](./docs/production-urls.md)

## 4. Supabase Redirect URL

Supabase Dashboard → Authentication → URL Configuration:

- **Site URL**: `https://pm6-final-group-9-fe.vercel.app`
- **Redirect URLs** 추가:
  - `https://pm6-final-group-9-fe.vercel.app/auth/callback`
  - `http://localhost:3000/auth/callback`

## 5. API CORS 동기화

Vercel URL 확정 후 Render API env 업데이트:

```
CORS_ORIGIN=https://pm6-final-group-9-fe.vercel.app,http://localhost:3000
APP_URL=https://pm6-final-group-9-fe.vercel.app
```

## 6. 배포 검증

```bash
API_URL=https://pm6-final-group-9-be.onrender.com \
WEB_URL=https://pm6-final-group-9-fe.vercel.app \
bash ../scripts/verify-deploy.sh
```

체크리스트:

- [ ] 카카오 로그인 (온보딩)
- [ ] 홈 로드 / 쪽지함
- [ ] 친구 홈 쪽지 작성·발송
- [ ] 링크 쪽지 발송·수령
- [ ] 이모지 반응 / 신고
