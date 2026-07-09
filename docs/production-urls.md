# 프로덕션 URL (확정)

| 서비스 | URL |
|--------|-----|
| **Web (Vercel)** | `https://pm6-final-group-9-fe.vercel.app` |
| **API (Render)** | Render Dashboard에서 확인 → `https://<서비스명>.onrender.com` |

---

## Vercel 환경변수 (Production)

Dashboard → Project → Settings → Environment Variables:

```
NEXT_PUBLIC_APP_URL=https://pm6-final-group-9-fe.vercel.app
NEXT_PUBLIC_API_URL=https://<your-api>.onrender.com
```

변경 후 **Redeploy** 필요.

---

## Supabase URL Configuration

Dashboard → Authentication → URL Configuration:

| 항목 | 값 |
|------|-----|
| **Site URL** | `https://pm6-final-group-9-fe.vercel.app` |
| **Redirect URLs** | `https://pm6-final-group-9-fe.vercel.app/auth/callback` |
| **Redirect URLs** (로컬 유지) | `http://localhost:3000/auth/callback` |

---

## Render API 동기화 (CORS)

Vercel URL 확정 후 Render에서 설정:

```
CORS_ORIGIN=https://pm6-final-group-9-fe.vercel.app,http://localhost:3000
APP_URL=https://pm6-final-group-9-fe.vercel.app
```

---

## 배포 검증

- [ ] https://pm6-final-group-9-fe.vercel.app 온보딩/로그인
- [ ] 홈 쪽지함 로드
- [ ] 링크 쪽지 발송 시 URL이 `https://pm6-final-group-9-fe.vercel.app/l/...` 형태
