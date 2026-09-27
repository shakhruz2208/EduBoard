# Add password-reset endpoints (FastAPI)

Frontend is already built — implement this contract exactly, add nothing else.

## 1) POST /forgot-password

Request body: `{ "email": "user@example.com" }`

- Email exists → create reset token (random 32-byte url-safe, expires in 60 min,
  single-use), store only its HASH in a new `password_reset_tokens` table
  (user_id, token_hash, expires_at, used_at), and email the link
  `{FRONTEND_URL}/reset-password?token=<token>` (send in a background task).
- Email does NOT exist → do nothing, but respond identically (never reveal it).
- Response in both cases: `200 { "message": "If that email exists, a reset link has been sent." }`
- Rate limit: max 3 per 10 min per email → `429 { "detail": "..." }`

## 2) POST /reset-password

Request body: `{ "token": "...", "new_password": "..." }` (min 8 chars → else 422)

- Token valid + unused + unexpired → hash the new password with bcrypt (same
  setup as register/login), mark the token used, respond
  `200 { "message": "Password has been reset." }`
- Token invalid / expired / already used → `400 { "detail": "Reset link is invalid or has expired." }`

## Rules

- ⚠️ EMAIL MUST GO VIA HTTP API, NOT SMTP: Render free tier blocks outbound
  SMTP ports 25/465/587, so SMTP-based sending (Gmail, smtplib, etc.) silently
  fails in a background task — the endpoint still returns 200 but no email is
  delivered. Use Resend HTTP API instead (port 443): `pip install resend`.
- Email sending env vars: `RESEND_API_KEY`, `EMAIL_FROM`, `FRONTEND_URL`
  (SMTP_HOST/PORT/USER/PASSWORD no longer used — remove them from Render).
- Never log tokens or passwords.
- New table via Alembic migration.
- Don't change `/login`, `/register`, `/users/me/password`.

### Email sending example (FastAPI)

```python
import os
import resend

resend.api_key = os.getenv("RESEND_API_KEY")

# Background task for /forgot-password:
def send_reset_email(to_email: str, token: str):
    frontend_url = os.getenv("FRONTEND_URL")
    from_email = os.getenv("EMAIL_FROM", "onboarding@resend.dev")
    resend.Emails.send({
        "from": from_email,
        "to": [to_email],
        "subject": "Password reset",
        "html": f'<p>Click <a href="{frontend_url}/reset-password?token={token}">here</a> to reset your password.</p>',
    })
```

Note: with the free "onboarding@resend.dev" sender you can only email your own
account's address — for real users add and verify a domain in Resend, then set
`EMAIL_FROM` to an address on that domain.

## Status codes summary

| Case | Status |
|---|---|
| forgot: any email | 200 |
| forgot: too many requests | 429 |
| reset: success | 200 |
| reset: bad/expired/used token | 400 |
| reset: short password / missing fields | 422 |
