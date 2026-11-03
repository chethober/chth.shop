// Points the bot at this server and turns the shop into its Mini App:
//   npm run telegram:setup
// Needs TELEGRAM_BOT_TOKEN, TELEGRAM_WEBHOOK_SECRET, a public HTTPS PUBLIC_API_URL (or FRONTEND_URL)
// and TELEGRAM_MINI_APP_URL (the HTTPS site; defaults to the first FRONTEND_URL).
// Also register the Mini App with @BotFather (/newapp) for t.me/<bot>/<name> links, and set the
// Login Widget domain with /setdomain.
const env = require('../src/config/env');
const { COMMANDS } = require('../src/controllers/telegram-bot.controller');

async function call(method, body) {
  const response = await fetch(`https://api.telegram.org/bot${env.telegram.botToken}/${method}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await response.json();
  console.log(`${method}: ${data.ok ? 'ok' : `FAILED ${data.description}`}`);
  if (!data.ok) process.exitCode = 1;
}

async function main() {
  if (!env.telegram.botToken || !env.telegram.webhookSecret) {
    throw new Error('Set TELEGRAM_BOT_TOKEN and TELEGRAM_WEBHOOK_SECRET first');
  }
  if (!env.telegram.miniAppUrl.startsWith('https://') || !env.publicApiUrl.startsWith('https://')) {
    throw new Error('Telegram needs public HTTPS URLs (TELEGRAM_MINI_APP_URL and PUBLIC_API_URL / FRONTEND_URL)');
  }

  await call('setWebhook', {
    url: `${env.publicApiUrl}/telegram/webhook`,
    secret_token: env.telegram.webhookSecret,
    allowed_updates: ['message'],
  });
  await call('setChatMenuButton', {
    menu_button: { type: 'web_app', text: 'Shop', web_app: { url: `${env.telegram.miniAppUrl}/shop` } },
  });
  await call('setMyCommands', {
    commands: Object.keys(COMMANDS)
      .filter((name) => name !== 'start')
      .map((name) => ({ command: name, description: { shop: 'Browse the marketplace', design: '3D design studio', orders: 'Your orders', sell: 'Open a store', help: 'Help' }[name] })),
  });
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
