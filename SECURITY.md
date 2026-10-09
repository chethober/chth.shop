# Security Policy

## Supported versions

Only the latest commit on `main` gets security fixes.

## Reporting a vulnerability

**Please don't open a public issue for security problems.**

Report them privately through GitHub:
[**Report a vulnerability**](https://github.com/chethober/chth.shop/security/advisories/new)
(on the repo's *Security* tab).

Please include:

- what the issue is and which part it affects (frontend, backend API, Telegram bot, Docker setup)
- steps to reproduce it, or a proof of concept
- the impact as you understand it

You should get an acknowledgement within a few days. We'll keep you posted while we work on a
fix and credit you in the advisory unless you'd rather stay anonymous.

## Scope notes

- Secrets (`JWT_SECRET`, `SESSION_SECRET`, OAuth client secrets, `TELEGRAM_BOT_TOKEN`) are
  read from environment variables and must never be committed. If you find one in the repo or
  its history, report it as above.
- The demo seed (`npm run db:seed`) creates sample data only and is not meant for production.
