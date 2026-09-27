# URGENT: Register and login return 500 — auth is completely down

## Summary

Since the latest deploy (2026-09-22), **every** `POST /register`,
`POST /register-teacher` and `POST /login` request returns:

```
500 Internal Server Error
```

No body, no `detail` — looks like an unhandled exception (a broken DB
migration or a bad constraint from the latest change).

Verified continuously for 15+ minutes (10+ attempts, multiple fresh accounts,
both student and teacher flows). `GET /` and `GET /openapi.json` still return
200, so the service itself is up — only the DB-touching auth endpoints fail.

Reproduction:

```bash
curl -X POST https://api-4hjf.onrender.com/register \
  -H "Content-Type: application/json" \
  -d '{"full_name":"Test User","email":"test.user@example.com","password":"Secret123!"}'
# → 500 Internal Server Error

curl -X POST https://api-4hjf.onrender.com/login \
  -H "Content-Type: application/json" \
  -d '{"email":"any@user.com","password":"anything"}'
# → 500 Internal Server Error (even for wrong credentials — it 500s before auth check)
```

## Impact

Nobody can register or log in — the app is unusable.

## Likely cause

The most recent migration (adding `teacher_id` / backfill on `groups`) probably
left the schema in an inconsistent state — e.g. a foreign key on
`groups.teacher_id` pointing at a table/constraint name that doesn't match, or
a NOT NULL constraint added while NULL rows still exist.

## Suggested checks

1. Look at the server logs for the actual traceback behind the 500s.
2. Run the app locally against a copy of the prod DB — the exception should
   reproduce immediately.
3. Verify the last migration applied cleanly (`alembic`/migration history).
4. After fixing: `GET /`, register, login, and `GET /groups` should all return
   200 again.
