# CHTH artist bot

Telegram bot that artists use to manage merch: items, prices, stock, sales reports,
plus alerts for sales and low or sold-out stock. It runs on
[Telegram Serverless](https://core.telegram.org/bots/serverless) (`tgcloud`), with its
own SQLite database. Telegram hosts both, so there's no server to run.

## Commands

**Everyone:** `/start`, `/login` (sign in to the website), `/register <store name>`
(asks the admins for approval), `/help`.

**Artists** (after approval):

| Command | What it does |
|---|---|
| `/items` | List items. Tap one to open a card with −1/+1/+10 stock, Sell, Price, Hide and Delete. |
| `/additem` | Step-by-step wizard, or one line: `/additem Tour Tee \| 35 \| 20 [\| low-stock alert]` |
| `/sale <id> [qty] [price each]` | Record a sale. Decrements stock and refuses to oversell. |
| `/price <id> <price>` | Change a price (logged in `price_changes`). |
| `/stock <id> <qty>` · `/restock <id> <qty>` | Set stock, or add to it. |
| `/threshold <id> <n>` | Low-stock alert level (default 3). |
| `/rename <id> <name>`, `/lowstock`, `/sales [days]`, `/settings`, `/cancel` | |

**Admins** (`ADMIN_IDS` in `tgcloud/lib/config.js`): `/admin` dashboard, `/pending`,
`/approve <id>`, `/ban <id>`, `/unban <id>`, `/artists`, `/allitems [id]`,
`/stats [days]`, `/recent`, `/broadcast <text>`, `/setup`. Admins can manage any item.

## Website sign-in

The website's **Sign in via bot** button calls `/api/auth/telegram/bot`. That redirects to
`t.me/<bot>?start=login`, and the bot replies with a Telegram
[`login_url`](https://core.telegram.org/bots/api#loginurl) button. When the user taps it,
Telegram opens `/api/auth/telegram/bot/callback` with their user data signed by the bot
token. The backend checks the signature (links expire after 10 minutes) and signs the
user in. Accounts are matched by Telegram ID, so this lands on the same account as the
Telegram OIDC button.

What it needs:
- `TELEGRAM_BOT_TOKEN` set in the backend.
- `chth.shop` linked to the bot in @BotFather → Bot Settings → Domain. Until it is,
  Telegram rejects the button (`BOT_DOMAIN_INVALID`) and `/login` falls back to a link
  to the website. Change `LOGIN_CALLBACK_URL` in `tgcloud/lib/config.js` if the domain
  is different.

## Notifications

All notifications are sent when the change that causes them happens. The platform
has no cron, so there are no digests.

- 💰 **Sale**: goes to the item's artist and to the admins.
- ⚠️ **Low stock** / 🚫 **Sold out** / ✅ **Back in stock**: goes to the artist when
  stock crosses the item's threshold.
- 🆕 **Artist application**: goes to the admins, with Approve and Reject buttons.
- 🛒 **Website orders**: sent by the backend, not by this bot
  (`backend/src/services/telegram-notify.service.js`). It's on when
  `TELEGRAM_BOT_TOKEN` and `TELEGRAM_ADMIN_IDS` are set in `backend/.env`. It
  messages each artist whose `User.telegramId` is set, plus the admins.

Telegram only lets a bot message people who have pressed **Start**. Anyone who blocks
the bot is marked unreachable and skipped.

Stock in this bot is separate from the website database, which has no stock column.

## Deploy

```sh
cd telegram-bot
npm install --no-workspaces
npx tgcloud login            # paste the app…: CLI token (BotFather → bot → Serverless → CLI Access)
npx tgcloud push             # deploy code
npx tgcloud migrate          # apply tgcloud/schema.js changes (push never touches the DB)
npx tgcloud webhook          # should say "in sync"
```

Then send `/setup` to the bot from an admin account to install the command menus.

- **CI:** use `TGCLOUD_TOKEN=app…:… npx tgcloud push` instead of `login`.
- **Proxy:** behind an HTTP proxy, Node 24 also needs `NODE_USE_ENV_PROXY=1`.
- **Never commit the token.** `.tgcloud/` is gitignored.

Platform rules (no npm packages at runtime, no foreign keys, `.js` relative imports):
see `AGENTS.md` and `docs/tgcloud-sdk.md`.
