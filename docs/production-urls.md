# 프로덕션 URL (확정)

| 서비스 | URL |
|--------|-----|
| **Web (Vercel)** | `https://pm6-final-group-9-fe.vercel.app` |
| **API (Render)** | `https://pm6-final-group-9-be.onrender.com` |

---

## Vercel 환경변수 (Production)

```
NEXT_PUBLIC_APP_URL=https://pm6-final-group-9-fe.vercel.app
NEXT_PUBLIC_API_URL=https://pm6-final-group-9-be.onrender.com
```

변경 후 **Redeploy** 필요.

---

## Supabase URL Configuration

| 항목 | 값 |
|------|-----|
| **Site URL** | `https://pm6-final-group-9-fe.vercel.app` |
| **Redirect URLs** | `https://pm6-final-group-9-fe.vercel.app/auth/callback` |
| **Redirect URLs** (로컬 유지) | `http://localhost:3000/auth/callback` |

---

## Render API (CORS 동기화)

```
CORS_ORIGIN=https://pm6-final-group-9-fe.vercel.app,http://localhost:3000
APP_URL=https://pm6-final-group-9-fe.vercel.app
```

---

## 배포 검증

- [ ] https://pm6-final-group-9-fe.vercel.app 온보딩/로그인
- [ ] https://pm6-final-group-9-be.onrender.com/health → `{ ok: true }`
- [ ] 링크 쪽지 발송 시 URL이 `https://pm6-final-group-9-fe.vercel.app/l/...` 형태
