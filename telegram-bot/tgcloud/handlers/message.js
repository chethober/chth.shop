// Routes private-chat messages to command handlers in lib/artist.js and lib/admin.js.

import { isAdmin } from '../lib/config.js';
import { touchUser, canSell } from '../lib/users.js';
import { getSession } from '../lib/session.js';
import { send } from '../lib/notify.js';
import * as artist from '../lib/artist.js';
import * as admin from '../lib/admin.js';

const PUBLIC = {
  start: artist.start,
  help: artist.help,
  login: artist.login,
  register: artist.register,
  cancel: artist.cancel,
};

const SELLER = {
  items: artist.items,
  additem: artist.additem,
  sale: artist.sale,
  price: artist.price,
  stock: artist.stock,
  restock: artist.restock,
  threshold: artist.threshold,
  rename: artist.rename,
  lowstock: artist.lowstock,
  sales: artist.salesReport,
  settings: artist.settings,
};

const ADMIN = {
  admin: admin.dashboard,
  pending: admin.pending,
  artists: admin.artists,
  approve: admin.approve,
  ban: admin.ban,
  unban: admin.unban,
  allitems: admin.allitems,
  stats: admin.stats,
  recent: admin.recent,
  broadcast: admin.broadcast,
  setup: admin.setup,
};

/** "/price@chth_bot 3 25" → { command: 'price', args: ['3', '25'] } */
function parseCommand(text) {
  const match = /^\/([a-z0-9_]+)(?:@\S+)?(?:\s+([\s\S]*))?$/i.exec(text.trim());
  if (!match) return null;
  const rest = (match[2] || '').trim();
  return { command: match[1].toLowerCase(), args: rest ? rest.split(/\s+/) : [], rest };
}

export default async function (message) {
  if (message.chat?.type !== 'private' || !message.from || message.from.is_bot) return;

  const user = await touchUser(message.from);
  const ctx = {
    message,
    user,
    args: [],
    reply: (text, extra) => send(message.chat.id, text, extra),
  };

  const text = message.text || '';
  const parsed = text.startsWith('/') ? parseCommand(text) : null;

  if (!parsed) {
    const session = canSell(user) ? await getSession(user.id) : null;
    if (session?.state.startsWith('add_')) return artist.additemStep(ctx, session);
    if (session?.state === 'set_price' || session?.state === 'set_stock') return artist.itemFieldStep(ctx, session);
    return ctx.reply('Use /help to see what I can do.');
  }

  // Keep the original spacing for free text such as /broadcast and /additem.
  ctx.args = parsed.command === 'broadcast' || parsed.command === 'additem' || parsed.command === 'register'
    ? (parsed.rest ? [parsed.rest] : [])
    : parsed.args;

  const { command } = parsed;
  if (PUBLIC[command]) return PUBLIC[command](ctx);

  if (SELLER[command]) {
    if (user.role === 'banned') return ctx.reply('Your account is suspended.');
    if (!canSell(user)) {
      return ctx.reply(user.role === 'pending'
        ? 'Your application is still under review.'
        : 'This is for approved artists. Apply with <code>/register Your Store Name</code>.');
    }
    return SELLER[command](ctx);
  }

  if (ADMIN[command] && isAdmin(user.id)) return ADMIN[command](ctx);

  return ctx.reply('Unknown command. See /help.');
}
