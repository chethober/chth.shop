// Commands for guests and artists. Each takes (ctx) built by handlers/message.js:
// { message, user, args, reply }.

import { SHOP_URL, LOGIN_CALLBACK_URL, DEFAULT_LOW_STOCK, MAX_STOCK, isAdmin } from './config.js';
import { esc, money, parsePrice, parseCount, itemLine, displayName } from './format.js';
import { canSell, canManageItem, updateUser } from './users.js';
import { setSession, clearSession } from './session.js';
import { notifyAdmins } from './notify.js';
import {
  getItem, listItems, listLowStock, createItem, setPrice, setStock, adjustStock,
  setLowStock, renameItem, recordSale, salesSummary, recentSales,
} from './inventory.js';
import { itemView, itemsView, settingsView, registrationKeyboard } from './ui.js';
import { GUEST_COMMANDS, ARTIST_COMMANDS, ADMIN_COMMANDS } from './menu.js';

const MAX_NAME = 80;

/** Resolves `/cmd <id> …` to an item the user may manage, replying with the reason if not. */
async function itemArg(ctx, usage) {
  const id = parseCount(ctx.args[0]);
  if (id == null) {
    await ctx.reply(`Usage: <code>${esc(usage)}</code>`);
    return null;
  }
  const item = await getItem(id);
  if (!canManageItem(ctx.user, item)) {
    await ctx.reply(`Item <code>#${id}</code> not found among your items. See /items.`);
    return null;
  }
  return item;
}

/** One-tap website sign-in. Telegram signs the user's data into the button's URL. */
export async function login(ctx) {
  const sent = await ctx.reply(
    '🔐 <b>Sign in to CHTH</b>\nTap the button within 10 minutes. Your account is matched by your Telegram ID.',
    {
      reply_markup: {
        inline_keyboard: [[{
          text: '🔓 Sign in to chth.shop',
          login_url: { url: LOGIN_CALLBACK_URL, request_write_access: true },
        }]],
      },
    },
  );
  // Telegram refuses login buttons (BOT_DOMAIN_INVALID) until the domain is linked in @BotFather.
  if (!sent) {
    await ctx.reply('Sign-in through the bot isn\'t available right now — use the Telegram button on the website instead.', {
      reply_markup: { inline_keyboard: [[{ text: '🌐 Open chth.shop', url: `${SHOP_URL}/auth` }]] },
    });
  }
}

export async function start(ctx) {
  // Deep link from the website: t.me/<bot>?start=login
  if (ctx.args[0] === 'login') return login(ctx);

  const { user } = ctx;
  const name = esc(user.firstName || 'there');
  const lines = [`👋 Hi ${name}! This is the <b>CHTH</b> artist bot.`, ''];

  if (isAdmin(user.id)) {
    lines.push('You are an <b>admin</b>. Open /admin for the dashboard, or /setup to install the command menus.');
  } else if (user.role === 'artist') {
    lines.push(`Your store <b>${esc(user.storeName)}</b> is active.`, 'Manage stock with /items, record sales with /sale.');
  } else if (user.role === 'pending') {
    lines.push('Your artist application is waiting for review — you\'ll get a message here once it\'s approved.');
  } else if (user.role === 'banned') {
    lines.push('Your account is suspended. Contact the CHTH team if you think this is a mistake.');
  } else {
    lines.push(
      'Manage your merch, prices and stock, and get notified about every sale.',
      '',
      'Apply with <code>/register Your Store Name</code>.',
    );
  }
  lines.push('', `🛍 ${SHOP_URL} · /login to sign in on the website`);
  await ctx.reply(lines.join('\n'));
}

export async function help(ctx) {
  const section = (title, list) =>
    [`<b>${title}</b>`, ...list.map(([c, d]) => `/${c} — ${esc(d)}`)].join('\n');

  const parts = [section('General', GUEST_COMMANDS)];
  if (canSell(ctx.user)) parts.push(section('Store', ARTIST_COMMANDS.filter(([c]) => c !== 'help' && c !== 'login')));
  if (isAdmin(ctx.user.id)) parts.push(section('Admin', ADMIN_COMMANDS));
  await ctx.reply(parts.join('\n\n'));
}

export async function register(ctx) {
  const { user } = ctx;
  if (user.role === 'artist' || isAdmin(user.id)) return ctx.reply('You can already sell — try /items.');
  if (user.role === 'banned') return ctx.reply('Your account is suspended.');
  if (user.role === 'pending') return ctx.reply('Your application is already under review.');

  const storeName = ctx.args.join(' ').trim().slice(0, MAX_NAME);
  if (!storeName) return ctx.reply('Usage: <code>/register Your Store Name</code>');

  await updateUser(user.id, { role: 'pending', storeName });
  await ctx.reply(`📝 Application for <b>${esc(storeName)}</b> sent. You'll be notified here when it's reviewed.`);
  await notifyAdmins(
    `🆕 <b>Artist application</b>\n${esc(displayName({ ...user, storeName }))}\nUser id: <code>${user.id}</code>`,
    { reply_markup: registrationKeyboard(user.id) },
  );
}

export async function items(ctx) {
  const view = itemsView(await listItems(ctx.user.id));
  await ctx.reply(view.text, { reply_markup: view.reply_markup });
}

export async function additem(ctx) {
  const raw = ctx.args.join(' ').trim();
  if (!raw) {
    await setSession(ctx.user.id, 'add_name');
    return ctx.reply('🆕 New item. What\'s it called?\n\n<i>Tip: in one go — <code>/additem Name | price | stock</code>. /cancel to stop.</i>');
  }

  const [name, priceRaw, stockRaw = '0', lowRaw] = raw.split('|').map((s) => s.trim());
  const priceCents = parsePrice(priceRaw);
  const stock = parseCount(stockRaw);
  const lowStock = lowRaw == null ? DEFAULT_LOW_STOCK : parseCount(lowRaw);
  if (!name || priceCents == null || stock == null || lowStock == null || stock > MAX_STOCK) {
    return ctx.reply('Usage: <code>/additem Name | price | stock [| low-stock alert]</code>\ne.g. <code>/additem Tour Tee | 35 | 20</code>');
  }

  const item = await createItem({ ownerId: ctx.user.id, name: name.slice(0, MAX_NAME), priceCents, stock, lowStock });
  const view = await itemView(item, ctx.user);
  await ctx.reply(`✅ Added.\n\n${view.text}`, { reply_markup: view.reply_markup });
}

/** Steps of the /additem wizard, driven by the session state. */
export async function additemStep(ctx, session) {
  const text = (ctx.message.text || '').trim();
  const data = session.data || {};

  if (session.state === 'add_name') {
    if (!text) return ctx.reply('Send the item name as text.');
    await setSession(ctx.user.id, 'add_price', { name: text.slice(0, MAX_NAME) });
    return ctx.reply(`Price for <b>${esc(text.slice(0, MAX_NAME))}</b>? (e.g. <code>35</code> or <code>24.99</code>)`);
  }
  if (session.state === 'add_price') {
    const priceCents = parsePrice(text);
    if (priceCents == null) return ctx.reply('That isn\'t a valid price. Try e.g. <code>35</code> or <code>24.99</code>.');
    await setSession(ctx.user.id, 'add_stock', { ...data, priceCents });
    return ctx.reply('How many in stock?');
  }
  if (session.state === 'add_stock') {
    const stock = parseCount(text);
    if (stock == null || stock > MAX_STOCK) return ctx.reply('Send a whole number, e.g. <code>20</code>.');
    await clearSession(ctx.user.id);
    const item = await createItem({ ownerId: ctx.user.id, name: data.name, priceCents: data.priceCents, stock });
    const view = await itemView(item, ctx.user);
    return ctx.reply(`✅ Added.\n\n${view.text}`, { reply_markup: view.reply_markup });
  }
}

/** Replies to "send the new price/stock" prompts opened by the item card buttons. */
export async function itemFieldStep(ctx, session) {
  const text = (ctx.message.text || '').trim();
  const item = await getItem(session.data?.itemId);
  if (!canManageItem(ctx.user, item)) {
    await clearSession(ctx.user.id);
    return ctx.reply('That item is gone.');
  }

  let updated;
  if (session.state === 'set_price') {
    const priceCents = parsePrice(text);
    if (priceCents == null) return ctx.reply('Send a valid price, e.g. <code>35</code>, or /cancel.');
    updated = await setPrice(item, priceCents, ctx.user.id);
  } else {
    const stock = parseCount(text);
    if (stock == null || stock > MAX_STOCK) return ctx.reply('Send a whole number, or /cancel.');
    updated = await setStock(item, stock);
  }

  await clearSession(ctx.user.id);
  const view = await itemView(updated, ctx.user);
  await ctx.reply(`✅ Updated.\n\n${view.text}`, { reply_markup: view.reply_markup });
}

export async function price(ctx) {
  const item = await itemArg(ctx, '/price <id> <price>');
  if (!item) return;
  const priceCents = parsePrice(ctx.args[1]);
  if (priceCents == null) return ctx.reply('Usage: <code>/price &lt;id&gt; &lt;price&gt;</code>, e.g. <code>/price 3 29.99</code>');
  const updated = await setPrice(item, priceCents, ctx.user.id);
  await ctx.reply(`💵 ${esc(item.name)}: ${money(item.priceCents)} → <b>${money(updated.priceCents)}</b>`);
}

export async function stock(ctx) {
  const item = await itemArg(ctx, '/stock <id> <qty>');
  if (!item) return;
  const qty = parseCount(ctx.args[1]);
  if (qty == null || qty > MAX_STOCK) return ctx.reply('Usage: <code>/stock &lt;id&gt; &lt;qty&gt;</code>');
  const updated = await setStock(item, qty);
  await ctx.reply(`📦 ${esc(item.name)}: ${item.stock} → <b>${updated.stock}</b>`);
}

export async function restock(ctx) {
  const item = await itemArg(ctx, '/restock <id> <qty>');
  if (!item) return;
  const qty = parseCount(ctx.args[1]);
  if (!qty) return ctx.reply('Usage: <code>/restock &lt;id&gt; &lt;qty&gt;</code>');
  const updated = await adjustStock(item.id, qty);
  await ctx.reply(`📦 ${esc(item.name)}: +${qty} → <b>${updated.stock}</b> in stock`);
}

export async function threshold(ctx) {
  const item = await itemArg(ctx, '/threshold <id> <n>');
  if (!item) return;
  const n = parseCount(ctx.args[1]);
  if (n == null) return ctx.reply('Usage: <code>/threshold &lt;id&gt; &lt;n&gt;</code> — alert when stock drops to n or below.');
  await setLowStock(item, n);
  await ctx.reply(`⚠️ ${esc(item.name)}: low-stock alert at ≤ <b>${n}</b>`);
}

export async function rename(ctx) {
  const item = await itemArg(ctx, '/rename <id> <new name>');
  if (!item) return;
  const name = ctx.args.slice(1).join(' ').trim().slice(0, MAX_NAME);
  if (!name) return ctx.reply('Usage: <code>/rename &lt;id&gt; &lt;new name&gt;</code>');
  await renameItem(item, name);
  await ctx.reply(`✏️ #${item.id}: ${esc(item.name)} → <b>${esc(name)}</b>`);
}

export async function sale(ctx) {
  const item = await itemArg(ctx, '/sale <id> [qty] [price each]');
  if (!item) return;
  const qty = ctx.args[1] == null ? 1 : parseCount(ctx.args[1]);
  const unitCents = ctx.args[2] == null ? null : parsePrice(ctx.args[2]);
  if (!qty || (ctx.args[2] != null && unitCents == null)) {
    return ctx.reply('Usage: <code>/sale &lt;id&gt; [qty] [price each]</code>, e.g. <code>/sale 3 2</code>');
  }

  const result = await recordSale({ itemId: item.id, qty, unitCents, recordedBy: ctx.user.id });
  if (result.error) return ctx.reply(`❌ ${esc(result.error)}`);
  await ctx.reply(
    `💰 Recorded ${qty} × ${esc(item.name)} — <b>${money(result.sale.totalCents)}</b>\n📦 ${result.item.stock} left`,
  );
}

export async function lowstock(ctx) {
  const list = await listLowStock(ctx.user.id);
  if (list.length === 0) return ctx.reply('✅ Nothing is running low.');
  await ctx.reply(`⚠️ <b>Running low</b>\n\n${list.map(itemLine).join('\n')}`);
}

export function summaryText(summary, days, recent) {
  const lines = [
    `📈 <b>Last ${days} day${days === 1 ? '' : 's'}</b>`,
    '',
    `Sales: <b>${summary.orders}</b> · Units: <b>${summary.units}</b>`,
    `Revenue: <b>${money(summary.revenue)}</b>`,
  ];
  if (summary.top.length) {
    lines.push('', '<b>Top items</b>');
    summary.top.forEach((row, i) => {
      lines.push(`${i + 1}. ${esc(row.name)} — ${Number(row.units)} sold · ${money(row.revenue)}`);
    });
  }
  if (recent?.length) {
    lines.push('', '<b>Latest</b>');
    for (const s of recent) {
      const date = s.createdAt.toISOString().slice(0, 10);
      lines.push(`${date} · ${s.qty} × ${esc(s.itemName)} · ${money(s.totalCents)}`);
    }
  }
  return lines.join('\n');
}

export function parseDays(arg, fallback = 7) {
  const days = arg == null ? fallback : parseCount(arg);
  return days && days <= 3650 ? days : null;
}

export async function salesReport(ctx) {
  const days = parseDays(ctx.args[0]);
  if (!days) return ctx.reply('Usage: <code>/sales [days]</code>, e.g. <code>/sales 30</code>');
  const summary = await salesSummary({ ownerId: ctx.user.id, days });
  const recent = await recentSales({ ownerId: ctx.user.id, limit: 5 });
  await ctx.reply(summaryText(summary, days, recent));
}

export async function settings(ctx) {
  const view = settingsView(ctx.user);
  await ctx.reply(view.text, { reply_markup: view.reply_markup });
}

export async function cancel(ctx) {
  await clearSession(ctx.user.id);
  await ctx.reply('Cancelled.');
}
