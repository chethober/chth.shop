# Contributing to chth.shop

Thanks for helping out! This guide covers how to get a dev environment running and what
we expect from a pull request.

## Ground rules

- Be kind. Everyone taking part is expected to follow the [Code of Conduct](CODE_OF_CONDUCT.md).
- **Security issues go through private reporting**, not public issues. See [SECURITY.md](SECURITY.md).
- For anything bigger than a small fix, open an issue first so we can agree on the approach
  before you spend time on it.

## Getting set up

You need Node.js 22, Yarn 1 (`corepack enable`), and either Docker or a local PostgreSQL.

```bash
git clone https://github.com/chethober/chth.shop.git
cd chth.shop
yarn install
```

Then follow **Running with Docker** or **Local development** in the [README](README.md).
`docker compose exec backend npm run db:seed` loads demo artists and products. It wipes
existing data, so run it only against a dev database.

## Project layout

| Path            | Notes                                                                 |
| --------------- | --------------------------------------------------------------------- |
| `frontend/`     | Next.js app. Read [frontend/README.md](frontend/README.md) for folder layout and UI conventions (theme tokens, primitives, import direction). |
| `backend/`      | Express + Prisma API. [backend/README.md](backend/README.md) lists every endpoint. |
| `telegram-bot/` | Artist bot on Telegram Serverless (`tgcloud`). See its README and `AGENTS.md`. |

## Making a change

1. Fork the repo and branch off `main` (`feat/…`, `fix/…`, `docs/…`).
2. Keep the change focused; unrelated refactors belong in their own PR.
3. Before pushing, make sure these pass. CI runs the same steps:
   ```bash
   yarn workspace chth-frontend lint
   yarn workspace chth-frontend build
   docker compose build          # if you touched a Dockerfile, compose, or dependencies
   ```
4. Database changes: edit `backend/prisma/schema.prisma` and create a migration with
   `yarn workspace chth-backend prisma:migrate`. Commit the generated migration.
5. New environment variables go in the matching `.env.example` with a comment, and are read
   in `backend/src/config/env.js`. Never commit a real `.env`.

## Commit messages

We use [Conventional Commits](https://www.conventionalcommits.org/):
`feat:`, `fix:`, `docs:`, `refactor:`, `ci:`, `chore:`, with an optional scope such as
`fix(ci): …` or `feat(design): …`.

## Pull requests

- Fill in the PR template, and link the issue it closes.
- Add a screenshot or short clip for UI changes.
- A maintainer reviews it; please answer review comments with follow-up commits rather
  than force-pushing, so the conversation stays readable.

By contributing, you agree that your contributions are licensed under the [MIT License](LICENSE).
